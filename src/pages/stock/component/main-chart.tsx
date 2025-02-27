import { type ComponentRef, useEffect, useRef } from 'react'
import { useStockCandlesticks } from '../lib/request'
import { ChartContextMenu } from './chart-context-menu'
import { JknChart } from "@/components"
import { stockUtils } from "@/utils/stock"

interface MainChartProps {
  index: number
}

export const MainChart = (props: MainChartProps) => {
  const { candlesticks, fetchPrevCandlesticks } = useStockCandlesticks(props.index)
  const chart = useRef<ComponentRef<typeof JknChart>>(null)

  useEffect(() => {
    const stockData = candlesticks.map(c => stockUtils.toStock(c))
    console.log(stockData)
    setTimeout(() => {
      chart.current?.applyNewData(stockData)
    })
  }, [candlesticks])

  return (
    <ChartContextMenu index={0} onChangeSecondaryCount={(count: number): void => {
      throw new Error("Function not implemented.")
    }}>
      <JknChart className="w-full h-full" ref={chart} />
    </ChartContextMenu>
  )
}
