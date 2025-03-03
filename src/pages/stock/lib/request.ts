import { StockChartInterval, type StockRawRecord, getStockChartQuote, getStockChartV2 } from '@/api'
import { queryClient } from '@/utils/query-client'
import { stockUtils } from '@/utils/stock'
import { useLatest, useMount, useUnmount, useUpdate, useUpdateEffect } from 'ahooks'
import to from 'await-to-js'
import dayjs from 'dayjs'
import { useCallback, useEffect, useRef, useState } from 'react'
import { isTimeIndexChart, useKChartStore } from './ctx'
import { interval } from 'd3'
import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { dateUtils } from '@/utils/date'
import { useImmer } from 'use-immer'

/**
 * k线分页逻辑
 * k线只去取盘中的数据
 * 盘中时间： 9:30 - 15:59
 */
const getPeriodByPage = (params: { interval: StockChartInterval; startDate: number }) => {
  const { interval, startDate } = params
  const usDate = dayjs(startDate).tz('America/New_York')
  let resultDate: string = usDate.format('YYYY-MM-DD HH:mm:ss')
  const endDate = usDate.format('YYYY-MM-DD HH:mm:ss')

  if (interval <= StockChartInterval.THIRTY_MIN) {
    resultDate = usDate.add(-5, 'd').format('YYYY-MM-DD HH:mm:ss')
  } else if (interval <= StockChartInterval.FORTY_FIVE_MIN) {
    resultDate = usDate.add(-15 * 4, 'd').format('YYYY-MM-DD HH:mm:ss')
  } else if (interval <= StockChartInterval.FOUR_HOUR) {
    resultDate = usDate.add(-30 * 6, 'd').format('YYYY-MM-DD HH:mm:ss')
  } else if (interval === StockChartInterval.DAY) {
    resultDate = usDate.add(-365 * 10, 'd').format('YYYY-MM-DD HH:mm:ss')
  } else if (interval === StockChartInterval.WEEK) {
    resultDate = usDate.add(-12 * 2, 'M').format('YYYY-MM-DD HH:mm:ss')
  } else if (interval === StockChartInterval.MONTH) {
    resultDate = usDate.add(-3, 'y').format('YYYY-MM-DD HH:mm:ss')
  } else if (interval <= StockChartInterval.YEAR) {
    resultDate = usDate.add(-5 * 2, 'y').format('YYYY-MM-DD HH:mm:ss')
  }

  return [resultDate, endDate]
}

