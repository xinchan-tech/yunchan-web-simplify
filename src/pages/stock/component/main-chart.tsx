import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useKChartContext } from "../lib"
import { useIndicator, useTime } from "@/store"
import { useQueries, useQuery } from "@tanstack/react-query"
import { getStockChart, getStockIndicatorData, StockChartInterval } from "@/api"
import { useMount, useUnmount, useUpdateEffect } from "ahooks"
import { useDomSize, useStockBarSubscribe } from "@/hooks"
import { initOptions, renderChart, renderGrid, renderMainChart, renderMainCoiling, renderMainIndicators, renderMarkLine, renderOverlay, renderOverlayMark, renderSecondary, renderSecondaryLocalIndicators, renderWatermark, renderZoom } from "../lib/render"
import { SecondaryIndicator } from "./secondary-indicator"
import { renderUtils } from "../lib/utils"
import { StockSelect } from "@/components"
import { cn, colorUtil } from "@/utils/style"
import { TimeIndexMenu } from "./time-index"
import echarts from "@/utils/echarts"
import { stockUtils, type StockSubscribeHandler } from "@/utils/stock"
import dayjs from "dayjs"
import type { EChartsType } from 'echarts/core'


interface MainChartProps {
  index: number
}

export const MainChart = (props: MainChartProps) => {
  const [size, dom] = useDomSize<HTMLDivElement>()
  const chart = useRef<EChartsType>()

  useMount(() => {
    chart.current = echarts.init(dom.current)
    chart.current.meta = {} as any

    chart.current.setOption({
      ...initOptions()
    }, { lazyUpdate: true })

    chart.current.on('dataZoom', (e) => {
      console.log(e)
    })
  })

  useUnmount(() => {
    chart.current?.dispose()
  })

  const { state: ctxState, setMainData, setIndicatorData, setSecondaryIndicator, removeOverlayStock, setActiveChart, setSymbol, activeChartIndex } = useKChartContext()
  const { usTime } = useTime()
  const state = ctxState[props.index]
  const startTime = renderUtils.getStartTime(usTime, state.timeIndex)
  const lastMainHistory = useRef(state.mainData.history)

  useEffect(() => {
    lastMainHistory.current = state.mainData.history
  }, [state.mainData.history])

  const params = {
    start_at: startTime,
    ticker: state.symbol,
    interval: state.timeIndex,
    gzencode: false
  }
  const queryKey = [getStockChart.cacheKey, params]
  const query = useQuery({
    queryKey,
    queryFn: () => getStockChart(params)
  })

  const subscribeSymbol = useMemo(() => {
    if (state.timeIndex <= 1) {
      return `${state.symbol}@1m`
    }

    if (state.timeIndex <= StockChartInterval.FORTY_FIVE_MIN) {
      return `${state.symbol}@${state.timeIndex}m`
    }

    if (state.timeIndex === StockChartInterval.DAY) {
      return `${state.symbol}@1d`
    }

    if (state.timeIndex === StockChartInterval.WEEK) {
      return `${state.symbol}@1w`
    }

    if (state.timeIndex === StockChartInterval.MONTH) {
      return `${state.symbol}@1M`
    }

    return `${state.symbol}@${state.timeIndex}`

  }, [state.symbol, state.timeIndex])

  const trading = useTime(s => s.getTrading())


  const subscribeHandler: StockSubscribeHandler<'bar'> = useCallback((data) => {
    const stock = stockUtils.toStock(data.rawRecord)

    if (!query.data || query.data.history.length === 0) return
    if (!lastMainHistory.current || lastMainHistory.current.length === 0) return

    const lastData = stockUtils.toStock(lastMainHistory.current[lastMainHistory.current.length - 1])
    const s = stockUtils.toShortRawRecord(stock)

    s[0] = dayjs(s[0]).valueOf().toString()

    if([StockChartInterval.PRE_MARKET, StockChartInterval.INTRA_DAY, StockChartInterval.AFTER_HOURS].includes(state.timeIndex)) {
      if(trading === 'preMarket' && state.timeIndex !== StockChartInterval.PRE_MARKET) {
        return
      }

      if(trading === 'intraDay' && state.timeIndex !== StockChartInterval.INTRA_DAY) {
        return
      }

      if(trading === 'afterHours' && state.timeIndex !== StockChartInterval.AFTER_HOURS) {
        return
      }

      if(trading === 'close'){
        return
      }
    }else{
      if(trading !== 'intraDay'){
        return
      }
    }

    if (!renderUtils.isSameTimeByInterval(dayjs(lastData.timestamp), dayjs(+s[0]), state.timeIndex)) {
      setMainData({
        index: props.index, data: {
          ...query.data,
          history: [...lastMainHistory.current as any, s],
        },
        dateConvert: false
      })
    } else {
      setMainData({
        index: props.index,
        data: {
          ...query.data,
          history: [...lastMainHistory.current.slice(0, -1) as any, s]
        },
        dateConvert: false
      })
    }
  }, [state.timeIndex, setMainData, props.index, query.data, trading])

  useStockBarSubscribe([subscribeSymbol], subscribeHandler)

  const { isDefaultIndicatorParams, getIndicatorQueryParams } = useIndicator()

  const mainQueryIndicatorQueries = useQueries({
    queries: Reflect.ownKeys(state.mainIndicators).map(v => v.toString()).map((item) => {
      const queryKey = [getStockIndicatorData.cacheKey, { symbol: state.symbol, cycle: state.timeIndex, id: item, db_type: state.mainIndicators[item].type }] as any[]
      let params: NormalizedRecord<number> | undefined
      if (!isDefaultIndicatorParams(item)) {
        params = getIndicatorQueryParams(item)
        queryKey.push(params)
      }

      return {
        queryKey,
        refetchInterval: 60 * 1000,
        queryFn: async () => {
          const r = await getStockIndicatorData({
            symbol: state.symbol, cycle: state.timeIndex, id: item, db_type: state.mainIndicators[item].type, start_at: startTime,
            param: JSON.stringify(params)
          })

          return { id: item, data: r.result }
        },
        placeholderData: () => ({ id: item, data: undefined })
      }
    })
  })

  useEffect(() => {
    mainQueryIndicatorQueries.forEach((query) => {
      if (!query.data) return

      setIndicatorData({ index: props.index, indicatorId: query.data.id, data: query.data.data })
    })
  }, [mainQueryIndicatorQueries, setIndicatorData, props.index])

  const secondaryIndicatorQueries = useQueries({
    queries: Array.from(new Set(state.secondaryIndicators.filter(v => !renderUtils.isLocalIndicator(v.id)).map(v => `${v.id}_${v.type}`))).map((item) => {
      const [id, type] = item.split('_')
      const queryKey = [getStockIndicatorData.cacheKey, { symbol: state.symbol, cycle: state.timeIndex, id: id, db_type: type }] as any[]
      let params: NormalizedRecord<number> | undefined
      if (!isDefaultIndicatorParams(id)) {
        params = getIndicatorQueryParams(id)
        queryKey.push(params)
      }

      return {
        queryKey,
        refetchInterval: 60 * 1000,
        queryFn: () => getStockIndicatorData({
          symbol: state.symbol, cycle: state.timeIndex, id: id, db_type: type, start_at: startTime, param: JSON.stringify(params)
        }).then(r => ({ id: id, data: r.result })),
        placeholderData: () => ({ id: id, data: undefined })
      }
    })
  })

  useEffect(() => {
    secondaryIndicatorQueries.forEach((query) => {

      if (!query.data) return
      setIndicatorData({ index: props.index, indicatorId: query.data.id, data: query.data.data })
    })
  }, [secondaryIndicatorQueries, setIndicatorData, props.index])


  useUpdateEffect(() => {
    chart.current?.resize()
    render()
  }, [size])

  useEffect(() => {
    setMainData({ index: props.index, data: query.data, dateConvert: true })
  }, [query.data, props.index, setMainData])

  const render = () => {
    if (!chart.current) return

    chart.current.meta.yAxis = {
      left: state.yAxis.left,
      right: state.yAxis.right
    }

    chart.current.meta.timeIndex = state.timeIndex

    // 优化卡顿，不要删除
    chart.current.meta.mainData = state.mainData.history

    const [start, end] = chart.current.getOption() ? renderUtils.getZoom(chart.current.getOption()) : [90, 100]


    const _options = renderChart(chart.current)
    renderGrid(_options, state, [chart.current.getWidth(), chart.current.getHeight()], chart.current)
    renderMainChart(_options, state)
    renderMarkLine(_options, state)
    renderZoom(_options, [start, end])
    /**
     * 画主图指标
     */
    renderOverlay(_options, state.overlayStock)
    renderMainCoiling(_options, state, chart.current)

    renderMainIndicators(_options, Object.values(state.mainIndicators))
    renderOverlayMark(_options, state)
    renderSecondary(_options, state.secondaryIndicators)
    renderSecondaryLocalIndicators(_options, state.secondaryIndicators, state)
    renderWatermark(_options, state.timeIndex)
    console.log('options', _options)
    chart.current.setOption(_options, { replaceMerge: ['series', 'grid', 'xAxis', 'yAxis', 'dataZoom',] })
  }

  useUpdateEffect(() => {
    render()


  }, [state, startTime])

  const onChangeSecondaryIndicators = async (params: { value: string, index: number, type: string }) => {

    setSecondaryIndicator({
      index: props.index,
      indicatorIndex: params.index,
      indicator: { id: params.value, type: params.type, timeIndex: state.timeIndex, symbol: state.symbol, key: state.secondaryIndicators[params.index].key }
    })
  }

  const [selectSymbol, setSelectSymbol] = useState<string | undefined>(state.symbol)

  useUpdateEffect(() => {
    setSelectSymbol(state.symbol)
  }, [state.symbol])


  const closeOverlayStock = (symbol: string) => {
    removeOverlayStock({ index: props.index, symbol: symbol })
  }

  return (
    <div className={
      cn(
        'w-full h-full relative border border-transparent border-solid box-border',
        ctxState.length > 1 && activeChartIndex === props.index ? 'border-primary' : ''
      )
    } onClick={() => setActiveChart(props.index)} onKeyDown={() => { }}>
      <div className="w-full h-full" ref={dom}>
      </div>
      {
        state.secondaryIndicators.map((item, index, arr) => {
          const grids = renderUtils.calcGridSize(
            [chart.current?.getWidth() ?? 0, chart.current?.getHeight() ?? 0],
            arr.length,
            !!state.yAxis.left
          )
          return (
            <div key={item.key}
              className="absolute rounded-sm left-2"
              style={{
                top: `calc(${grids[index + 1]?.top ?? 0}px + 10px)`,
                left: `calc(${grids[index + 1]?.left ?? 0}px + 10px)`,
              }}
            >
              <SecondaryIndicator onIndicatorChange={onChangeSecondaryIndicators} index={index} mainIndex={props.index} />
            </div>
          )
        })
      }
      {
        ctxState.length > 1 ? (
          <div className="absolute top-2 left-2 flex items-center bg-muted border border-solid border-dialog-border rounded pr-2 h-6">
            <StockSelect className="border-none" width={80} size="mini" onChange={(v) => { setSymbol({ index: props.index, symbol: v }) }} onInput={v => setSelectSymbol((v.target as any).value)} value={selectSymbol} />
            <TimeIndexMenu index={props.index} />
          </div>
        ) : null
      }
      {
        state.overlayStock.length > 0 ? (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {
              state.overlayStock.map((item, index) => (
                <div key={item.symbol} className="text-sm flex items-center border border-solid border-transparent hover:border-white hover:cursor-pointer rounded-sm px-2 text-transparent hover:text-white" onClick={() => closeOverlayStock(item.symbol)} onKeyDown={() => { }}>
                  <span className="w-3 h-3 inline-block mr-1" style={{ background: colorUtil.colorPalette[index] }} />
                  <span className="pointer-events-none text-white">{item.symbol}&nbsp;</span>
                  <span className="rotate-45 text-inherit">+</span>
                </div>
              ))
            }
          </div>
        ) : null
      }

    </div>
  )
}