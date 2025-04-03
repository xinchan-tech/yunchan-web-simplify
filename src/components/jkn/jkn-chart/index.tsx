import { StockChartInterval } from '@/api'
import { useIndicator } from '@/store'
import { dateUtils } from '@/utils/date'
import { cn, colorUtil } from '@/utils/style'
import {
  type CandleType,
  type Chart,
  type LayoutChildType,
  dispose,
  init,
  registerFigure,
  registerIndicator,
  registerOverlay
} from 'jkn-kline-chart'
import { debounce, uid } from 'radash'
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { backTestLineFigure, backTestMarkFigure, compareLabelFigure, IconFigure, LogoFigure, markOverlayFigure } from './figure'
import { compareIndicator, gapIndicator, localIndicator } from './indicator'
import { markIndicator } from './indicator/mark'
import type { AxisPosition, Candlestick } from './types'
import { ChartTypes, getStockColor, isSameInterval, transformCandleColor, transformTextColor } from './utils'
import { backTestIndicator, type BackTestRecord } from "./indicator/back-test"
import { CoilingIndicatorId } from "./coiling-calc"
import { coilingIndicator } from "./indicator/coiling"
import dayjs from "dayjs"
import { LogoOverlay } from "./overlay"
import { useMount, useUnmount } from "ahooks"
import { VerticalLineOverlay } from "./overlay/line"
import { SplitIndicator } from "./indicator/split"
import Decimal from "decimal.js"

export { CoilingIndicatorId, ChartTypes }

registerIndicator(coilingIndicator)
registerIndicator(localIndicator)
registerIndicator(compareIndicator)
registerIndicator(markIndicator)
registerIndicator(backTestIndicator)
registerIndicator(gapIndicator)
registerIndicator(SplitIndicator)
registerFigure(backTestMarkFigure)
registerFigure(backTestLineFigure)
registerFigure(IconFigure)
registerFigure(markOverlayFigure)
registerFigure(LogoFigure)
registerFigure(compareLabelFigure)
registerOverlay(LogoOverlay)
registerOverlay(VerticalLineOverlay)

interface JknChartProps {
  className?: string
  showLogo?: boolean
}

type IndicatorParams = {
  indicator: string
  symbol: string
  interval: StockChartInterval
  name: string
  isRemote?: boolean
}

interface JknChartIns {
  applyNewData: Chart['applyNewData']
  appendCandlestick: (kline: Candlestick, interval: number) => void
  restoreCandlestick: (count: number) => void
  isSameIntervalCandlestick: (kline: Candlestick, interval: number) => undefined | boolean
  setCoiling: (coiling: CoilingIndicatorId[], interval: number) => void
  removeCoiling: (coiling: CoilingIndicatorId[]) => void
  // setLeftAxis: (show: boolean) => void
  setAxisType: (type: 'normal' | 'percentage' | 'double') => void
  // setRightAxis: (type: 'percentage' | 'normal') => void
  setChartType: (type: 'area' | 'candle') => void
  removeAllCoiling: () => void
  createIndicator: (params: IndicatorParams) => void
  removeIndicator: (indicator: string) => void
  setIndicatorVisible: (indicatorId: string, visible: boolean) => void
  createSubIndicator: (params: IndicatorParams) => Nullable<string>
  setSubIndicator: (indicatorId: string, params: IndicatorParams) => void
  removeSubIndicator: (indicatorId: string) => void
  createStockCompare: (symbol: string, candlesticks: number[], color: string) => string
  removeStockCompare: (symbol: string) => void
  createMarkOverlay: (symbol: string, type: string, mark: string, cb: (data: any) => void) => string
  removeMarkOverlay: (indicatorId: string) => void
  setMarkOverlay: (mark: string) => void
  createBackTestIndicator: (record: (Optional<BackTestRecord, 'num'>[])) => Nullable<string> | undefined
  setBackTestIndicator: (record: (Optional<BackTestRecord, 'num'>[])) => boolean | undefined
  removeBackTestIndicator: () => void
  setDragEnable: (enable: boolean) => void
  getChart: () => Chart | null | undefined
  setTimeShareChart: (interval?: StockChartInterval) => void
  createGapIndicator: (count: number) => void
  removeGapIndicator: () => void
  setGapIndicator: (count: number) => void
}

