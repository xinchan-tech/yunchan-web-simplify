import { StockChartInterval, getStockChartV2, getStockTabData } from '@/api'
import { dateUtils } from '@/utils/date'
import { queryClient } from '@/utils/query-client'
import { stockUtils } from '@/utils/stock'
import { useQuery } from '@tanstack/react-query'
import { symbol } from 'd3'
import { useRef } from 'react'

/**
 * k线获取数据逻辑
 */
const getChartStartDate = (interval: StockChartInterval) => {
  const current = dateUtils.toUsDay(new Date().valueOf())
  if (interval <= StockChartInterval.FOUR_HOUR) {
    return current.add(-1 * 15 * interval, 'd').format('YYYY-MM-DD HH:mm:ss')
  }

  return current.add(-1 * 15 * 180, 'd').format('YYYY-MM-DD HH:mm:ss')
}

export const useCandlesticks = (symbol: string, interval: StockChartInterval) => {
  const startAt = useRef<string>(getChartStartDate(interval))
  const queryKey = [
    getStockChartV2.cacheKey,
    {
      symbol,
      interval,
      time_format: 'int'
    }
  ]

  const candlesticksQuery = useQuery({
    queryKey: queryKey,
    queryFn: () => {
      startAt.current = getChartStartDate(interval)
      return getStockChartV2({
        symbol,
        period: stockUtils.intervalToPeriod(interval),
        start_at: startAt.current,
        time_format: 'int'
      })
    },
    select: data => data.data.list
  })

  return {
    candlesticks: candlesticksQuery.data ?? [],
    startAt
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
