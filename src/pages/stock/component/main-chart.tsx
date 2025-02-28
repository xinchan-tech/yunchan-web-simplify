import { type ComponentRef, useEffect, useRef } from 'react'
import { useStockCandlesticks } from '../lib/request'
import { ChartContextMenu } from './chart-context-menu'
import { JknChart } from "@/components"
import { stockUtils } from "@/utils/stock"
import { calcCoiling } from "@/utils/coiling"
import { CoilingIndicatorId } from "@/components/jkn/jkn-chart/coiling"

interface MainChartProps {
  index: number
}

export const MainChart = (props: MainChartProps) => {
  const { candlesticks, fetchPrevCandlesticks } = useStockCandlesticks(props.index)
  const chart = useRef<ComponentRef<typeof JknChart>>(null)

  useEffect(() => {
    const stockData = candlesticks.map(c => stockUtils.toStock(c))
    calcCoiling(candlesticks, 1440).then(r => {
      console.log(chart.current, r)
      chart.current?.applyNewData(stockData)
      chart.current?.setCoiling('1', r)
      chart.current?.setCoiling(CoilingIndicatorId.ONE_TYPE, r)
      chart.current?.setCoiling(CoilingIndicatorId.THREE_TYPE, r)
      chart.current?.setCoiling(CoilingIndicatorId.TWO_TYPE, r)
      chart.current?.setCoiling(CoilingIndicatorId.PIVOT, r)
      chart.current?.setCoiling(CoilingIndicatorId.SHORT_LINE, r)
    })
    // setTimeout(() => {
    //   chart.current?.applyNewData(stockData)
    // })
  }, [candlesticks]) 

  return (
    <ChartContextMenu index={0} onChangeSecondaryCount={(count: number): void => {
      throw new Error("Function not implemented.")
    }}>
      <JknChart className="w-full h-full" ref={chart} />
    </ChartContextMenu>
  )
}
