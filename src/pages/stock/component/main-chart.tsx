import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useKChartContext } from "../lib"
import { useIndicator, useTime } from "@/store"
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query"
import { getStockChart, getStockIndicatorData, StockChartInterval } from "@/api"
import { useLatest, useMount, useUnmount, useUpdateEffect } from "ahooks"
import { useDomSize, useStockBarSubscribe } from "@/hooks"
import { initOptions, renderAxisLine, renderChart, renderGrid, renderMainChart, renderMainCoiling, renderMainIndicators, renderMarkLine, renderOverlay, renderOverlayMark, renderSecondary, renderSecondaryLocalIndicators, renderWatermark, renderZoom } from "../lib/render"
import { SecondaryIndicator } from "./secondary-indicator"
import { renderUtils } from "../lib/utils"
import { StockSelect } from "@/components"
import { cn } from "@/utils/style"
import { TimeIndexMenu } from "./time-index"
import echarts from "@/utils/echarts"
import { stockUtils, type StockSubscribeHandler } from "@/utils/stock"
import { series, throttle } from "radash"
import dayjs from "dayjs"


interface MainChartProps {
  index: number
}

export const MainChart = (props: MainChartProps) => {
  const [size, dom] = useDomSize<HTMLDivElement>()
  const chart = useRef<echarts.ECharts>()
  const queryClient = useQueryClient()
  const lastIndex = useRef<number>()

  useMount(() => {
    chart.current = echarts.init(dom.current) as unknown as echarts.ECharts
    chart.current.meta = {
      tooTip: {
        dataIndex: undefined
      }
    }
    chart.current.on('mouseover', (e) => {
      lastIndex.current = e.dataIndex
    })

    chart.current.on('mouseout', (e) => {
      lastIndex.current = undefined
    })

    chart.current.setOption({
      ...initOptions()
    }, {lazyUpdate: true})
  })

  useUnmount(() => {
    chart.current?.off('mouseover')
    chart.current?.off('mouseout')
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
    gzencode: true
  }
  const queryKey = [getStockChart.cacheKey, params]
  const query = useQuery({
    queryKey,
    queryFn: () => getStockChart(params)
  })


  const subscribeSymbol = useMemo(() => `${state.symbol}@${state.timeIndex <= 0 ? 1 : state.timeIndex}`, [state.symbol, state.timeIndex])


  const subscribeHandler: StockSubscribeHandler<'bar'> = useCallback((data) => {
    const stock = stockUtils.toStock(data.rawRecord)

    if (!query.data || query.data.history.length === 0) return
    if (!lastMainHistory.current || lastMainHistory.current.length === 0) return
  
    const lastData = stockUtils.toStock(lastMainHistory.current[lastMainHistory.current.length - 1])
    const s = stockUtils.toShortRawRecord(stock)

    s[0] = dayjs(s[0]).valueOf().toString()

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
  }, [state.timeIndex, setMainData, props.index, query.data])

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

    chart.current.meta!.yAxis = {
      left: state.yAxis.left,
      right: state.yAxis.right
    }

    // 优化卡顿，不要删除
    chart.current.meta!.mainData = state.mainData.history

    const [start, end] = chart.current.getOption() ? renderUtils.getZoom(chart.current.getOption()) : [90, 100]

    // chart.current?.clear()

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

    /**
     * TODO: 附图指标x轴max需要和主图一致
     * 盘中数据实时更新，附图指标会落后几个数据，max根据数据量计算会导致x轴对不齐
     */
    chart.current.setOption(_options, { replaceMerge: ['series', 'grid', 'xAxis', 'yAxis']})
    console.log(chart.current.getOption())
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


  // TODO 监听dataZoom事件
  // useEffect(() => {
  //   if (!chart.current) return

  //   /**
  //    * 1.01，x轴100%是query.data.length * 1.01，100%的时候要向左偏移0.01
  //    * 所以对应data的100%其实是100/1.01 = 98.02%
  //    * 所以差值是100 - 98.02 = 1.98
  //    * TODO: 算法不对，需要重新计算 
  //    */
  //   chart.current.on('dataZoom', (e: any) => {
  //     let start = e.start
  //     let end = e.end
  //     if (e.batch) {
  //       start = e.batch[0].start
  //       end = e.batch[0].end
  //     }
  //     console.log(start, end)
  //     chart.current!.meta = {
  //       dataZoom: {
  //         start,
  //         end
  //       }
  //     }


  //     // const series = renderAxisLine(state, start, end)

  //     // const startValue = series.data![0]!

  //     // chart.current?.setOption({
  //     //   series,
  //     //   yAxis: [
  //     //     {},
  //     //     {
  //     //       axisLabel: {
  //     //         formatter: (value: number) => {
  //     //           return `{${value >= +startValue ? 'u' : 'd'}|${value.toFixed(2)}%}`
  //     //         }
  //     //       }
  //     //     }
  //     //   ],
  //     // })
  //   })

  //   return () => {
  //     chart.current?.off('dataZoom')
  //   }
  // }, [])

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