import { useEffect, useState } from "react"
import { useKChartContext, useSymbolQuery } from "../lib"
import dayjs from "dayjs"
import { useTime } from "@/store"
import { useQueries, useQuery } from "@tanstack/react-query"
import { getStockChart, getStockIndicatorData, StockChartInterval, type StockRawRecord } from "@/api"
import { useMount, useUpdate, useUpdateEffect } from "ahooks"
import { useChart } from "@/hooks"
import { renderChart, renderMainIndicators, renderSecondary, renderZoom } from "../lib/render"
import { SecondaryIndicator } from "./secondary-indicator"
import { nanoid } from "nanoid"
import { renderUtils } from "../lib/utils"
import type echarts from "@/utils/echarts"

const getStartTime = (usTime: number, time: StockChartInterval) => {
  if (time >= StockChartInterval.DAY || time <= StockChartInterval.INTRA_DAY) return undefined

  return dayjs(usTime).tz('America/New_York').add(-15 * time, 'day').format('YYYY-MM-DD')
}

interface MainChartProps {
  index: number
}

export const MainChart = (props: MainChartProps) => {
  const symbol = useSymbolQuery()
  const [symbolSelected, setSymbolSelected] = useState(symbol)
  const [chart, dom] = useChart()
  const { state: ctxState, setMainData, setIndicatorData, getIndicatorData, setSecondaryIndicator, activeChart } = useKChartContext()
  const { usTime } = useTime()
  const state = ctxState[props.index]
  const startTime = getStartTime(usTime, state.timeIndex)


  useEffect(() => {
    setSymbolSelected(symbol)
  }, [symbol])

  const params = {
    start_at: startTime,
    ticker: symbolSelected,
    interval: state.timeIndex,
    gzencode: true
  }

  const query = useQuery({
    queryKey: [getStockChart.cacheKey, params],
    queryFn: () => getStockChart(params)
  })

  const mainIndicators = useQueries({
    queries: Array.from(Reflect.ownKeys(state.mainIndicators).map(v => v.toString())).map((item) => (
      {
        queryKey: [getStockIndicatorData.cacheKey, { symbol: symbol, cycle: state.timeIndex, id: item, db_type: state.mainIndicators[item].type }],
        queryFn: () => getStockIndicatorData({ symbol: symbol, cycle: state.timeIndex, id: item, db_type: state.mainIndicators[item].type }).then(r => {
          setIndicatorData({ indicator: state.mainIndicators[item], data: r.result })
          return r
        }),
        placeholderData: { result: [] }
      }
    ))
  })

  const mainIndicatorsQuery = mainIndicators.every(query => !query.isLoading && !query.isFetching)

  const secondaryIndicators = useQueries({
    queries: state.secondaryIndicators.map((item) => ({
      queryKey: [getStockIndicatorData.cacheKey, { symbol: symbol, cycle: state.timeIndex, id: item.id, db_type: item.type }],
      queryFn: () => getStockIndicatorData({ symbol: symbol, cycle: state.timeIndex, id: item.id, db_type: item.type }).then(r => {
        setIndicatorData({ indicator: item, data: r.result })
        return r
      }),
      placeholderData: { result: [] }
    }))
  })

  const secondaryIndicatorsQuery = secondaryIndicators.every(query => !query.isLoading && !query.isFetching)


  useEffect(() => {
    if (!mainIndicatorsQuery && !secondaryIndicatorsQuery) return

    render()
  }, [mainIndicatorsQuery, secondaryIndicatorsQuery])


  useEffect(() => {

  })

  useMount(() => {
    if (chart.current) {
      render()
    }
  })

  useEffect(() => {
    setMainData({ index: props.index, data: query.data })
  }, [query.data, props.index, setMainData])


  // useMount(() => {

  //   if (chart.current) {
  //     chart.current?.setOption(renderChart(state, query.data, true))
  //   }


  // }, [query.data, props.index, setState])

  const render = () => {
    if (!chart.current) return

    const [start, end] = chart.current.getOption() ? renderUtils.getZoom(chart.current.getOption()) : [90, 100]

    chart.current?.clear()

    const _options = renderChart(state, query.data)
    renderZoom(_options, [start, end])
    /**
     * 画主图指标
     */
    renderMainIndicators(_options, Object.values(state.mainIndicators), Object.keys(state.mainIndicators).map(v => getIndicatorData({ indicator: state.mainIndicators[v] })))

    renderSecondary(_options, state.secondaryIndicators, state.secondaryIndicators.map(v => getIndicatorData({ indicator: v })))

    chart.current.setOption(_options)
  }

  useUpdateEffect(() => {
    render()
  }, [state])




  const onChangeSecondaryIndicators = async (params: { value: string, index: number, type: string }) => {
    const chart = activeChart()
    setSecondaryIndicator({
      index: props.index,
      indicatorIndex: params.index,
      indicator: { id: params.value, type: params.type, timeIndex: chart.timeIndex, symbol: chart.symbol }
    })
  }


  return (
    <div className="w-full h-full relative">
      <div className="w-full h-full" ref={dom}>
      </div>
      {
        activeChart().secondaryIndicators.map((item, index) => (
          <div key={item + index.toString()}
            className="absolute rounded-sm left-2"
            style={{ top: `calc(${(chart.current?.getOption() as any)?.grid[index + 1]?.top ?? 0} + 10px)` }}
          >
            <SecondaryIndicator onIndicatorChange={onChangeSecondaryIndicators} index={index} mainIndex={props.index} />
          </div>
        ))
      }

    </div>
  )
}