import type { StockChartInterval, StockRawRecord } from '@/api'
import { JknChart } from '@/components'
import { calcCoiling } from '@/utils/coiling'
import { type StockSubscribeHandler, stockUtils } from '@/utils/stock'
import { useMount, useUpdateEffect } from 'ahooks'
import qs from 'qs'
import { type ComponentRef, useCallback, useEffect, useRef, useState } from 'react'
import { chartEvent } from '../lib/event'
import { fetchCandlesticks, useCandlesticks } from '../lib/request'
import { chartManage, ChartType, useChartManage } from '../lib/store'
import { renderUtils } from '../lib/utils'
import { ChartContextMenu } from './chart-context-menu'
import { BackTestBar } from "./back-test-bar"
import { useStockBarSubscribe } from "@/hooks"

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
  const activeChartId = useChartManage(s => s.activeChartId)
  const chartStore = useChartManage(s => s.chartStores[props.chartId])
  const chartImp = useRef<ComponentRef<typeof JknChart>>(null)
  const { candlesticks, startAt, refreshCandlesticks } = useCandlesticks(symbol, chartStore.interval)
  const stockCache = useRef({
    compare: new Map(),
    mark: ''
  })

  const render = useCallback(
    async ({
      candlesticks,
      interval,
      chartId
    }: { candlesticks: StockRawRecord[]; interval: StockChartInterval; chartId: string }) => {
      const _store = useChartManage.getState().chartStores[chartId]
      const stockData = convertToStock(candlesticks)

      if (_store.coiling.length) {
        const r = await calcCoiling(candlesticks, interval)
        _store.coiling.forEach(coiling => {
          chartImp.current?.setCoiling(coiling, r)
        })
      }

      chartImp.current?.setChartType(_store.type === ChartType.Candle ? 'candle' : 'area')

      chartImp.current?.applyNewData(stockData)
    },
    []
  )

  const subscribeHandler: StockSubscribeHandler<'bar'> = (data) => {
    
  }
  useStockBarSubscribe([symbol], subscribeHandler)

  /**
   * 初始化
   */
  useMount(() => {
    const _store = useChartManage.getState().chartStores[props.chartId]

    if (_store.mainIndicators.length) {
      _store.mainIndicators.forEach(indicator => {
        chartImp.current?.createIndicator(indicator.id, symbol, chartStore.interval, indicator.name)
      })
    }

    if (_store.secondaryIndicators) {
      _store.secondaryIndicators.forEach(indicator => {
        chartImp.current?.createSubIndicator({
          indicator: indicator.id,
          symbol,
          interval: chartStore.interval,
          name: indicator.name
        })
      })
    }

    chartImp.current?.setChartType(_store.type === ChartType.Candle ? 'candle' : 'area')

    if (_store.overlayMark) {
      stockCache.current.mark =
        chartImp.current?.createMarkOverlay(symbol, _store.overlayMark.type, _store.overlayMark.mark) ?? ''
    }
  })

  useEffect(() => {
    if (!candlesticks.length) {
      chartImp.current?.applyNewData([])
      return
    }
    render({ candlesticks, interval: chartStore.interval, chartId: props.chartId })
  }, [candlesticks, chartStore.interval, render, props.chartId])

  /**
   * chart事件处理
   */
  useEffect(() => {
    if (activeChartId !== props.chartId) return

    const cancelSymbolEvent = chartEvent.on('symbolChange', (symbol) => {
      setSymbol(symbol)
    })

    const cancelCoilingEvent = chartEvent.on('coilingChange', ({ type, coiling }) => {
      if (type === 'add') {

        calcCoiling(candlesticks, chartStore.interval).then(r => {
          coiling.forEach(coiling => {
            chartImp.current?.setCoiling(coiling, r)
          })
        })
      } else {
        chartImp.current?.removeCoiling(coiling)
      }
    })

    const cancelIntervalEvent = chartEvent.on('intervalChange', async (interval) => {
      if (renderUtils.isTimeIndexChart(interval)) {
        chartManage.setType(ChartType.Area, props.chartId)
      }
    })

    const cancelIndicatorEvent = chartEvent.on('mainIndicatorChange', ({ type, indicator }) => {
      if (type === 'add') {
        chartImp.current?.createIndicator(indicator.id, symbol, chartStore.interval, indicator.name)
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
          name: indicator.name
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

            stockCache.current.compare.set(symbol, chartImp.current?.createStockCompare(compareCandlesticks, 'blue'))
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

    return () => {
      cancelSymbolEvent()
      cancelCoilingEvent()
      cancelIndicatorEvent()
      cancelSubIndicatorEvent()
      cancelStockCompareChange()
      cancelMarkChange()
      cancelIntervalEvent()
    }
  }, [activeChartId, props.chartId, candlesticks, chartStore.interval, symbol, startAt])

  useUpdateEffect(() => {
    chartImp.current?.setChartType(chartStore.type === ChartType.Candle ? 'candle' : 'area')
  }, [chartStore.type])

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
      onChangeSecondaryCount={(count: number): void => {
        throw new Error('Function not implemented.')
      }}
    >
      <div className="flex-1 overflow-hidden">
        <JknChart className="w-full" ref={chartImp} />
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
