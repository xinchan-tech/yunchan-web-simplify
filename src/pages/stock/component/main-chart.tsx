import type { StockRawRecord } from '@/api'
import { ChartTypes, JknChart, JknIcon } from '@/components'
import { useStockBarSubscribe } from '@/hooks'
import { useConfig, useTime } from '@/store'
import { type Stock, stockSubscribe, stockUtils } from '@/utils/stock'
import { colorUtil } from '@/utils/style'
import { useMount, useUnmount } from 'ahooks'
import qs from 'qs'
import { type ComponentRef, useEffect, useRef, useState } from 'react'
import { chartEvent } from '../lib/event'
import { useCandlesticks } from '../lib/request'
import { chartManage, ChartType, MainYAxis, useChartManage } from '../lib/store'
import { renderUtils } from '../lib/utils'
import { BackTestBar } from './back-test-bar'
import { ChartContextMenu } from './chart-context-menu'
import { dateUtils } from '@/utils/date.ts'

interface MainChartProps {
  chartId: string
}

const getSymbolByUrl = () => {
  const query = qs.parse(window.location.search, { ignoreQueryPrefix: true })
  return query.symbol as string
}

const convertToStock = (candlesticks: StockRawRecord[]) =>
  candlesticks.map(c => {
    c[6] = c[6]! / 10000
    return stockUtils.toStock(c)
  })

