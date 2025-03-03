import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react'
import { useCandlesticks } from '../lib/request'
import { ChartContextMenu } from './chart-context-menu'
import { JknChart } from "@/components"
import { stockUtils } from "@/utils/stock"
import { calcCoiling, calcIndicator } from "@/utils/coiling"
import qs from "qs"
import { StockChartInterval, type StockRawRecord } from "@/api"
import dayjs from "dayjs"
import { chartEvent } from "../lib/event"
import { useChartManage } from "../lib/store"
import { useIndicator } from "@/store"
import { aesDecrypt } from "@/utils/string"

interface MainChartProps {
  chartId: string
}

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


const getSymbolByUrl = () => {
  const query = qs.parse(window.location.search, { ignoreQueryPrefix: true })
  return query.symbol as string
}

export const MainChart = (props: MainChartProps) => {
  const [symbol, setSymbol] = useState(getSymbolByUrl())
  const activeChartId = useChartManage(s => s.activeChartId)
  const chartStore = useChartManage(s => s.chartStores[props.chartId])
  const chartImp = useRef<ComponentRef<typeof JknChart>>(null)
  const { candlesticks } = useCandlesticks(symbol, chartStore.interval)


  const render = useCallback(async ({ candlesticks, interval, chartId, symbol, }: { candlesticks: StockRawRecord[], interval: StockChartInterval, chartId: string, symbol: string }) => {
    const _store = useChartManage.getState().chartStores[chartId]
    const stockData = candlesticks.map(c => stockUtils.toStock(c))

    if (_store.coiling.length) {
      const r = await calcCoiling(candlesticks, interval)
      _store.coiling.forEach((coiling) => {
        chartImp.current?.setCoiling(coiling, r)
      })
    }

    if (_store.mainIndicators.length) {
      _store.mainIndicators.forEach(indicator => {
        chartImp.current?.createLocalIndicator(indicator.id, symbol, interval)
      })
    }

    chartImp.current?.applyNewData(stockData)

  }, [])

  useEffect(() => {
    if (!candlesticks.length) {
      chartImp.current?.applyNewData([])
      return
    }
    render({ candlesticks, interval: chartStore.interval, chartId: props.chartId, symbol })

  }, [candlesticks, chartStore.interval, render, props.chartId, symbol])


  /**
   * chart事件处理
   */
  useEffect(() => {
    if (activeChartId !== props.chartId) return

    const cancelSymbolEvent = chartEvent.on('coilingChange', ({ type, coiling }) => {
      if (type === 'add') {
        calcCoiling(candlesticks, chartStore.interval).then(r => {
          coiling.forEach((coiling) => {
            chartImp.current?.setCoiling(coiling, r)
          })

        })

      } else {
        chartImp.current?.removeCoiling(coiling)
      }
    })

    return () => {
      cancelSymbolEvent()
    }
  }, [activeChartId, props.chartId, candlesticks, chartStore.interval])


  return (
    <ChartContextMenu index={0} onChangeSecondaryCount={(count: number): void => {
      throw new Error("Function not implemented.")
    }}>
      <JknChart className="w-full h-full" ref={chartImp} />
    </ChartContextMenu>
  )
}
