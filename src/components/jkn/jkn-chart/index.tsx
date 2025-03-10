import type { StockChartInterval } from '@/api'
import { useIndicator } from '@/store'
import { dateUtils } from '@/utils/date'
import { cn } from '@/utils/style'
import {
  type CandleType,
  type Chart,
  type LayoutChildType,
  dispose,
  init,
  registerFigure,
  registerIndicator
} from 'jkn-kline-chart'
import { uid } from 'radash'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import {
  CoilingIndicatorId,
  mainTrendCoiling,
  penCoiling,
  pivotCoiling,
  shortLineCoiling,
  tradePointOneTypeCoiling,
  tradePointThreeTypeCoiling,
  tradePointTwoTypeCoiling
} from './coiling'
import { backTestLineFigure, backTestMarkFigure, IconFigure, markOverlayFigure } from './figure'
import { compareIndicator, localIndicator } from './indicator'
import { markIndicator } from './indicator/mark'
import type { AxisPosition, Candlestick } from './types'
import { ChartTypes, getStockColor, transformCandleColor, transformTextColor } from './utils'
import { backTestIndicator, type BackTestRecord } from "./indicator/back-test"

registerIndicator(penCoiling)
registerIndicator(tradePointOneTypeCoiling)
registerIndicator(tradePointTwoTypeCoiling)
registerIndicator(tradePointThreeTypeCoiling)
registerIndicator(pivotCoiling)
registerIndicator(shortLineCoiling)
registerIndicator(mainTrendCoiling)
registerIndicator(localIndicator)
registerIndicator(compareIndicator)
registerIndicator(markIndicator)
registerIndicator(backTestIndicator)
registerFigure(backTestMarkFigure)
registerFigure(backTestLineFigure)
registerFigure(IconFigure)
registerFigure(markOverlayFigure)

interface JknChartProps {
  className?: string
}

type IndicatorParams = {
  indicator: string
  symbol: string
  interval: StockChartInterval
  name: string
}

interface JknChartIns {
  applyNewData: Chart['applyNewData']
  setCoiling: (coiling: CoilingIndicatorId, data: CoilingData) => void
  setLeftAxis: (show: boolean) => void
  setRightAxis: (type: 'percentage' | 'normal') => void
  setChartType: (type: 'area' | 'candle') => void
  removeCoiling: (coiling: CoilingIndicatorId[]) => void
  removeAllCoiling: () => void
  createIndicator: (indicator: string, symbol: string, interval: StockChartInterval, name: string) => void
  removeIndicator: (indicator: string) => void
  createSubIndicator: (params: IndicatorParams) => Nullable<string>
  setSubIndicator: (paneId: string, params: IndicatorParams) => void
  removeSubIndicator: (paneId: string) => void
  createStockCompare: (candlesticks: number[], color: string) => string
  removeStockCompare: (indicatorId: string) => void
  createMarkOverlay: (symbol: string, type: string, mark: string) => string
  removeMarkOverlay: (indicatorId: string) => void
  setMarkOverlay: (mark: string) => void
  createBackTestIndicator: (record: (Optional<BackTestRecord, 'index'>[])) => Nullable<string> | undefined
  setBackTestIndicator: (record: (Optional<BackTestRecord, 'index'>[])) => boolean | undefined
  removeBackTestIndicator: () => void
}

