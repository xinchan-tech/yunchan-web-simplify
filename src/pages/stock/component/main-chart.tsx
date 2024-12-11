import { useEffect, useState } from "react"
import { useKChartContext, useSymbolQuery } from "../lib"
import dayjs from "dayjs"
import { useTime } from "@/store"
import { useQueries, useQuery } from "@tanstack/react-query"
import { getStockChart, getStockIndicatorData, StockChartInterval, type StockRawRecord } from "@/api"
import { useMount, useUpdateEffect } from "ahooks"
import { useChart } from "@/hooks"
import { renderChart, renderSecondary, renderZoom } from "../lib/render"
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
  const { state: ctxState, setState } = useKChartContext()
  const { usTime } = useTime()
  const state = ctxState[props.index - 1]
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

  const secondaryIndicators = useQueries({
    queries: state.secondaryIndicators.map((item, index) => ({
      queryKey: [getStockIndicatorData.cacheKey, { symbol: symbol, cycle: state.timeIndex, id: item, db_type: 'system', index: index }],
      queryFn: () => getStockIndicatorData({ symbol: symbol, cycle: state.timeIndex, id: item, db_type: 'system' }),
      placeholderData: { result: [] }
    }))
  })

  useEffect(() => {
    setState(prev => {
      secondaryIndicators.forEach((item, index) => {
        if(item.data){
          prev.state[props.index - 1].secondaryIndicatorsData[index] = item.data?.result
        }
      })
    })
  }, [secondaryIndicators, props.index, setState])



  useMount(() => {
    if (chart.current) {
      setState(prev => {
        prev.state[props.index - 1].getChart = () => chart.current as echarts.ECharts
      })
    }
    chart.current?.setOption(renderChart(state, query.data, true))
  })

  useEffect(() => {
    if (!query.data) {
      setState(prev => {
        prev.state[props.index - 1].mainData = {
          history: [],
          coiling_data: [],
          md5: ''
        }
      })
    } else {

      setState(prev => {
        prev.state[props.index - 1].mainData = {
          history: query.data.history.map(h => [dayjs(h[0]).valueOf().toString(), ...h.slice(1)]) as unknown as StockRawRecord[],
          coiling_data: query.data.coiling_data,
          md5: query.data.md5
        }
      })
    }
  }, [query.data, props.index, setState])

  useUpdateEffect(() => {
    if (!chart.current) return

    const [start, end] = renderUtils.getZoom(chart.current.getOption())

    chart.current?.clear()

    const _options = renderChart(state, query.data)
    renderZoom(_options, [start, end])
    renderSecondary(_options, state)
    chart.current.setOption(_options)

    // chart.current?.setOption(_options)

    setSecondaryIndicatorsCount(state.secondaryIndicators.length)


  }, [state])


  const [secondaryIndicatorsCount, setSecondaryIndicatorsCount] = useState(state.secondaryIndicators.length)


  const onChangeSecondaryIndicators = async (params: { value: string, index: number, type: string }) => {
    setState(prev => {
      renderUtils.cleanSecondaryIndicators(prev, props.index, params.index)
    })


    // if (!r) return

    // setState(prev => {
    //   prev.state[props.index - 1].secondaryIndicatorsData[params.index - 1] = r.result
    // })
  }


  return (
    <div className="w-full h-full relative">
      <div className="w-full h-full" ref={dom}>
      </div>
      {
        Array.from(new Array(secondaryIndicatorsCount).fill(() => nanoid())).map((item, index) => (
          <div key={item + index.toString()}
            className="absolute rounded-sm left-2"
            style={{ top: `calc(${(chart.current?.getOption() as any)?.grid[index + 1]?.top ?? 0} + 10px)` }}
          >
            <SecondaryIndicator onIndicatorChange={onChangeSecondaryIndicators} index={index + 1} mainIndex={props.index} />
          </div>
        ))
      }

    </div>
  )
}