export const MainChart = (props: MainChartProps) => {
  const [symbol, setSymbol] = useState(getSymbolByUrl())
  const gapShow = useConfig(s => s.setting.gapShow)
  const activeChartId = useChartManage(s => s.activeChartId)
  const chartStore = useChartManage(s => s.chartStores[props.chartId])
  const chartImp = useRef<ComponentRef<typeof JknChart>>(null)
  const { candlesticks, startAt } = useCandlesticks(symbol, chartStore.interval)
  const stockCache = useRef({
    compare: new Map(),
    mark: '',
    rightAxisBeforePk: null as Nullable<typeof chartStore.yAxis>
  })
  const lastBarInInterval = useRef<Stock | null>(null)

  useStockBarSubscribe([`${symbol}@${stockUtils.intervalToPeriod(chartStore.interval)}`], data => {
    const mode = useChartManage.getState().chartStores[props.chartId].mode
    if (mode === 'backTest') return
    const interval = useChartManage.getState().chartStores[props.chartId].interval
    const record = stockUtils.toStock(data.rawRecord)
    const trading = stockUtils.getTrading(record.timestamp)
    const symbol = useChartManage.getState().chartStores[props.chartId].symbol
    const [_symbol] = data.topic.split('@')
    if (_symbol !== symbol) {
      console.log('stock bar subscribe symbol error')
      console.warn(_symbol, symbol)
      return
    }

    if (!renderUtils.shouldUpdateChart(trading, interval)) {
      if (lastBarInInterval.current) {
        if (trading === 'afterHours' && stockUtils.getTrading(lastBarInInterval.current.timestamp) === 'intraDay') {
          chartImp.current?.appendCandlestick({
            ...lastBarInInterval.current
          }, interval)
        }
      }
      return
    }

    const lastData = chartImp.current?.getChart()?.getDataList()?.slice(-1)[0]

    if (chartImp.current?.isSameIntervalCandlestick(record, interval)) {
      lastBarInInterval.current = record
      if (trading === 'intraDay') {
        chartImp.current?.appendCandlestick({
          ...record,
          close: lastData?.close ?? record.close,
        }, interval)
      } else {
        chartImp.current?.appendCandlestick({
          ...record
        }, interval)
      }
    } else {
      // 用bar数据覆盖上一根k线quote的数据
      if (lastBarInInterval.current) {
        chartImp.current?.appendCandlestick(
          {
            ...lastBarInInterval.current
          },
          interval
        )
        lastBarInInterval.current = null
      }
      chartImp.current?.appendCandlestick(
        {
          ...record
        },
        interval
      )
    }
  })

  useEffect(() => {
    return stockSubscribe.onQuoteTopic(symbol, data => {
      const _symbol = useChartManage.getState().chartStores[props.chartId].symbol
      if(data.topic !== _symbol) return
      const trading = useTime.getState().getTrading()
      const mode = useChartManage.getState().chartStores[props.chartId].mode
      if (mode === 'backTest') return

      if (!renderUtils.shouldUpdateChart(trading, chartStore.interval)) {
        return
      }

      const chart = chartImp.current?.getChart()
      const lastData = chart?.getDataList()?.slice(-1)[0]

      if (!lastData) return
      const newData = {
        ...lastData,
        close: data.record.close
      }

      if (newData.high < newData.close) {
        newData.close = newData.high
      }
      
      if (newData.low > newData.close) {
        newData.close = newData.low
      }

      chartImp.current?.appendCandlestick(newData, chartStore.interval)
    })
  }, [chartStore.interval, symbol, props.chartId])

  /**
   * 初始化
   */
  useMount(() => {
    chartManage.cleanStockOverlay()
    chartManage.setMode('normal')
    const _store = useChartManage.getState().chartStores[props.chartId]

    const stockData = convertToStock(candlesticks)

    chartImp.current?.applyNewData(stockData)

    chartImp.current?.setChartType(_store.type === ChartType.Candle ? 'candle' : 'area')

    if (_store.mainIndicators.length) {
      _store.mainIndicators.forEach(indicator => {
        chartImp.current?.createIndicator({
          indicator: indicator.id.toString(),
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
          indicator: indicator.id.toString(),
          symbol,
          interval: chartStore.interval,
          name: indicator.name,
          isRemote: renderUtils.isRemoteIndicator(indicator)
        })
      })
    }

    if (_store.overlayMark) {
      stockCache.current.mark =
        chartImp.current?.createMarkOverlay(symbol, _store.overlayMark.type, _store.overlayMark.mark, () => {
          chartManage.removeMarkOverlay(props.chartId)
        }) ?? ''
    }

    const chart = chartImp.current?.getChart()

    if (chart) {
      chart.subscribeAction('onIndicatorActionClick' as any, (e: any) => {
        if (e.event === 'delete') {
          if (e.paneId === ChartTypes.MAIN_PANE_ID) {
            chartManage.removeMainIndicator(e.indicator.id.toString(), props.chartId)
          } else {
            chartManage.removeSecondaryIndicator(e.indicator.id.toString(), props.chartId)
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
    } else {
      if (_store.yAxis.left) {
        chartImp.current?.setAxisType('double')
      } else if (_store.yAxis.right === MainYAxis.Percentage) {
        chartImp.current?.setAxisType('percentage')
      } else {
        chartImp.current?.setAxisType('normal')
      }
    }

    if (Number.parseInt(gapShow) > 0) {
      chartImp.current?.createGapIndicator(Number.parseInt(gapShow))
    }

    // chartImp.current?.setLeftAxis(!!_store.yAxis.left)
    // chartImp.current?.setRightAxis(_store.yAxis.right === MainYAxis.Percentage ? 'percentage' : 'normal')
  })

  useUnmount(() => {
    const chart = chartImp.current?.getChart()
    chart?.unsubscribeAction('onIndicatorActionClick' as any)
  })
  /**
   * 数据变化
   */
  useEffect(() => {
    if (chartStore.mode === 'backTest') {
      return
    }
    if (!candlesticks.length) {
      chartImp.current?.applyNewData([])
      return
    }

    const stockData = convertToStock(candlesticks)

    chartImp.current?.applyNewData(stockData)

    chartImp.current?.removeBackTestIndicator()
  }, [candlesticks, chartStore.mode])

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

    const cancelSymbolEvent = chartEvent.on('symbolChange', symbol => {
      setSymbol(symbol)
      chartManage.setSymbol(symbol, props.chartId)
      chartManage.setMode('normal')
    })

    const cancelIntervalEvent = chartEvent.on('intervalChange', async interval => {
      if (renderUtils.isTimeIndexChart(interval)) {
        // chartManage.setType(ChartType.Area, props.chartId)
        chartImp.current?.setTimeShareChart(interval)
      } else {
        chartImp.current?.setTimeShareChart()
        const c = chartManage.getChart(props.chartId)
        chartImp.current?.setChartType(c?.type === ChartType.Candle ? 'candle' : 'area')
      }
      chartManage.setMode('normal')
      Array.from(stockCache.current.compare.entries()).forEach(([_, indicatorId]) => {
        chartImp.current?.setStockCompare(indicatorId, {
          interval,
          startAt: renderUtils.getChartStartDate(interval)
        })
      })
    })

    const cancelCharTypeEvent = chartEvent.on('chartTypeChange', type => {
      chartImp.current?.setChartType(type === ChartType.Candle ? 'candle' : 'area')
    })

    const cancelIndicatorEvent = chartEvent.on('mainIndicatorChange', ({ type, indicator }) => {
      if (type === 'add') {
        chartImp.current?.createIndicator({
          indicator: indicator.id.toString(),
          symbol,
          interval: chartStore.interval,
          name: indicator.name,
          isRemote: renderUtils.isRemoteIndicator(indicator)
        })
      } else {
        chartImp.current?.removeIndicator(indicator.id.toString())
      }
    })

    const cancelSubIndicatorEvent = chartEvent.on('subIndicatorChange', ({ type, indicator }) => {
      if (type === 'add') {
        chartImp.current?.createSubIndicator({
          indicator: indicator.id.toString(),
          symbol,
          interval: chartStore.interval,
          name: indicator.name,
          isRemote: renderUtils.isRemoteIndicator(indicator)
        })
      } else {
        chartImp.current?.removeSubIndicator(indicator.id.toString())
      }
    })

    const cancelStockCompareChange = chartEvent.on('stockCompareChange', ({ type, symbol }) => {
      if (chartImp.current === null) return
      if (type === 'add') {
        if (!stockCache.current.compare.has(symbol)) {
          if (!stockCache.current.rightAxisBeforePk) {
            stockCache.current.rightAxisBeforePk = {
              ...useChartManage.getState().chartStores[props.chartId].yAxis
            }
          }
          const color = colorUtil.colorPalette[stockCache.current.compare.size]

          stockCache.current.compare.set(
            symbol,
            chartImp.current?.createStockCompare(symbol, {
              color,
              interval: chartStore.interval,
              startAt: startAt.current ?? undefined
            })
          )
        }
      } else {
        stockCache.current.compare.delete(symbol)
        if (stockCache.current.compare.size === 0 && stockCache.current.rightAxisBeforePk) {
          chartManage.setYAxis(stockCache.current.rightAxisBeforePk, props.chartId)
          stockCache.current.rightAxisBeforePk = null
        }
        chartImp.current?.removeStockCompare(symbol)
      }
    })

    const cancelMarkChange = chartEvent.on('markOverlayChange', async ({ type, params }) => {
      if (type === 'add') {
        if (stockCache.current.mark) {
          chartImp.current?.removeMarkOverlay(stockCache.current.mark)
        }

        stockCache.current.mark =
          chartImp.current?.createMarkOverlay(symbol, params.type, params.mark, () => {
            chartManage.removeMarkOverlay(props.chartId)
          }) ?? ''
      } else {
        chartImp.current?.removeMarkOverlay(stockCache.current.mark)
        stockCache.current.mark = ''
      }
    })

    const cancelYAxisChange = chartEvent.on('yAxisChange', type => {
      if (type.left) {
        chartImp.current?.setAxisType('double')
      } else if (type.right === MainYAxis.Percentage) {
        chartImp.current?.setAxisType('percentage')
      } else {
        chartImp.current?.setAxisType('normal')
      }

      // chartImp.current?.setLeftAxis(!!type.left)
      // chartImp.current?.setRightAxis(type.right === MainYAxis.Percentage ? 'percentage' : 'normal')
    })

    const cancelDrawStart = chartEvent.on('drawStart', type => {
      chartImp.current?.createOverlay(type, type => {
        chartEvent.get().emit('drawEnd', type)
        return true
      })
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
      cancelDrawStart()
    }
  }, [activeChartId, props.chartId, chartStore.interval, symbol, startAt])

  // useUpdateEffect(() => {
  //   chartImp.current?.setChartType(chartStore.type === ChartType.Candle ? 'candle' : 'area')
  // }, [chartStore.type])

  // useUpdateEffect(() => {
  //   if (chartStore.mode === 'normal') {
  //     refreshCandlesticks()
  //     chartImp.current?.removeBackTestIndicator()
  //   }
  // }, [chartStore.mode])

  const onAddBackTestRecord = (record: any) => {
    chartImp.current?.createBackTestIndicator([record])
  }

  const onSetBackTestRecord = (records: any[]) => {
    chartImp.current?.setBackTestIndicator(records)
  }

  const onNextBackTestLine = (candlestick: StockRawRecord) => {
    chartImp.current?.appendCandlestick(stockUtils.toStock(candlestick), chartStore.interval)
  }

  const onPrevBackTestLine = () => {
    chartImp.current?.restoreCandlestick(1)
  }

  return (
    <ChartContextMenu chartId={props.chartId}>
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-4">
          {chartStore.overlayStock.map((item, index) => (
            <div
              key={item.symbol}
              className="cursor-pointer text-xs text-transparent border border-solid border-transparent flex items-center hover:text-foreground hover:border-foreground box-border px-1.5 rounded"
            >
              <span className="size-2" style={{ background: colorUtil.colorPalette[index] }} />
              <span className="text-foreground mx-2">{item.symbol}</span>
              <JknIcon.Svg
                name="delete"
                size={12}
                onClick={() => chartManage.removeStockOverlay(item.symbol, props.chartId)}
              />
            </div>
          ))}
        </div>
        <JknChart className="w-full" showLogo ref={chartImp} />
      </div>
      {chartStore.mode === 'backTest' ? (
        <div>
          <BackTestBar
            chartId={props.chartId}
            candlesticks={candlesticks}
            onNextCandlesticks={onNextBackTestLine}
            onChangeCandlesticks={d => chartImp.current?.applyNewData(convertToStock(d))}
            onAddBackTestRecord={onAddBackTestRecord}
            onSetBackTestRecord={onSetBackTestRecord}
            onPrevCandlesticks={onPrevBackTestLine}
          />
        </div>
      ) : null}
    </ChartContextMenu>
  )
}
