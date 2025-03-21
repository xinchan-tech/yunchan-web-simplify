import type { StockRawRecord } from '@/api'
import { ChartTypes, JknChart } from '@/components'
import { stockSubscribe, stockUtils } from '@/utils/stock'
import { useMount, useUnmount, useUpdateEffect } from 'ahooks'
import qs from 'qs'
import { type ComponentRef, useEffect, useRef, useState } from 'react'
import { chartEvent } from '../lib/event'
import { fetchCandlesticks, useCandlesticks } from '../lib/request'
import { chartManage, ChartType, MainYAxis, useChartManage } from '../lib/store'
import { renderUtils } from '../lib/utils'
import { ChartContextMenu } from './chart-context-menu'
import { BackTestBar } from "./back-test-bar"
import { useStockBarSubscribe } from "@/hooks"
import { chatManager, useTime } from "@/store"
import { colorUtil } from "@/utils/style"
import { dateUtils } from "@/utils/date"

interface MainChartProps {
  chartId: string
}

const getSymbolByUrl = () => {
  const query = qs.parse(window.location.search, { ignoreQueryPrefix: true })
  return query.symbol as string
}

const convertToStock = (candlesticks: StockRawRecord[]) => candlesticks.map(c => stockUtils.toStock(c))

export const MainChart = (props: MainChartProps) => {
  const [symbol, setSymbol] = useState(getSymbolByUrl())
  const trading = useTime(s => s.getTrading())
  const activeChartId = useChartManage(s => s.activeChartId)
  const chartStore = useChartManage(s => s.chartStores[props.chartId])
  const chartImp = useRef<ComponentRef<typeof JknChart>>(null)
  const { candlesticks, startAt, refreshCandlesticks } = useCandlesticks(symbol, chartStore.interval)
  const stockCache = useRef({
    compare: new Map(),
    mark: ''
  })

  useStockBarSubscribe([`${symbol}@${stockUtils.intervalToPeriod(chartStore.interval)}`], (data) => {
    const trading = useTime.getState().getTrading()
    const interval = useChartManage.getState().chartStores[props.chartId].interval
    const record = stockUtils.toStock(data.rawRecord)
    // console.log('stock bar subscribe ********************')
    // console.log(dateUtils.toUsDay(data.rawRecord[0]! as unknown as number).format('YYYY-MM-DD HH:mm:ss'))
    // console.log(trading, renderUtils.shouldUpdateChart(trading, chartStore.interval), chartImp.current?.isSameIntervalCandlestick(record, chartStore.interval))
    // console.log(data)
    // console.log('stock bar subscribe end ********************')
    if (!renderUtils.shouldUpdateChart(trading, interval)) {
      return
    }

    const chart = chartImp.current?.getChart()
    const lastData = chart?.getDataList()?.slice(-1)[0]

    if (chartImp.current?.isSameIntervalCandlestick(record, interval)) {
      chartImp.current?.appendCandlestick({
        ...record,
        quote: lastData?.quote
      }, interval)
    } else {
      chartImp.current?.appendCandlestick({
        ...record,
        quote: record.close
      }, interval)
    }
  })

  useEffect(() => {
    const unSubscribe = stockSubscribe.onQuoteTopic(symbol, data => {
      const trading = useTime.getState().getTrading()

      if (!renderUtils.shouldUpdateChart(trading, chartStore.interval)) {
        return
      }

      const chart = chartImp.current?.getChart()
      const lastData = chart?.getDataList()?.slice(-1)[0]

      if (!lastData) return

      const newData = {
        ...lastData,
        quote: data.record.close
      }

      chartImp.current?.appendCandlestick(newData, chartStore.interval)
    })

    return unSubscribe
  }, [chartStore.interval, symbol])

  /**
   * 初始化
   */
  useMount(() => {
    chartManage.cleanStockOverlay()
    const _store = useChartManage.getState().chartStores[props.chartId]

    const stockData = convertToStock(candlesticks)

    chartImp.current?.applyNewData(stockData)

    chartImp.current?.setChartType(_store.type === ChartType.Candle ? 'candle' : 'area')

    if (_store.mainIndicators.length) {
      _store.mainIndicators.forEach(indicator => {
        chartImp.current?.createIndicator({
          indicator: indicator.id,
          symbol,
          interval: chartStore.interval,
          name: indicator.name,
          isRemote: renderUtils.isRemoteIndicator(indicator)
        })
      })
    }

    if (_store.secondaryIndicators) {
      _store.secondaryIndicators.forEach(indicator => {
        chartImp.current?.createSubIndicator({
          indicator: indicator.id,
          symbol,
          interval: chartStore.interval,
          name: indicator.name,
          isRemote: renderUtils.isRemoteIndicator(indicator)
        })
      })
    }

    if (_store.overlayMark) {
      stockCache.current.mark =
        chartImp.current?.createMarkOverlay(symbol, _store.overlayMark.type, _store.overlayMark.mark) ?? ''
    }

    const chart = chartImp.current?.getChart()

    if (chart) {
      chart.subscribeAction('onIndicatorActionClick' as any, (e: any) => {
        if (e.event === 'delete') {
          if (e.paneId === ChartTypes.MAIN_PANE_ID) {
            chartManage.removeMainIndicator(e.indicator.id, props.chartId)
          } else {
            chartManage.removeSecondaryIndicator(e.indicator.id, props.chartId)
          }
        } else if (e.event === 'invisible' || e.event === 'visible') {
          chartImp.current?.setIndicatorVisible(e.indicator.id, e.event !== 'invisible')
        } else if (e.event === 'click') {
          chartEvent.get().emit('showIndicatorSetting', '')
        }
      })
    }

    if (renderUtils.isTimeIndexChart(chartStore.interval)) {
      chartImp.current?.setTimeShareChart(chartStore.interval)
    }
  })

  useUnmount(() => {
    const chart = chartImp.current?.getChart()
    chart?.unsubscribeAction('onIndicatorActionClick' as any)
  })
  /**
   * 数据变化
   */
  useEffect(() => {
    if (!candlesticks.length) {
      chartImp.current?.applyNewData([])
      return
    }

    const stockData = convertToStock(candlesticks)

    chartImp.current?.applyNewData(stockData)
  }, [candlesticks])

  /**
   * 缠论数据变化
   */
  useEffect(() => {
    chartImp.current?.setCoiling(chartStore.coiling, useChartManage.getState().chartStores[props.chartId].interval)
  }, [chartStore.coiling, props.chartId])
  /**
   * chart事件处理
   */
  useEffect(() => {
    if (activeChartId !== props.chartId) return

    const cancelSymbolEvent = chartEvent.on('symbolChange', (symbol) => {
      setSymbol(symbol)
    })

    // const cancelCoilingEvent = chartEvent.on('coilingChange', ({ type, coiling }) => {
    //   chartImp.current?.setCoiling(coiling, use)
    // })

    const cancelIntervalEvent = chartEvent.on('intervalChange', async (interval) => {
      if (renderUtils.isTimeIndexChart(interval)) {
        chartManage.setType(ChartType.Area, props.chartId)
        chartImp.current?.setTimeShareChart(interval)
      } else {
        chartImp.current?.setTimeShareChart()
      }
      chartManage.setMode('normal')
    })

    const cancelCharTypeEvent = chartEvent.on('chartTypeChange', (type) => {
      chartImp.current?.setChartType(type === ChartType.Candle ? 'candle' : 'area')
    })

    const cancelIndicatorEvent = chartEvent.on('mainIndicatorChange', ({ type, indicator }) => {
      if (type === 'add') {
        console.log(indicator)
        chartImp.current?.createIndicator({
          indicator: indicator.id,
          symbol,
          interval: chartStore.interval,
          name: indicator.name,
          isRemote: renderUtils.isRemoteIndicator(indicator)
        })
      } else {
        chartImp.current?.removeIndicator(indicator.id)
      }
    })

    const cancelSubIndicatorEvent = chartEvent.on('subIndicatorChange', ({ type, indicator }) => {
      if (type === 'add') {
        chartImp.current?.createSubIndicator({
          indicator: indicator.id,
          symbol,
          interval: chartStore.interval,
          name: indicator.name,
          isRemote: renderUtils.isRemoteIndicator(indicator)
        })
      } else {
        chartImp.current?.removeSubIndicator(indicator.id)
      }
    })

    const cancelStockCompareChange = chartEvent.on('stockCompareChange', ({ type, symbol }) => {
      if (chartImp.current === null) return
      if (type === 'add') {
        if (!stockCache.current.compare.has(symbol)) {
          fetchCandlesticks(symbol, chartStore.interval, startAt.current).then(r => {
            if (!r.data.list.length) return

            const compareStockStart = r.data.list[0][0]! as unknown as number

            const startInCandlesticksIndex = renderUtils.findNearestTime(candlesticks, compareStockStart)

            if (!startInCandlesticksIndex || startInCandlesticksIndex?.index === -1) return

            const compareCandlesticks = new Array(startInCandlesticksIndex!.index)
              .fill(null)
              .concat(r.data.list.map(c => c[2]))
            const color = colorUtil.colorPalette[stockCache.current.compare.size]
            stockCache.current.compare.set(symbol, chartImp.current?.createStockCompare(symbol, compareCandlesticks, color))
          })
        }
      } else {
        stockCache.current.compare.delete(symbol)
        chartImp.current?.removeStockCompare(symbol)
      }
    })

    const cancelMarkChange = chartEvent.on('markOverlayChange', async ({ type, params }) => {
      if (type === 'add') {
        if (stockCache.current.mark) {
          chartImp.current?.removeMarkOverlay(stockCache.current.mark)
        }

        stockCache.current.mark = chartImp.current?.createMarkOverlay(symbol, params.type, params.mark) ?? ''
      } else {
        chartImp.current?.removeMarkOverlay(stockCache.current.mark)
        stockCache.current.mark = ''
      }
    })

    const cancelYAxisChange = chartEvent.on('yAxisChange', (type) => {
      chartImp.current?.setLeftAxis(!!type.left)
      chartImp.current?.setRightAxis(type.right === MainYAxis.Percentage ? 'percentage' : 'normal')
    })

    return () => {
      cancelSymbolEvent()
      // cancelCoilingEvent()
      cancelIndicatorEvent()
      cancelCharTypeEvent()
      cancelSubIndicatorEvent()
      cancelStockCompareChange()
      cancelMarkChange()
      cancelIntervalEvent()
      cancelYAxisChange()
    }
  }, [activeChartId, props.chartId, candlesticks, chartStore.interval, symbol, startAt])

  // useUpdateEffect(() => {
  //   chartImp.current?.setChartType(chartStore.type === ChartType.Candle ? 'candle' : 'area')
  // }, [chartStore.type])

  useUpdateEffect(() => {
    if (chartStore.mode === 'normal') {
      refreshCandlesticks()
      chartImp.current?.removeBackTestIndicator()
    }
  }, [chartStore.mode])


  const onAddBackTestRecord = (record: any) => {
    chartImp.current?.createBackTestIndicator([record])
  }

  return (
    <ChartContextMenu
      index={0}
    >
      <div className="flex-1 overflow-hidden">
        <JknChart className="w-full" showLogo ref={chartImp} />
      </div>
      {
        chartStore.mode === 'backTest' ? (
          <div>
            <BackTestBar
              chartId={props.chartId}
              candlesticks={candlesticks}
              onChangeCandlesticks={(d) => chartImp.current?.applyNewData(convertToStock(d))}
              onAddBackTestRecord={onAddBackTestRecord}
            />
          </div>
        ) : null
      }
    </ChartContextMenu>
  )
}
