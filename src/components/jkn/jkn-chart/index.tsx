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
import { backTestLineFigure, backTestMarkFigure, IconFigure, markOverlayFigure } from './figure'
import { compareIndicator, localIndicator } from './indicator'
import { markIndicator } from './indicator/mark'
import type { AxisPosition, Candlestick } from './types'
import { ChartTypes, getStockColor, isSameInterval, transformCandleColor, transformTextColor } from './utils'
import { backTestIndicator, type BackTestRecord } from "./indicator/back-test"
import { CoilingIndicatorId } from "./coiling-calc"
import { coilingIndicator } from "./indicator/coiling"
import dayjs from "dayjs"

export { CoilingIndicatorId, ChartTypes }

registerIndicator(coilingIndicator)
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
  appendCandlestick: (kline: Candlestick, interval: number) => void
  isSameIntervalCandlestick: (kline: Candlestick, interval: number) => undefined | boolean
  setCoiling: (coiling: CoilingIndicatorId[], interval: number) => void
  removeCoiling: (coiling: CoilingIndicatorId[]) => void
  setLeftAxis: (show: boolean) => void
  setRightAxis: (type: 'percentage' | 'normal') => void
  setChartType: (type: 'area' | 'candle') => void
  removeAllCoiling: () => void
  createIndicator: (indicator: string, symbol: string, interval: StockChartInterval, name: string) => void
  removeIndicator: (indicator: string) => void
  setIndicatorVisible: (indicatorId: string, visible: boolean) => void
  createSubIndicator: (params: IndicatorParams) => Nullable<string>
  setSubIndicator: (indicatorId: string, params: IndicatorParams) => void
  removeSubIndicator: (indicatorId: string) => void
  createStockCompare: (candlesticks: number[], color: string) => string
  removeStockCompare: (indicatorId: string) => void
  createMarkOverlay: (symbol: string, type: string, mark: string) => string
  removeMarkOverlay: (indicatorId: string) => void
  setMarkOverlay: (mark: string) => void
  createBackTestIndicator: (record: (Optional<BackTestRecord, 'index'>[])) => Nullable<string> | undefined
  setBackTestIndicator: (record: (Optional<BackTestRecord, 'index'>[])) => boolean | undefined
  removeBackTestIndicator: () => void
  setDragEnable: (enable: boolean) => void
  getChart: () => Chart | null | undefined
}

export const JknChart = forwardRef<JknChartIns, JknChartProps>((props: JknChartProps, ref) => {
  const domRef = useRef<HTMLDivElement>(null)
  const chart = useRef<Chart | null>()

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
            expand: true,
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
                { title: { text: time.format(format), color: '#808080' }, value: '' },
                { title: { text: '开：', color: '#808080' }, value: { text: current.open.toFixed(3), color: '#808080' } },
                { title: { text: '高：', color: '#808080' }, value: { text: current.high.toFixed(3), color: '#808080' } },
                { title: { text: '低：', color: '#808080' }, value: { text: current.low.toFixed(3), color: '#808080' } },
                { title: { text: '收：', color: '#808080' }, value: { text: current.close.toFixed(3), color: '#808080' } },
                { title: { text: '涨跌额：', color: '#808080' }, value: { text: `${amount > 0 ? '+' : ''}${amount.toFixed(3)}`, color } },
                { title: { text: '涨跌幅：', color: '#808080' }, value: { text: `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`, color } },
              ]
            },
            text: {
              color: '#808080'
            }
          },
          priceMark: {
            last: {
              upColor: upColor,
              downColor: downColor
            },
            high: {
              color: '#E7C88D',
               textSize: 14
            },
            low: {
              color: '#E7C88D',
               textSize: 14
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
              name: 'normal'
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
    appendCandlestick: (candlestick, interval) => {
      const lastData = chart.current?.getDataList().slice(-1)[0]
      if (!lastData) return

      const r = isSameInterval(lastData, candlestick, interval)

      if (r === undefined) return

      if(r) {
        const _r = {
          ...candlestick,
          timestamp: lastData.timestamp
        }

        chart.current?.updateData(_r)
      }else{
        const _r = {
          ...candlestick,
          timestamp: dayjs(candlestick.timestamp).second(0).millisecond(0).valueOf()
        }

        chart.current?.updateData(_r)
      }
    },
    isSameIntervalCandlestick: (candlestick, interval) => {
      const lastData = chart.current?.getDataList().slice(-1)[0]
      if (!lastData) return

      return isSameInterval(lastData, candlestick, interval)
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
      console.log(chart.current, (type === 'area' ? 'area' : 'candle_solid'))
      chart.current?.setStyles({
        candle: {
          type: (type === 'area' ? 'area' : 'candle_solid') as CandleType
        }
      })
    },
    setCoiling: (coilingIds, interval) => {
      const hasIndicator = chart.current?.getIndicators({ id: 'coiling' })
      const indicator = {
        name: 'coiling',
        id: 'coiling',
        calcParams: [interval, coilingIds]
      }

      if (hasIndicator?.length) {
        chart.current?.overrideIndicator(indicator)
      } else {
        chart.current?.createIndicator(indicator, true, { id: ChartTypes.MAIN_PANE_ID })
      }
    },
    removeCoiling: coiling => {
      const indicator = chart.current?.getIndicators({ id: 'coiling' })[0]

      if (!indicator) return

      const coilingIds = indicator.calcParams[1] as CoilingIndicatorId[]
      const newCoiling = coilingIds.filter(c => !coiling.includes(c))
      chart.current?.overrideIndicator({
        name: 'coiling',
        id: 'coiling',
        calcParams: [indicator.calcParams[0], newCoiling]
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
          extendData: { name, action: ['visible', 'delete'] }
        },
        true,
        { id: ChartTypes.MAIN_PANE_ID }
      )
    },
    removeIndicator: indicator => {
      chart.current?.removeIndicator({ id: indicator })
    },
    setIndicatorVisible: (indicatorId, visible) => {
      console.log(visible)
      chart.current?.overrideIndicator({
        id: indicatorId,
        visible,
        name: "local-indicator"
      })
    },
    createSubIndicator(params) {
      if (!chart.current) return null
      const indicator = {
        name: 'local-indicator',
        id: params.indicator,
        calcParams: [params.indicator, params.symbol, params.interval],
        extendData: { name: params.name, indicatorId: params.indicator, action: ['delete'] }
      }
      chart.current?.createIndicator(indicator, false, {})

      return params.indicator
    },
    setSubIndicator(indicatorId, params) {
      if (!chart.current) return

      const sub = chart.current.getIndicators({ id: indicatorId })[0]

      if (!sub) return

      chart.current.overrideIndicator({
        name: 'local-indicator',
        id: sub?.id,
        calcParams: [params.indicator, params.symbol, params.interval],
        extendData: { name: params.name, indicatorId: params.indicator }
      })
    },
    removeSubIndicator(indicatorId) {
      chart.current?.removeIndicator({ id: indicatorId })
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
    },
    setDragEnable: enable => {

    },
    getChart: () => chart.current
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