const getAxisType = (chart: Chart) => {
  let pane = chart.getPaneOptions(ChartTypes.MAIN_PANE_ID)

  if (Array.isArray(pane)) {
    pane = pane[0]
  }
  if (pane?.axis?.name === 'normal') {
    return 'normal'
  }

  if (pane?.axis?.name === 'percentage') {
    if (pane?.leftAxis?.position !== 'none' as any) {
      return 'double'
    }

    return 'percentage'
  }

  return 'normal'
}

const DEFAULT_AREA_BG_COLOR = {
  color: '#1677FF',
  bg: [{
    offset: 0,
    color: colorUtil.rgbaToString(colorUtil.hexToRGBA('#1677FF', 0.01))
  }, {
    offset: 1,
    color: colorUtil.rgbaToString(colorUtil.hexToRGBA('#1677FF', 0.2))
  }],
}

export const JknChart = forwardRef<JknChartIns, JknChartProps>((props: JknChartProps, ref) => {
  const domRef = useRef<HTMLDivElement>(null)

  const chart = useRef<Chart | null>()

  useMount(() => {
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
          area: {
            point: {
              show: false
            },
            lineColor: DEFAULT_AREA_BG_COLOR.color,
            backgroundColor: DEFAULT_AREA_BG_COLOR.bg
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
                { title: { text: time.format(format), color: '#DBDBDB' }, value: '' },
                { title: { text: '开：', color: '#DBDBDB' }, value: { text: current.open.toFixed(3), color: '#DBDBDB' } },
                { title: { text: '高：', color: '#DBDBDB' }, value: { text: current.high.toFixed(3), color: '#DBDBDB' } },
                { title: { text: '低：', color: '#DBDBDB' }, value: { text: current.low.toFixed(3), color: '#DBDBDB' } },
                { title: { text: '收：', color: '#DBDBDB' }, value: { text: current.close.toFixed(3), color: '#DBDBDB' } },
                { title: { text: '涨跌额：', color: '#DBDBDB' }, value: { text: `${amount > 0 ? '+' : ''}${amount.toFixed(3)}`, color } },
                { title: { text: '涨跌幅：', color: '#DBDBDB' }, value: { text: `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`, color } },
              ]
            },
            text: {
              color: '#808080'
            }
          },
          priceMark: {
            last: {
              upColor: upColor,
              downColor: downColor,
              noChangeColor: downColor,
              color: (data, chart) => {
                const lastData = data[data.length - 1]

                if (!lastData) return downColor

                const axisType = getAxisType(chart)

                if (axisType === 'normal') {
                  if (lastData.quote) {
                    const prev = (lastData.prevQuote as number) ?? lastData.prevClose

                    return lastData.quote > prev ? upColor : downColor
                  }

                  return lastData.close > lastData.prevClose ? upColor : downColor
                }
                console.log(axisType)
                if (axisType === 'percentage') {
                  const { from } = chart.getVisibleRange()
                  const firstData = data[from]

                  if (!firstData) return downColor

                  return lastData.close > firstData.prevClose ? upColor : downColor
                }

                if (axisType === 'double') {
                  const { from } = chart.getVisibleRange()
                  const firstData = data[from]

                  if (!firstData) return downColor

                  return lastData.close > firstData.open ? upColor : downColor
                }
                return lastData.close > lastData.prevClose ? upColor : downColor
              },
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
          },
          tickText: {
            color: '#B8B8B8'
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
              name: 'normal',
            },
            leftAxis: {
              position: 'right' as AxisPosition
            }
          }
        }
      ],
      timezone: 'America/New_York'
    })

    chart.current?.setPrecision({ price: 3 })

    if (props.showLogo) {
      chart.current?.createOverlay({
        name: 'logoOverlay',
        paneId: ChartTypes.MAIN_PANE_ID,
        points: [{ dataIndex: 0, value: 0 }]
      })
    }
  })

  useUnmount(() => {
    domRef.current && dispose(domRef.current)
    chart.current = null
  })

  useImperativeHandle(ref, () => ({
    applyNewData: data => {
      chart.current?.applyNewData(data)
    },
    appendCandlestick: (candlestick, interval) => {
      const lastData = chart.current?.getDataList().slice(-1)[0]
      if (!lastData) return

      const r = isSameInterval(lastData, candlestick, interval)

      if (r === undefined) return

      if (r) {
        const _r = {
          ...candlestick,
          timestamp: lastData.timestamp
        }

        chart.current?.updateData(_r)
      } else {
        const _r = {
          ...candlestick,
          timestamp: dayjs(candlestick.timestamp).second(0).millisecond(0).valueOf()
        }

        chart.current?.updateData(_r)
      }
    },
    restoreCandlestick: (count: number) => {
      chart.current?.restoreData(count)
    },
    isSameIntervalCandlestick: (candlestick, interval) => {
      const lastData = chart.current?.getDataList().slice(-1)[0]
      if (!lastData) return

      return isSameInterval(lastData, candlestick, interval)
    },
    setAxisType: type => {
      if (type === 'normal') {
        chart.current?.setPaneOptions({
          id: ChartTypes.MAIN_PANE_ID,
          axis: {
            name: 'normal',
            value: undefined
          },
          leftAxis: {
            position: 'none' as AxisPosition
          }
        })
      } else if (type === 'percentage') {
        chart.current?.setPaneOptions({
          id: ChartTypes.MAIN_PANE_ID,
          axis: {
            name: 'percentage',
            value: 'prevClose'
          },
          leftAxis: {
            position: 'none' as AxisPosition
          }
        })
      } else if (type === 'double') {
        chart.current?.setPaneOptions({
          id: ChartTypes.MAIN_PANE_ID,
          axis: {
            name: 'percentage',
            value: 'high'
          },
          leftAxis: {
            position: 'right' as AxisPosition
          }
        })
      }
    },
    // setLeftAxis: show => {
    //   chart.current?.setPaneOptions({
    //     leftAxis: {
    //       position: (show ? 'left' : 'none') as AxisPosition
    //     }
    //   })
    // },
    // setRightAxis: type => {
    //   chart.current?.setPaneOptions({
    //     axis: {
    //       name: type
    //     }
    //   })
    // },
    setChartType: type => {
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
    createIndicator: ({ indicator, symbol, interval, name, isRemote }) => {
      const formula = useIndicator.getState().formula

      if (!formula[indicator]) return

      chart.current?.createIndicator(
        {
          name: 'local-indicator',
          id: indicator,
          calcParams: [indicator, symbol, interval],
          extendData: { name, action: ['visible', 'delete'], isRemote }
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
        extendData: { name: params.name, indicatorId: params.indicator, action: ['delete'], isRemote: params.isRemote }
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
    createStockCompare: (symbol, candlesticks, color) => {
      const indicator = uid(8)
      chart.current?.createIndicator(
        {
          name: 'compare-indicator',
          id: `compare-${symbol}`,
          calcParams: [candlesticks, color]
        },
        true,
        { id: ChartTypes.MAIN_PANE_ID }
      )

      return indicator
    },
    removeStockCompare: symbol => {
      chart.current?.removeIndicator({ id: `compare-${symbol}` })
    },
    createMarkOverlay: (symbol, type, mark, cb) => {
      return chart.current?.createIndicator(
        {
          name: 'mark-indicator',
          calcParams: [symbol, type, mark],
          onClick: (id: any) => {
            cb(id)
          }
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
    getChart: () => chart.current,
    setTimeShareChart: (interval) => {
      const { up: upColor, down: downColor } = getStockColor()
      const splitId = 'split-indicator-large-cap'
      if (interval !== undefined) {
        if (![StockChartInterval.AFTER_HOURS, StockChartInterval.PRE_MARKET, StockChartInterval.INTRA_DAY].includes(interval)) return
        const PRE_NUMBER = 330
        const POST_NUMBER = 390
        const AFTER_NUMBER = 240
        const count = PRE_NUMBER + POST_NUMBER + AFTER_NUMBER

        chart.current?.setLeftMinVisibleBarCount(1)
        chart.current?.setXAxisTick(count)

        chart.current?.createIndicator({
          name: 'split-indicator',
          id: splitId,
          calcParams: [[PRE_NUMBER / (PRE_NUMBER + POST_NUMBER + AFTER_NUMBER), (PRE_NUMBER + POST_NUMBER) / (PRE_NUMBER + POST_NUMBER + AFTER_NUMBER)]],
        }, true, {
          id: ChartTypes.MAIN_PANE_ID
        })

        // const type = getAxisType(chart.current!)

        chart.current?.setPaneOptions({
          id: ChartTypes.MAIN_PANE_ID,
          axis: {
            name: 'percentage',
            value: 'prevClose'
          },
          leftAxis: {
            position: 'none' as AxisPosition
          }
        })

        chart.current?.setStyles({
          candle: {
            type: 'area' as CandleType,
            area: {
              lineColor: data => {
                const postData = data.slice(0, POST_NUMBER + PRE_NUMBER).pop()
                const lastData = data[data.length]

                const lastColor = Decimal.create(lastData?.close).gt(lastData?.prevClose ?? 0) ? upColor : downColor
                const preColor = data.length > PRE_NUMBER ? '#50535E' : lastColor

                const afterColor = data.length >= POST_NUMBER + PRE_NUMBER + AFTER_NUMBER ? '#50535E' : lastColor

                return [
                  { type: 'segment', color: preColor, offset: PRE_NUMBER },
                  { type: 'segment', color: Decimal.create(postData?.close).gt(postData?.prevClose ?? 0) ? upColor : downColor, offset: POST_NUMBER + PRE_NUMBER },
                  { type: 'segment', color: afterColor },
                ]
              },
              backgroundColor(data) {
                const postData = data.slice(0, POST_NUMBER + PRE_NUMBER).pop()
                const lastData = data[data.length]
                const lastColor = Decimal.create(lastData?.close).gt(lastData?.prevClose ?? 0) ? upColor : downColor

                const color = Decimal.create(postData?.close).gt(postData?.prevClose ?? 0) ? upColor : downColor

                const preColor = data.length > PRE_NUMBER ? '#DBDBDB' : lastColor
                const afterColor = data.length >= POST_NUMBER + PRE_NUMBER + AFTER_NUMBER ? '#DBDBDB' : lastColor

                return [
                  {
                    type: 'segment', offset: PRE_NUMBER, color: [{
                      offset: 0,
                      color: colorUtil.rgbaToString(colorUtil.hexToRGBA(preColor, 0.01))
                    }, {
                      offset: 1,
                      color: colorUtil.rgbaToString(colorUtil.hexToRGBA(preColor, 0.2))
                    }]
                  },
                  {
                    type: 'segment', offset: POST_NUMBER + PRE_NUMBER, color: [{
                      offset: 0,
                      color: colorUtil.rgbaToString(colorUtil.hexToRGBA(color, 0.01))
                    }, {
                      offset: 1,
                      color: colorUtil.rgbaToString(colorUtil.hexToRGBA(color, 0.2))
                    }]
                  },
                  {
                    type: 'segment', color: [{
                      offset: 0,
                      color: colorUtil.rgbaToString(colorUtil.hexToRGBA(afterColor, 0.01))
                    }, {
                      offset: 1,
                      color: colorUtil.rgbaToString(colorUtil.hexToRGBA(afterColor, 0.2))
                    }]
                  },
                ]
              },
            },
          }
        })
      } else {
        chart.current?.removeIndicator({
          id: splitId
        })
        chart.current?.setXAxisTick(-1)
        chart.current?.setOffsetRightDistance(80)
        chart.current?.setStyles({
          candle: {
            area: {
              lineColor: DEFAULT_AREA_BG_COLOR.color,
              backgroundColor: DEFAULT_AREA_BG_COLOR.bg
            }
          }
        })
        chart.current?.setPaneOptions({
          id: ChartTypes.MAIN_PANE_ID,
          axis: {
            value: undefined
          }
        })

        const type = getAxisType(chart.current!)
        chart.current?.setPaneOptions({
          id: ChartTypes.MAIN_PANE_ID,
          axis: {
            value: type === 'double' ? 'close' : 'prevClose'
          }
        })
      }
    },
    createGapIndicator: (count) => {
      chart.current?.createIndicator(
        {
          name: 'gap-indicator',
          id: 'gap-indicator',
          calcParams: [count]
        },
        true,
        { id: ChartTypes.MAIN_PANE_ID }
      )
    },
    removeGapIndicator: () => {
      chart.current?.removeIndicator({ id: 'gap-indicator' })
    },
    setGapIndicator: (count) => {
      chart.current?.overrideIndicator({
        name: 'gap-indicator',
        id: 'gap-indicator',
        calcParams: [count]
      })
    }
  }))

  useEffect(() => {
    // 重置大小
    const sizeObserver = new ResizeObserver(debounce({ delay: 20 }, () => {
      chart.current?.resize()
    }))

    sizeObserver.observe(domRef.current!)

    return () => {
      sizeObserver.disconnect()
    }
  }, [])

  return <div className={cn('w-full h-full', props.className)} ref={domRef} />
})

