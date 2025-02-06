import { StockChartInterval, getStockChart, getStockIndicatorData } from "@/api"
import { StockSelect } from "@/components"
import { useDomSize, useStockBarSubscribe } from "@/hooks"
import { useIndicator, useTime } from "@/store"
import echarts from "@/utils/echarts"
import { type StockSubscribeHandler, stockUtils } from "@/utils/stock"
import { cn, colorUtil } from "@/utils/style"
import { useQueries, useQuery } from "@tanstack/react-query"
import { useMount, useUnmount, useUpdateEffect } from "ahooks"
import dayjs from "dayjs"
import type { EChartsType } from 'echarts/core'
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { chartEvent, kChartUtils, useKChartStore } from "../lib"
import { initOptions, renderChart, renderGrid, renderMainChart, renderMainCoiling, renderMainIndicators, renderMarkLine, renderOverlay, renderOverlayMark, renderSecondary, renderSecondaryLocalIndicators, renderWatermark, renderZoom } from "../lib/render"
import { renderUtils } from "../lib/utils"
import { IndicatorTooltip } from "./indicator-tooltip"
import { SecondaryIndicator } from "./secondary-indicator"
import { TimeIndexMenu } from "./time-index"
import type { Canvas } from 'fabric'
import { initGraphicTool } from "../lib/graphic"

interface MainChartProps {
  index: number
}