export const useStockCandlesticks = (index: number) => {
  const initDate = useRef(dayjs().second(0).millisecond(0).valueOf())
  const startDate = useRef<number>(initDate.current)
  const [result, setResult] = useState<StockRawRecord[]>([])
  const candlesticks = useRef<StockRawRecord[]>(result)
  const symbol = useRef<string | undefined>(useKChartStore.getState().state[index].symbol)
  const interval = useRef(useKChartStore.getState().state[index].timeIndex)

  const isLoading = useRef(false)

  const fetchKline = useCallback(async (start: string, end: string | undefined, interval: number) => {
    if (!symbol.current) return
    isLoading.current = true

    if (isTimeIndexChart(interval)) {
      const period =
        interval === StockChartInterval.PRE_MARKET
          ? 'pre'
          : interval === StockChartInterval.AFTER_HOURS
            ? 'post'
            : interval === StockChartInterval.FIVE_DAY
              ? '5d'
              : 'intraday'
      const [_, r] = await to(getStockChartQuote(symbol.current, period))
      isLoading.current = false
      candlesticks.current = r?.list ?? []
      return r?.list ?? []
    }

    const params = {
      start_at: start!,
      end_at: end,
      symbol: symbol.current,
      period: stockUtils.intervalToPeriod(interval),
      time_format: 'int'
    }

    const [_, r] = await to(getStockChartV2(params))

    const re = [...(r?.data.list ?? []), ...candlesticks.current]

    if (re[0][0]) {
      startDate.current = dayjs(start).valueOf()
    }

    candlesticks.current = re
    isLoading.current = false
    return re
  }, [])

  const fetchPrevKline = useCallback(async () => {
    if (isTimeIndexChart(interval.current)) return
    if (isLoading.current) return
    if (useKChartStore.getState().state[index].backTest) return
    const [start, end] = getPeriodByPage({ startDate: startDate.current, interval: interval.current })

    const r = await fetchKline(start, end, interval.current)
    setResult(r ?? [])
  }, [fetchKline, index])

  const refreshKline = useCallback(async () => {
    if (!symbol.current) return

    if (isTimeIndexChart(interval.current)) {
      const period =
        interval.current === StockChartInterval.PRE_MARKET
          ? 'pre'
          : interval.current === StockChartInterval.AFTER_HOURS
            ? 'post'
            : interval.current === StockChartInterval.FIVE_DAY
              ? '5d'
              : 'intraday'
      const [_, r] = await to(getStockChartQuote(symbol.current, period))
      isLoading.current = false
      candlesticks.current = r?.list ?? []
      return r
    }

    const prevDate = dayjs(startDate.current).format('YYYY-MM-DD HH:mm:ss')

    const params = {
      start_at: prevDate,
      end_at: undefined,
      symbol: symbol.current,
      period: stockUtils.intervalToPeriod(interval.current),
      time_format: 'int'
    }

    const [_, r] = await to(getStockChartV2(params))

    const re = [...(r?.data.list ?? [])]

    candlesticks.current = re
    isLoading.current = false

    return re
  }, [])

  const timer = useRef<number>()

  useMount(() => {
    const [start] = getPeriodByPage({ startDate: startDate.current, interval: interval.current })

    queryClient
      .ensureQueryData({
        queryKey: ['stock:kline:v2', _symbol, _interval],
        queryFn: () => fetchKline(start, undefined, interval.current)
      })
      .then(r => {
        setResult(r ?? [])
      })

    timer.current = window.setInterval(() => {
      if (isLoading.current) return
      if (useKChartStore.getState().state[index].backTest) return
      refreshKline()
    }, 1000 * 60)
  })

  useUnmount(() => {
    clearInterval(timer.current)
  })

  const _symbol = useKChartStore(state => state.state[index].symbol)
  const _interval = useKChartStore(state => state.state[index].timeIndex)

  useUpdateEffect(() => {
    initDate.current = dayjs().second(0).millisecond(0).valueOf()
    startDate.current = initDate.current
    symbol.current = _symbol
    interval.current = _interval
    const [start] = getPeriodByPage({ startDate: startDate.current, interval: interval.current })
    candlesticks.current = []
    setResult([])
    queryClient
      .ensureQueryData({
        queryKey: ['stock:kline:v2', _symbol, _interval],
        queryFn: () => fetchKline(start, undefined, _interval)
      })
      .then(r => {
        setResult(r ?? [])
      })
  }, [_symbol, _interval])

  return {
    candlesticks: result,
    fetchPrevCandlesticks: fetchPrevKline,
    refreshCandlesticks: refreshKline
  }
}

export const useCandlesticks = (symbol: string, interval: StockChartInterval) => {
  const [params, setParams] = useImmer({
    symbol,
    interval,
    startAt: undefined as number | undefined
  })

  const [candlesticks, setCandlesticks] = useState<StockRawRecord[]>([])
  const isFetching = useRef(false)

  const fetchCandlesticks = useCallback(
    async (symbol: string, interval: StockChartInterval, endAt: number | undefined) => {
      if (isFetching.current) return
      isFetching.current = true
      let endDate = endAt
      if (!endDate) {
        endDate = dayjs().second(0).millisecond(0).valueOf()
      }
      const [start, end] = getPeriodByPage({ startDate: endDate, interval })
      const { data } = await getStockChartV2({
        start_at: start,
        end_at: !endAt ? undefined : end,
        symbol,
        period: stockUtils.intervalToPeriod(interval),
        time_format: 'int'
      })
      setCandlesticks(s => data.list.concat(s))
      isFetching.current = false
    },
    []
  )

  useEffect(() => {
    fetchCandlesticks(params.symbol, params.interval, params.startAt)
  }, [params, fetchCandlesticks])

  useUpdateEffect(() => {
    setCandlesticks([])
    setParams(draft => {
      draft.interval = interval
      draft.symbol = symbol
      draft.startAt = undefined
    })
  }, [symbol, interval])

  const fetchPrevCandlesticks = useCallback(() => {
    if (isFetching.current) return
    setParams(draft => {
      const [start] = getPeriodByPage({ startDate: draft.startAt!, interval: draft.interval })
      draft.startAt = dateUtils.toUsDay(start).valueOf()
    })
  }, [setParams])

  return {
    candlesticks,
    fetchPrevCandlesticks
  }
}
