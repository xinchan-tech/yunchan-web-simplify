import { useState } from "react"
import { useKChartContext, useSymbolQuery } from "../lib"
import dayjs from "dayjs"
import { useTime } from "@/store"
import { useQuery } from "@tanstack/react-query"
import { getStockChart, StockChartInterval } from "@/api"
import { compress } from "lz-string"

const getStartTime = (usTime: number, time: StockChartInterval) => {
  if (time >= StockChartInterval.DAY || time <= StockChartInterval.INTRA_DAY) return undefined

  return dayjs(usTime).tz('America/New_York').add(-15 * time, 'day').format('YYYY-MM-DD')
}

export const MainChart = () => {
  const symbol = useSymbolQuery()
  const [symbolSelected, setSymbolSelected] = useState(symbol)
  const { timeIndex } = useKChartContext()
  const { usTime } = useTime()
  const startTime = getStartTime(usTime, timeIndex)

  const query = useQuery({
    queryKey: [getStockChart.cacheKey, symbolSelected, timeIndex, '1'],
    queryFn: () => getStockChart({
      start_at: startTime,
      ticker: symbolSelected,
      interval: timeIndex,
      gzencode: true
    })
  })
  console.log(compress(query.data ?? '').length)
  console.log(query.data.length)
  console.log(new Blob([compress(query.data ?? '')]).size, new Blob([query.data ?? '']).size, new Blob(['1']).size)


  return (
    <div className="w-full h-full">

    </div>
  )
}