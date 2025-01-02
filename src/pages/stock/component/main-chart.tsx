import { useEffect, useMemo, useRef, useState } from "react"
import { useKChartContext } from "../lib"
import { useIndicator, useTime } from "@/store"
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { getStockChart, getStockIndicatorData, StockChartInterval } from "@/api"
import { useMount, useUnmount, useUpdateEffect } from "ahooks"
import { useDomSize, useStockBarSubscribe } from "@/hooks"
import { renderChart, renderGrid, renderMainChart, renderMainCoiling, renderMainIndicators, renderMarkLine, renderOverlay, renderOverlayMark, renderSecondary, renderSecondaryLocalIndicators, renderWatermark, renderZoom } from "../lib/render"
import { SecondaryIndicator } from "./secondary-indicator"
import { renderUtils } from "../lib/utils"
import { StockSelect } from "@/components"
import { cn } from "@/utils/style"
import { TimeIndexMenu } from "./time-index"
import echarts from "@/utils/echarts"
import { stockManager } from "@/utils/stock"
import dayjs from "dayjs"
import { mapEntries } from "radash"

interface MainChartProps {
  index: number
}

export const MainChart = (props: MainChartProps) => {
  const [size, dom] = useDomSize<HTMLDivElement>()
  const chart = useRef<echarts.ECharts>()
  const queryClient = useQueryClient()

  useMount(() => {
    chart.current = echarts.init(dom.current)
  })

  useUnmount(() => {
    chart.current?.dispose()
  })

  const { state: ctxState, setMainData, setIndicatorData, setSecondaryIndicator, removeOverlayStock, setActiveChart, setSymbol, activeChartIndex } = useKChartContext()
  const { usTime } = useTime()
  const state = ctxState[props.index]
  const startTime = renderUtils.getStartTime(usTime, state.timeIndex)

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


  const subscribeSymbol = useMemo(() => `${state.symbol}@${state.timeIndex}`, [state.symbol, state.timeIndex])

  useStockBarSubscribe([subscribeSymbol], (data) => {
    const stock = stockManager.toSimpleStockRecord(data.rawRecord)
    const qData = queryClient.getQueryData(queryKey) as typeof query.data

    if (!qData || qData.history.length === 0) return

    const lastData = stockManager.toSimpleStockRecord(qData.history[qData.history.length - 1])
    if (state.timeIndex === StockChartInterval.ONE_MIN) {
      // 当前分钟大于最后一条数据的分钟
      if (lastData.toDayjs().isBefore(stock.toDayjs(), 'minute')) {
        queryClient.setQueryData(queryKey, {
          ...qData,
          history: [...qData.history, data.rawRecord]
        })
      }
    }
  })

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



  useMount(() => {
    if (chart.current) {
      chart.current.on('legendselectchanged', (e: any) => {
        if (!e.selected[e.name]) {
          removeOverlayStock({ index: props.index, symbol: e.name })
        }
      })
      render()
    }
  })

  useUpdateEffect(() => {
    chart.current?.resize()
    render()
  }, [size])

  useEffect(() => {
    setMainData({ index: props.index, data: query.data })
  }, [query.data, props.index, setMainData])

  const render = () => {
    if (!chart.current) return

    const [start, end] = chart.current.getOption() ? renderUtils.getZoom(chart.current.getOption()) : [90, 100]

    chart.current?.clear()

    const _options = renderChart()
    renderGrid(_options, state, [chart.current.getWidth(), chart.current.getHeight()])
    renderMainChart(_options, state)
    renderMarkLine(_options, state)
    renderZoom(_options, [start, end])
    // /**
    //  * 画主图指标
    //  */
    renderOverlay(_options, state.overlayStock)
    renderMainCoiling(_options, state)

    renderMainIndicators(_options, Object.values(state.mainIndicators))
    renderOverlayMark(_options, state)
    renderSecondary(_options, state.secondaryIndicators)
    renderSecondaryLocalIndicators(_options, state.secondaryIndicators, state)
    renderWatermark(_options, state.timeIndex)
    chart.current.setOption(_options)
  }

  useUpdateEffect(() => {
    render()
  }, [state])

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

    </div>
  )
}