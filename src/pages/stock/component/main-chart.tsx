import { getStockChart, StockChartInterval } from "@/api"
import { StockSelect } from "@/components"
import { useDomSize, useStockBarSubscribe } from "@/hooks"
import { useIndicator, useTime } from "@/store"
import { type StockSubscribeHandler, stockUtils } from "@/utils/stock"
import { cn } from "@/utils/style"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useMount, useSize, useUnmount, useUpdateEffect } from "ahooks"
import * as kCharts from 'klinecharts'
import { lazy, useCallback, useEffect, useMemo, useRef, useState } from "react"
import { isTimeIndexChart, useKChartContext } from "../lib"
import { renderUtils } from "../lib/utils"
import { SecondaryIndicator } from "./secondary-indicator"
import { TimeIndexMenu } from "./time-index"
import { defaultOptions, mainDefaultOptions, renderMainChart, renderMainCoiling, xAxisDefaultOptions } from "../lib/render"
import echarts from "@/utils/echarts"


interface MainChartProps {
  index: number
}

export const MainChart = (props: MainChartProps) => {
  // const [size, dom] = useDomSize<HTMLDivElement>()
  const dom = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts>()
  const containerDom = useRef<HTMLDivElement>(null)
  const xAxisDom = useRef<HTMLDivElement>(null)
  const xAxisChart = useRef<echarts.ECharts>()
  const usTime = useTime(s => s.usTime)
  const localStamp = useTime(s => s.localStamp)
  const queryClient = useQueryClient()
  const { state: ctxState, setMainData, setIndicatorData, setSecondaryIndicator, removeOverlayStock, setActiveChart, setSymbol, activeChartIndex } = useKChartContext()
  const state = ctxState[props.index]
  const startTime = renderUtils.getStartTime(new Date().valueOf() - localStamp + usTime, state.timeIndex)
  const size = useSize(containerDom)

  const params = useMemo(() => ({
    start_at: startTime,
    ticker: state.symbol,
    interval: state.timeIndex,
    gzencode: true
  }), [startTime, state.symbol, state.timeIndex])

  const queryKey = useMemo(() => [getStockChart.cacheKey, params], [params])

  const query = useQuery({
    queryKey,
    queryFn: () => getStockChart(params)
  })

  const subscribeSymbol = useMemo(() => `${state.symbol}@${state.timeIndex <= 0 ? 1 : state.timeIndex}`, [state.symbol, state.timeIndex])

  const subscribeHandler: StockSubscribeHandler<'bar'> = useCallback((data) => {
    const stock = stockUtils.toSimpleStockRecord(data.rawRecord)


    if (!query.data || query.data.history.length === 0) return

    const lastData = stockUtils.toSimpleStockRecord(query.data.history[query.data.history.length - 1])

    if (!renderUtils.isSameTimeByInterval(lastData.toDayjs(), stock.toDayjs(), state.timeIndex)) {
      setMainData({
        index: props.index, data: {
          ...query.data,
          history: [...query.data.history as any, [stock.time!, ...(data.rawRecord.slice(1)) as any]]
        }
      })
    } else {
      setMainData({
        index: props.index, data: {
          ...query.data,
          history: [...query.data.history.slice(0, -1) as any, [stock.time!, ...(data.rawRecord.slice(1)) as any]]
        }
      })
    }
  }, [state.timeIndex, query.data, setMainData, props.index])


  useStockBarSubscribe([subscribeSymbol], subscribeHandler)

  useEffect(() => {
    setMainData({ index: props.index, data: query.data })
  }, [query.data, setMainData, props.index])

  /**
   * echart 相关
   */
  useMount(() => {
    if (!dom.current) return
    if (!xAxisDom.current) return
    chart.current = echarts.init(dom.current)
    chart.current.group = `stock-chart-${props.index}`
    chart.current.setOption(mainDefaultOptions())

    xAxisChart.current = echarts.init(xAxisDom.current)
    xAxisChart.current.group = `stock-chart-${props.index}`
    xAxisChart.current.setOption(xAxisDefaultOptions())
    console.log('connect', `stock-chart-${props.index}`)
    echarts.connect(`stock-chart-${props.index}`)
  })

  useUnmount(() => {
    echarts.disconnect(`stock-chart-${props.index}`)
    console.log('disconnect', `stock-chart-${props.index}`)
    chart.current?.dispose()
    xAxisChart.current?.dispose()
    
  })

  useUpdateEffect(() => {
    chart.current?.resize()
    xAxisChart.current?.resize()
  }, [size])


  useEffect(() => {
    if (!chart.current) return
    const isTimeIndex = isTimeIndexChart(state.timeIndex) && state.timeIndex !== StockChartInterval.FIVE_DAY
    const type = state.type === 'k-line' ? 'candlestick' : 'line'
    const mainSeries = renderMainChart({
      data: state.mainData.history,
      isTimeIndex,
      type
    }, chart.current)

    chart.current.setOption({
      xAxis: {
        data: state.mainData.history.map(v => v[0])
      },
      series: mainSeries
    })
    xAxisChart.current?.setOption({
      xAxis: {
        data: state.mainData.history.map(v => v[0])
      },
      series: [
        {
          type: 'line',
          data: state.mainData.history.map(() => 0),
          symbol: 'none',
          lineStyle: {
            color: 'transparent'
          }
        }
      ]
    })


  }, [state.mainData, state.timeIndex, state.type])

  useEffect(() => {
    if (!chart.current) return
    const mainCoilingSeries = renderMainCoiling(state.mainCoiling, state.mainData, chart.current)

    
    chart.current.setOption({
      series: [
        ...mainCoilingSeries
      ]
    }, { lazyUpdate: true })

  
  }, [state.mainCoiling, state.mainData])

  /**
   * 指标参数
   */
  const { isDefaultIndicatorParams, getIndicatorQueryParams } = useIndicator()



  // const mainQueryIndicatorQueries = useQueries({
  //   queries: Reflect.ownKeys(state.mainIndicators).map(v => v.toString()).map((item) => {
  //     const queryKey = [getStockIndicatorData.cacheKey, { symbol: state.symbol, cycle: state.timeIndex, id: item, db_type: state.mainIndicators[item].type }] as any[]
  //     let params: NormalizedRecord<number> | undefined
  //     if (!isDefaultIndicatorParams(item)) {
  //       params = getIndicatorQueryParams(item)
  //       queryKey.push(params)
  //     }

  //     return {
  //       queryKey,
  //       refetchInterval: 60 * 1000,
  //       queryFn: async () => {
  //         const r = await getStockIndicatorData({
  //           symbol: state.symbol, cycle: state.timeIndex, id: item, db_type: state.mainIndicators[item].type, start_at: startTime,
  //           param: JSON.stringify(params)
  //         })

  //         return { id: item, data: r.result }
  //       },
  //       placeholderData: () => ({ id: item, data: undefined })
  //     }
  //   })
  // })

  // useEffect(() => {
  //   mainQueryIndicatorQueries.forEach((query) => {
  //     if (!query.data) return

  //     setIndicatorData({ index: props.index, indicatorId: query.data.id, data: query.data.data })
  //   })
  // }, [mainQueryIndicatorQueries, setIndicatorData, props.index])

  // const secondaryIndicatorQueries = useQueries({
  //   queries: Array.from(new Set(state.secondaryIndicators.filter(v => !renderUtils.isLocalIndicator(v.id)).map(v => `${v.id}_${v.type}`))).map((item) => {
  //     const [id, type] = item.split('_')
  //     const queryKey = [getStockIndicatorData.cacheKey, { symbol: state.symbol, cycle: state.timeIndex, id: id, db_type: type }] as any[]
  //     let params: NormalizedRecord<number> | undefined
  //     if (!isDefaultIndicatorParams(id)) {
  //       params = getIndicatorQueryParams(id)
  //       queryKey.push(params)
  //     }

  //     return {
  //       queryKey,
  //       refetchInterval: 60 * 1000,
  //       queryFn: () => getStockIndicatorData({
  //         symbol: state.symbol, cycle: state.timeIndex, id: id, db_type: type, start_at: startTime, param: JSON.stringify(params)
  //       }).then(r => ({ id: id, data: r.result })),
  //       placeholderData: () => ({ id: id, data: undefined })
  //     }
  //   })
  // })

  // useEffect(() => {
  //   secondaryIndicatorQueries.forEach((query) => {

  //     if (!query.data) return
  //     setIndicatorData({ index: props.index, indicatorId: query.data.id, data: query.data.data })
  //   })
  // }, [secondaryIndicatorQueries, setIndicatorData, props.index])



  // useMount(() => {
  //   if (chart.current) {
  //     chart.current.on('legendselectchanged', (e: any) => {
  //       if (!e.selected[e.name]) {
  //         removeOverlayStock({ index: props.index, symbol: e.name })
  //       }
  //     })
  //   }
  // })

  // useUpdateEffect(() => {
  //   chart.current?.resize()
  //   render()
  // }, [size])

  // useEffect(() => {
  //   setMainData({ index: props.index, data: query.data })
  // }, [query.data, props.index, setMainData])

  // const render = () => {
  //   if (!chart.current) return

  //   const [start, end] = chart.current.getOption() ? renderUtils.getZoom(chart.current.getOption()) : [90, 100]

  //   chart.current?.clear()

  //   const _options = renderChart()
  //   renderGrid(_options, state, [chart.current.getWidth(), chart.current.getHeight()])
  //   renderMainChart(_options, state)
  //   renderMarkLine(_options, state)
  //   renderZoom(_options, [start, end])
  //   /**
  //    * 画主图指标
  //    */
  //   renderOverlay(_options, state.overlayStock)
  //   renderMainCoiling(_options, state)

  //   renderMainIndicators(_options, Object.values(state.mainIndicators))
  //   renderOverlayMark(_options, state)
  //   renderSecondary(_options, state.secondaryIndicators)
  //   renderSecondaryLocalIndicators(_options, state.secondaryIndicators, state)
  //   renderWatermark(_options, state.timeIndex)
  //   console.log(_options)
  //   chart.current.setOption(_options)
  // }


  // useUpdateEffect(() => {
  //   render()
  // }, [state])

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


  // TODO 监听dataZoom事件
  // useEffect(() => {
  //   if (!chart.current) return

  //   if (state.yAxis.right !== 'percent') return

  //   /**
  //    * 1.01，x轴100%是query.data.length * 1.01，100%的时候要向左偏移0.01
  //    * 所以对应data的100%其实是100/1.01 = 98.02%
  //    * 所以差值是100 - 98.02 = 1.98
  //    * TODO: 算法不对，需要重新计算 
  //    */
  //   chart.current.on('dataZoom', throttle({interval: 1000}, (e: any) => {
  //     let start = e.start 
  //     let end = e.end
  //     if (e.batch) {
  //       start = e.batch[0].start
  //       end = e.batch[0].end
  //     }

  //     const series = renderAxisLine(state, start, end)

  //     const startValue = series.data![0]!

  //     chart.current?.setOption({
  //       series,
  //       yAxis: [
  //         {},
  //         {
  //           axisLabel: {
  //             formatter: (value: number) => {
  //               return `{${value >= +startValue ? 'u' : 'd'}|${value.toFixed(2)}%}`
  //             }
  //           }
  //         }
  //       ],
  //     })
  //   }))

  //   return () => {
  //     chart.current?.off('dataZoom')
  //   }
  // }, [state])

  return (
    <div className={
      cn(
        'w-full h-full relative border border-transparent border-solid box-border flex-col flex overflow-hidden',
        ctxState.length > 1 && activeChartIndex === props.index ? 'border-primary' : ''
      )
    } onClick={() => setActiveChart(props.index)} onKeyDown={() => { }} ref={containerDom}>
      <div className="w-full flex-1 box-border" ref={dom}>
      </div>
      <div className="h-[80px] flex-shrink-0" ref={xAxisDom}>

      </div>
      {/* {
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
      } */}
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