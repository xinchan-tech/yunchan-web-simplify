import { useEffect, useState } from "react"
import { useKChartContext, useSymbolQuery } from "../lib"
import { useTime } from "@/store"
import { useQueries, useQuery } from "@tanstack/react-query"
import { getStockChart, getStockIndicatorData } from "@/api"
import { useMount, useUpdateEffect } from "ahooks"
import { useChart } from "@/hooks"
import { renderChart, renderMainCoiling, renderMainIndicators, renderOverlay, renderOverlayMark, renderSecondary, renderSecondaryLocalIndicators, renderWatermark, renderZoom } from "../lib/render"
import { SecondaryIndicator } from "./secondary-indicator"
import { renderUtils } from "../lib/utils"
import { StockSelect } from "@/components"
import { cn } from "@/utils/style"

interface MainChartProps {
  index: number
}

export const MainChart = (props: MainChartProps) => {
  const symbol = useSymbolQuery()
  const [symbolSelected, setSymbolSelected] = useState(symbol)
  const [chart, dom] = useChart()
  const { state: ctxState, setMainData, setIndicatorData, setSecondaryIndicator, removeOverlayStock, setActiveChart, activeChartIndex } = useKChartContext()
  const { usTime } = useTime()
  const state = ctxState[props.index]
  const startTime = renderUtils.getStartTime(usTime, state.timeIndex)

  useEffect(() => {
    setSymbolSelected(symbol)
  }, [symbol])

  const params = {
    start_at: startTime,
    ticker: symbolSelected,
    interval: state.timeIndex,
    gzencode: false
  }

  const query = useQuery({
    queryKey: [getStockChart.cacheKey, params],
    queryFn: () => getStockChart(params)
  })

  useQueries({
    queries: Reflect.ownKeys(state.mainIndicators).map(v => v.toString()).map((item, idx) => (
      {
        queryKey: [getStockIndicatorData.cacheKey, { symbol: symbol, cycle: state.timeIndex, id: item, db_type: state.mainIndicators[item].type }, idx],
        queryFn: async () => {
          const r = await getStockIndicatorData({
            symbol: symbol, cycle: state.timeIndex, id: item, db_type: state.mainIndicators[item].type, start_at: startTime
          })

          setIndicatorData({ index: props.index, indicatorId: item, data: r.result })

          return r
        },
        placeholderData: () => ({ result: [] })
      }
    ))
  })

  const secondaryIndicatorQueries = useQueries({
    queries: Array.from(new Set(state.secondaryIndicators.filter(v => !renderUtils.isLocalIndicator(v.id)).map(v => `${v.id}_${v.type}`))).map((item) => {
      const [id, type] = item.split('_')

      return {
        queryKey: [getStockIndicatorData.cacheKey, { symbol: symbol, cycle: state.timeIndex, id: id, db_type: type }],
        queryFn: () => getStockIndicatorData({
          symbol: symbol, cycle: state.timeIndex, id: id, db_type: type, start_at: startTime
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

  useEffect(() => {
    setMainData({ index: props.index, data: query.data })
  }, [query.data, props.index, setMainData])

  const render = () => {
    if (!chart.current) return

    const [start, end] = chart.current.getOption() ? renderUtils.getZoom(chart.current.getOption()) : [90, 100]

    chart.current?.clear()

    const _options = renderChart(state, query.data)
    renderZoom(_options, [start, end])
    /**
     * 画主图指标
     */
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
  // TODO: 切换主图时，指标从新加载
  return (
    <div className={
      cn(
        'w-full h-full relative border border-transparent border-solid',
        ctxState.length > 1 && activeChartIndex === props.index ? 'border-primary' : ''
      )
    } onClick={() => setActiveChart(props.index)} onKeyDown={() => { }}>
      <div className="w-full h-full" ref={dom}>
      </div>
      {
        state.secondaryIndicators.map((item, index, arr) => (
          <div key={item.key}
            className="absolute rounded-sm left-2"
            style={{ top: `calc(${renderUtils.calcGridTopByGridIndex(arr.length)[index]}% + 10px)` }}
          >
            <SecondaryIndicator onIndicatorChange={onChangeSecondaryIndicators} index={index} mainIndex={props.index} />
          </div>
        ))
      }
      {
        ctxState.length > 1 ? (
          <div className="absolute top-2 left-2">
            <StockSelect onChange={setSymbolSelected} value={symbolSelected} />
          </div>
        ) : null
      }

    </div>
  )
}