export const JknChart = forwardRef<JknChartIns, JknChartProps>((props: JknChartProps, ref) => {
  const domRef = useRef<HTMLDivElement>(null)
  const chart = useRef<Chart | null>()
  const subIndicator = useRef<Map<string, { params: IndicatorParams; id: string }>>(new Map())

  useEffect(() => {
    const { up: upColor, down: downColor } = getStockColor()
    const ele = domRef.current
    if (!ele) return
    chart.current = init(ele, {
      styles: {
        grid: {
          horizontal: {
            color: '#202123'
          },
          vertical: {
            color: '#202123'
          }
        },
        candle: {
          bar: {
            color: transformCandleColor,
            upBorderColor: upColor,
            upColor: upColor,
            upWickColor: upColor,
            downBorderColor: downColor,
            downColor: downColor,
            downWickColor: downColor,
            noChangeBorderColor: downColor,
            noChangeColor: downColor,
            noChangeWickColor: downColor
          },
          tooltip: {
            showType: 'rect' as any,
            custom: ({ current }: { current: Candlestick }) => {
              let format = 'MM-DD HH:mm w'

              const time = dateUtils.toUsDay(current.timestamp)
              if (time.format('HH:mm') === '00:00') {
                format = 'YYYY-MM-DD w'
              }
              const amount = current.close - current.prevClose
              const percent = (amount / current.prevClose) * 100
              const color = amount > 0 ? upColor : downColor
              return [
                { title: time.format(format), value: '' },
                { title: '开盘', value: current.open.toFixed(3) },
                { title: '收盘', value: current.close.toFixed(3) },
                { title: '最高', value: current.high.toFixed(3) },
                { title: '最低', value: current.low.toFixed(3) },
                { title: '涨跌额', value: { text: `${amount > 0 ? '+' : ''}${amount.toFixed(3)}`, color } },
                { title: '涨跌幅', value: { text: `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`, color } },
                { title: '成交量', value: current.volume ?? 0 }
              ]
            },
            rect: {
              borderColor: '#353535',
              color: '#202020'
            },
            text: {
              color: '#fff'
            }
          },
          priceMark: {
            last: {
              upColor: upColor,
              downColor: downColor
            }
          }
        },

        yAxis: {
          tickText: {
            color: (_ctx, text, chart) => {
              const data = chart.getDataList()
              const range = chart.getVisibleRange()
              const startData = data[range.from]
              return transformTextColor(text, startData)
            }
          },
          tickLine: {
            color: '#202123'
          },
          axisLine: {
            color: '#202123'
          }
        },
        xAxis: {
          axisLine: {
            color: '#202123'
          },
          tickLine: {
            color: '#202123'
          }
        },
        separator: {
          color: '#202020'
        },
        crosshair: {
          horizontal: {
            text: {
              color: '#fff',
              backgroundColor: (text, chart) => {
                const data = chart.getDataList()
                const range = chart.getVisibleRange()
                const startData = data[range.from]
                return transformTextColor(text, startData)
              }
            }
          }
        }
      },
      layout: [
        {
          type: 'candle' as LayoutChildType,
          options: {
            axis: {
              position: 'right' as AxisPosition,
              name: 'percentage'
            },
            leftAxis: {
              position: 'right' as AxisPosition
            }
          }
        }
      ],
      timezone: 'America/New_York'
    })

    return () => {
      domRef.current && dispose(domRef.current)
      chart.current = null
    }
  }, [])

  useImperativeHandle(ref, () => ({
    applyNewData: data => {
      chart.current?.applyNewData(data)
    },
    setLeftAxis: show => {
      chart.current?.setPaneOptions({
        leftAxis: {
          position: (show ? 'left' : 'none') as AxisPosition
        }
      })
    },
    setRightAxis: type => {
      chart.current?.setPaneOptions({
        axis: {
          name: type
        }
      })
    },
    setChartType: type => {
      chart.current?.setStyles({
        candle: {
          type: (type === 'area' ? 'area' : 'candle_solid') as CandleType
        }
      })
    },
    setCoiling: (coiling, data) => {
      const hasIndicator = chart.current?.getIndicators({ id: `coiling-${coiling}` })
      let indicator: { name: string; id: string; calcParams?: any[] } | undefined = undefined

      if (CoilingIndicatorId.PEN === coiling) {
        indicator = {
          name: `coiling-${CoilingIndicatorId.PEN}`,
          id: `coiling-${CoilingIndicatorId.PEN}`,
          calcParams: [data.points, data.status]
        }
      } else if (
        [CoilingIndicatorId.ONE_TYPE, CoilingIndicatorId.TWO_TYPE, CoilingIndicatorId.THREE_TYPE].includes(coiling)
      ) {
        indicator = {
          name: `coiling-${coiling}`,
          id: `coiling-${coiling}`,
          calcParams:
            coiling === CoilingIndicatorId.THREE_TYPE
              ? [data.class_3_trade_points]
              : coiling === CoilingIndicatorId.TWO_TYPE
                ? [data.class_2_trade_points]
                : [data.class_1_trade_points]
        }
      } else if (CoilingIndicatorId.PIVOT === coiling) {
        indicator = {
          name: `coiling-${CoilingIndicatorId.PIVOT}`,
          id: `coiling-${CoilingIndicatorId.PIVOT}`,
          calcParams: [data.pivots, data.expands]
        }
      } else if (CoilingIndicatorId.SHORT_LINE === coiling) {
        indicator = {
          name: `coiling-${CoilingIndicatorId.SHORT_LINE}`,
          id: `coiling-${CoilingIndicatorId.SHORT_LINE}`
        }
      } else if (CoilingIndicatorId.MAIN === coiling) {
        indicator = {
          name: `coiling-${CoilingIndicatorId.MAIN}`,
          id: `coiling-${CoilingIndicatorId.MAIN}`
        }
      }

      if (!indicator) return

      if (hasIndicator?.length) {
        chart.current?.overrideIndicator(indicator)
      } else {
        chart.current?.createIndicator(indicator, true, { id: ChartTypes.MAIN_PANE_ID })
      }
    },
    removeCoiling: coiling => {
      coiling.forEach(c => {
        chart.current?.removeIndicator({ id: `coiling-${c}` })
      })
    },
    removeAllCoiling: () => {
      const allCoiling = [
        CoilingIndicatorId.PEN,
        CoilingIndicatorId.ONE_TYPE,
        CoilingIndicatorId.TWO_TYPE,
        CoilingIndicatorId.THREE_TYPE,
        CoilingIndicatorId.PIVOT,
        CoilingIndicatorId.SHORT_LINE,
        CoilingIndicatorId.MAIN
      ]
      allCoiling.forEach(c => {
        chart.current?.removeIndicator({ id: `coiling-${c}` })
      })
    },
    createIndicator: (indicator, symbol, interval, name) => {
      const formula = useIndicator.getState().formula

      if (!formula[indicator]) return

      chart.current?.createIndicator(
        {
          name: 'local-indicator',
          id: indicator,
          calcParams: [indicator, symbol, interval],
          extendData: { name }
        },
        true,
        { id: ChartTypes.MAIN_PANE_ID }
      )
    },
    removeIndicator: indicator => {
      chart.current?.removeIndicator({ id: indicator })
    },
    createSubIndicator(params) {
      if (!chart.current) return null
      const iid = uid(8)
      const indicator = {
        name: 'local-indicator',
        id: iid,
        calcParams: [params.indicator, params.symbol, params.interval],
        extendData: { name: params.name, indicatorId: params.indicator }
      }
      const paneId = chart.current?.createIndicator(indicator, false, {})

      if (paneId) {
        subIndicator.current.set(paneId, {
          params: params,
          id: iid
        })
      }
      return paneId
    },
    setSubIndicator(paneId, params) {
      if (!chart.current) return

      const sub = subIndicator.current.get(paneId)

      if (!sub) return

      chart.current.overrideIndicator({
        name: 'local-indicator',
        id: sub?.id,
        calcParams: [params.indicator, params.symbol, params.interval],
        extendData: { name: params.name, indicatorId: params.indicator }
      })
    },
    removeSubIndicator(paneId) {
      if (subIndicator.current.has(paneId)) {
        chart.current?.removeIndicator({ paneId: paneId })
      }
    },
    createStockCompare: (candlesticks, color) => {
      const indicator = uid(8)
      chart.current?.createIndicator(
        {
          name: 'compare-indicator',
          id: indicator,
          calcParams: [candlesticks, color]
        },
        true,
        { id: ChartTypes.MAIN_PANE_ID }
      )

      return indicator
    },
    removeStockCompare: indicatorId => {
      chart.current?.removeIndicator({ id: indicatorId })
    },
    createMarkOverlay: (symbol, type, mark) => {
      return chart.current?.createIndicator(
        {
          name: 'mark-indicator',
          calcParams: [symbol, type, mark]
        },
        true,
        { id: ChartTypes.MAIN_PANE_ID }
      )!
    },
    removeMarkOverlay: indicatorId => {
      chart.current?.removeIndicator({ id: indicatorId })
    },
    setMarkOverlay: _mark => { },
    createBackTestIndicator: (record) => {
      const id = 'back-test-indicator'
      if (chart.current?.getIndicators({ id: id }).length) {
        const _indicator = chart.current?.getIndicators({ id: id })[0]
        chart.current.overrideIndicator({
          name: 'back-test-indicator',
          id: id,
          calcParams: [[..._indicator.calcParams[0] as any, ...record]],
        })

        return id
      }
      return chart.current?.createIndicator(
        {
          name: 'back-test-indicator',
          id: 'back-test-indicator',
          calcParams: [record],
        },
        true,
        { id: ChartTypes.MAIN_PANE_ID }
      )
    },
    setBackTestIndicator: (record) => {
      const id = 'back-test-indicator'
      return chart.current?.overrideIndicator({
        name: 'back-test-indicator',
        id: id,
        calcParams: [record],
      })
    },
    removeBackTestIndicator: () => {
      chart.current?.removeIndicator({ id: 'back-test-indicator' })
    }
  }))

  useEffect(() => {
    // 重置大小
    const sizeObserver = new ResizeObserver(() => {
      chart.current?.resize()
    })

    sizeObserver.observe(domRef.current!)

    return () => {
      sizeObserver.disconnect()
    }
  }, [])

  return <div className={cn('w-full h-full', props.className)} ref={domRef} />
})
