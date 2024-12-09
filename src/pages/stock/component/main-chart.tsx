import { useEffect, useState } from "react"
import { useKChartContext, useSymbolQuery } from "../lib"
import dayjs from "dayjs"
import { useTime } from "@/store"
import { useQuery } from "@tanstack/react-query"
import { getStockChart, getStockIndicatorData, StockChartInterval } from "@/api"
import { useMount, useUpdateEffect } from "ahooks"
import { useChart } from "@/hooks"
import { options, renderChart, renderSecondary } from "../lib/render"
import { SecondaryIndicator } from "./secondary-indicator"
import { nanoid } from "nanoid"
import { renderUtils } from "../lib/utils"

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

  useMount(() => {
    chart.current?.setOption(options)
    chart.current?.setOption(renderChart(state, query.data))
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
        prev.state[props.index - 1].mainData = query.data
      })
    }
  }, [query.data, props.index, setState])

  useUpdateEffect(() => {
    if (!chart.current) return
    chart.current?.clear()
    const _options = renderChart(state, query.data)
    renderSecondary(_options, state)
    chart.current.setOption(_options)

    setTimeout(() => {
      setSecondaryIndicatorsCount(state.secondaryIndicators.length)
    }, 0)

  }, [state])

  const [secondaryIndicatorsCount, setSecondaryIndicatorsCount] = useState(state.secondaryIndicators.length)


  const onChangeSecondaryIndicators = async (params: { value: string, index: number }) => {
    setState(prev => {
      renderUtils.cleanSecondaryIndicators(prev, props.index, params.index)
    })
    const r = await getStockIndicatorData({ symbol: symbol, cycle: state.timeIndex, id: params.value, db_type: 'system' })

    if (!r) return

    setState(prev => {
      prev.state[props.index - 1].secondaryIndicatorsData[params.index - 1] = r.result
    })
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