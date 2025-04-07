import { type StockChartInterval, type StockRawRecord, getStockChartQuote, getStockChartV2, getStockTabData } from '@/api'
import { dateUtils } from '@/utils/date'
import { queryClient } from '@/utils/query-client'
import { stockUtils } from '@/utils/stock'
import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { renderUtils } from './utils'



export const useCandlesticks = (symbol: string, interval: StockChartInterval) => {
  const startAt = useRef<string>(renderUtils.getChartStartDate(interval))
  const queryKey = [
    'stock-kline:v2',
    {
      symbol,
      interval,
      time_format: 'int'
    }
  ]

  const candlesticksQuery = useQuery({
    queryKey: queryKey,
    queryFn: () => {
      if (!renderUtils.isTimeIndexChart(interval)) {
        startAt.current = renderUtils.getChartStartDate(interval)
        return getStockChartV2({
          symbol,
          period: stockUtils.intervalToPeriod(interval),
          start_at: startAt.current,
          time_format: 'int'
        }).then(r => r.data.list.map(v => [v[0], v[1], v[4], v[2], v[3], ...v.slice(5)]) as StockRawRecord[])
      }


      return getStockChartQuote(symbol, 'full-day', 'int')
    }
  })

  return {
    candlesticks: candlesticksQuery.data ?? [],
    startAt,
    refreshCandlesticks: candlesticksQuery.refetch
  }
}

export const fetchCandlesticks = async (symbol: string, interval: StockChartInterval, startAt: string) => {
  const queryKey = [
    getStockChartV2.cacheKey,
    {
      symbol,
      interval,
      time_format: 'int'
    }
  ]

  const res = queryClient.ensureQueryData({
    queryKey: queryKey,
    queryFn: () => {
      return getStockChartV2({
        symbol,
        period: stockUtils.intervalToPeriod(interval),
        start_at: startAt,
        time_format: 'int'
      })
    }
  })

  return res
}

export const fetchOverlayMark = async (type: string, mark: string, symbol: string) => {
  const queryKey = [
    getStockTabData.cacheKey,
    {
      type,
      mark,
      symbol
    }
  ]

  const res = await queryClient.ensureQueryData({
    queryKey: queryKey,
    queryFn: () => {
      return getStockTabData({ param: { [type]: [mark] }, ticker: symbol, start: '2010-01-01' })
    },
    revalidateIfStale: true
  })

  return res
}
