import { useEffect, useState } from "react"
import { type KChartContext, useKChartContext, useSymbolQuery } from "../lib"
import dayjs from "dayjs"
import { useConfig, useTime } from "@/store"
import { useQuery } from "@tanstack/react-query"
import { getStockChart, StockChartInterval } from "@/api"
import { useMount, useUpdateEffect } from "ahooks"
import { useChart } from "@/hooks"
import { options, renderCandlestick, renderLine, renderMarkLine } from "../lib/render"
import { StockRecord } from "@/utils/stock"

const getStartTime = (usTime: number, time: StockChartInterval) => {
  if (time >= StockChartInterval.DAY || time <= StockChartInterval.INTRA_DAY) return undefined

  return dayjs(usTime).tz('America/New_York').add(-15 * time, 'day').format('YYYY-MM-DD')
}

interface MainChartProps {
  index: number
}

export const MainChart = (props: MainChartProps) => {
  const symbol = useSymbolQuery()
  const { getStockColor } = useConfig()
  const [symbolSelected, setSymbolSelected] = useState(symbol)
  const [chart, dom] = useChart()
  const { state: ctxState, activeChartIndex } = useKChartContext()
  const { usTime } = useTime()
  const state = ctxState[props.index - 1]
  const startTime = getStartTime(usTime, state.timeIndex)
  const isActiveChart = props.index === activeChartIndex
  const isTimeIndexChart = () => [StockChartInterval.PRE_MARKET, StockChartInterval.AFTER_HOURS, StockChartInterval.INTRA_DAY, StockChartInterval.FIVE_DAY].includes(state.timeIndex)

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


  const setData = () => {
    chart.current?.setOption({
      xAxis: [],
      dataset: [
        {
          source: query.data?.history ?? []
        }
      ],
    })
  }

  const renderChart = () => {
    const lastData = query.data?.history[query.data?.history.length - 1]
    if(!lastData) return
    const s = StockRecord.of('','', lastData!)

    if (state.type === 'k-line') {
      renderCandlestick(chart.current)
    } else {
      renderLine(chart.current, isTimeIndexChart(), s.percentAmount >= 0)
    }

    renderMarkLine(
      lastData ? lastData[2] >= +lastData[lastData?.length - 1] : false,
      query.data?.history[query.data?.history.length - 1][2] ?? 0,
      chart.current
    )
  }

  useMount(() => {
    chart.current?.setOption(options)
    setData()
    renderChart()
  })

  useUpdateEffect(() => {
    setData()
    renderChart()
  }, [query.data, state])


  return (
    <div className="w-full h-full" ref={dom}>

    </div>
  )
}