export const MainChart = (props: MainChartProps) => {
  const [size, dom] = useDomSize<HTMLDivElement>()
  const chart = useRef<EChartsType>()
  const canvas = useRef<Canvas>()
  useMount(() => {
    chart.current = echarts.init(dom.current, null, {devicePixelRatio: 3})
    chart.current.meta = {} as any
    

    chart.current.meta.event = chartEvent.event

    chartEvent.event.on('tooltip', (params: any) => {
      chartEvent.event.emit('data', params)
    })

    chart.current.on('globalout', (e) => {
      // 检测鼠标是否在图表内
      const toElement = (e.event?.event as any).toElement as HTMLElement

      if (!toElement?.className.includes('main-indicator-tooltip') || !toElement?.className.includes('secondary-indicator-tool')) {
        chartEvent.event.emit('data', [])
      }
    })

    chart.current.setOption({
      ...initOptions()
    }, { lazyUpdate: true })

    // initGraphicTool(chart.current)

    // dom.current?.addEventListener('click', (e) => {

    //   const r = createLine({ start: [e.zrX, e.zrY], chart: chart.current as EChartsType })
    //   console.log(e, r)
    //   chart.current?.setOption({
    //     graphic: [
    //       r
    //     ]
    //   })
    // }, { passive: true })

  })

  useUnmount(() => {
    chart.current?.meta?.event.all.clear()
    chart.current?.dispose()
  })

  // const { state: ctxState, setMainData, setIndicatorData, setSecondaryIndicator, removeOverlayStock, setActiveChart, setSymbol, activeChartIndex } = useKChartContext()
  const { usTime } = useTime()
  const state = useKChartStore(s => s.state[props.index])

  const stateLen = useKChartStore(s => s.state.length)
  const activeChartIndex = useKChartStore(s => s.activeChartIndex)
  // const state = ctxState[props.index]
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
    queryFn: () => getStockChart(params),
    refetchInterval: 60 * 1000,
  })

  // const queryV2 = useQuery({
  //   queryKey: [getStockChartV2.cacheKey],
  //   queryFn: () => getStockChartV2({ symbol: state.symbol, period: StockPeriod.DAY, start_at: dayjs().add(-10, 'd').format('YYYY-MM-DD HH:mm:ss'), end_at: dayjs().format('YYYY-MM-DD HH:mm:ss'), time_format: 'int' })
  // })

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

    if ([StockChartInterval.PRE_MARKET, StockChartInterval.INTRA_DAY, StockChartInterval.AFTER_HOURS].includes(state.timeIndex)) {
      if (trading === 'preMarket' && state.timeIndex !== StockChartInterval.PRE_MARKET) {
        return
      }

      if (trading === 'intraDay' && state.timeIndex !== StockChartInterval.INTRA_DAY) {
        return
      }

      if (trading === 'afterHours' && state.timeIndex !== StockChartInterval.AFTER_HOURS) {
        return
      }

      if (trading === 'close') {
        return
      }
    } else {
      if (trading !== 'intraDay') {
        return
      }
    }

    if (!renderUtils.isSameTimeByInterval(dayjs(lastData.timestamp), dayjs(+s[0]), state.timeIndex)) {
      kChartUtils.setMainData({
        index: props.index, data: [...lastMainHistory.current as any, s],
        dateConvert: false, timeIndex: state.timeIndex
      })
    } else {
      kChartUtils.setMainData({
        index: props.index,
        data: [...lastMainHistory.current.slice(0, -1) as any, s],
        dateConvert: false, timeIndex: state.timeIndex
      })
    }
  }, [state.timeIndex, props.index, query.data, trading])

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

      kChartUtils.setIndicatorData({ index: props.index, indicatorId: query.data.id, data: query.data.data })
    })
  }, [mainQueryIndicatorQueries, props.index])

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
      kChartUtils.setIndicatorData({ index: props.index, indicatorId: query.data.id, data: query.data.data })
    })
  }, [secondaryIndicatorQueries, props.index])


  useUpdateEffect(() => {
    chart.current?.resize()
    render()
  }, [size])

  useEffect(() => {

    kChartUtils.setMainData({ index: props.index, data: query.data?.history, dateConvert: true, timeIndex: state.timeIndex })
  }, [query.data, props.index, state.timeIndex])

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
    if (state.mainData.history.length > 0) {

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

    }
    renderWatermark(_options, state.timeIndex)
    chart.current.setOption(_options, { replaceMerge: ['series', 'grid', 'xAxis', 'yAxis', 'dataZoom', 'graphic'] })
  }

  useUpdateEffect(() => {
    render()


  }, [state, startTime])

  const onChangeSecondaryIndicators = useCallback(async (params: { value: string, index: number, type: string, name: string }) => {

    kChartUtils.setSecondaryIndicator({
      index: props.index,
      indicatorIndex: params.index,
      indicator: { id: params.value, type: params.type, timeIndex: state.timeIndex, symbol: state.symbol, key: state.secondaryIndicators[params.index].key, name: params.name }
    })
  }, [props.index, state.symbol, state.timeIndex, state.secondaryIndicators])

  const [selectSymbol, setSelectSymbol] = useState<string | undefined>(state.symbol)

  useUpdateEffect(() => {
    setSelectSymbol(state.symbol)
  }, [state.symbol])


  const closeOverlayStock = (symbol: string) => {
    kChartUtils.removeOverlayStock({ index: props.index, symbol: symbol })
  }

  // const mouse = useMouse(containerRef)

  // useEffect(() => {
  //   if(!chartEvent) return

  //   if(mouse.elementX > 0 && mouse.elementX < mouse.elementW && mouse.elementY > 0 && mouse.elementY < mouse.elementH) return

  //   chartEvent.event.emit('data', undefined)
  // }, [mouse])


  return (
    <div className={
      cn(
        'w-full h-full relative border border-transparent border-solid box-border',
        stateLen > 1 && activeChartIndex === props.index ? 'border-primary' : ''
      )
    } onClick={() => kChartUtils.setActiveChart(props.index)} onKeyDown={() => { }}>
      <div className="w-full h-full" ref={dom}>
      </div>
      <canvas className="w-full h-full">
      </canvas>
      {
        state.secondaryIndicators.map((item, index, arr) => {
          const grids = renderUtils.calcGridSize(
            [chart.current?.getWidth() ?? 0, chart.current?.getHeight() ?? 0],
            arr.length,
            !!state.yAxis.left
          )
          return (
            <div key={item.key}
              className="absolute rounded-sm left-2 flex items-center secondary-indicator-tool space-x-2"
              style={{
                top: `calc(${grids[index + 1]?.top ?? 0}px + 4px)`,
                left: `calc(${grids[index + 1]?.left ?? 0}px + 4px)`,
              }}
            >
              <SecondaryIndicator onIndicatorChange={onChangeSecondaryIndicators} index={index} mainIndex={props.index} />
              <IndicatorTooltip mainIndex={props.index} index={index} key={item.key} type="secondary" indicator={item} />
            </div>
          )
        })
      }
      {
        stateLen > 1 ? (
          <div className="absolute top-2 left-2 flex items-center bg-muted border border-solid border-dialog-border rounded pr-2 h-6">
            <StockSelect className="border-none" width={80} size="mini" onChange={(v) => { kChartUtils.setSymbol({ index: props.index, symbol: v }) }} onInput={v => setSelectSymbol((v.target as any).value)} value={selectSymbol} />
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

      {
        Object.keys(state.mainIndicators).length > 0 ? (
          <div className="absolute top-4 left-2 space-y-2 main-indicator-tooltip">
            {Object.entries(state.mainIndicators).map(([key, item]) => <IndicatorTooltip mainIndex={props.index} key={key} type="main" indicator={item} />)}
          </div>
        ) : null
      }
    </div>
  )
}