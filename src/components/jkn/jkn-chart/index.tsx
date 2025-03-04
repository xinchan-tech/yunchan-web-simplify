import { useMount, useUnmount } from "ahooks"
import { init, dispose, type LayoutChildType, type Chart, type CandleType, registerIndicator } from 'jkn-kline-chart'
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import type { AxisPosition, Candlestick } from "./types"
import { ChartTypes, getStockColor, transformCandleColor, transformTextColor } from "./utils"
import { cn } from "@/utils/style"
import { dateUtils } from "@/utils/date"
import { CoilingIndicatorId, mainTrendCoiling, penCoiling, pivotCoiling, shortLineCoiling, tradePointOneTypeCoiling, tradePointThreeTypeCoiling, tradePointTwoTypeCoiling } from "./coiling"
import { useIndicator } from "@/store"
import { localIndicator } from "./indicator"
import type { StockChartInterval } from "@/api"


registerIndicator(penCoiling)
registerIndicator(tradePointOneTypeCoiling)
registerIndicator(tradePointTwoTypeCoiling)
registerIndicator(tradePointThreeTypeCoiling)
registerIndicator(pivotCoiling)
registerIndicator(shortLineCoiling)
registerIndicator(mainTrendCoiling)
registerIndicator(localIndicator)

interface JknChartProps {
  className?: string
}

interface JknChartIns {
  applyNewData: Chart['applyNewData']
  setCoiling: (coiling: CoilingIndicatorId, data: CoilingData) => void
  setLeftAxis: (show: boolean) => void
  setRightAxis: (type: 'percentage' | 'normal') => void
  setChartType: (type: 'area' | 'candle') => void
  removeCoiling: (coiling: CoilingIndicatorId[]) => void
  removeAllCoiling: () => void
  createLocalIndicator: (indicator: string, symbol: string, interval: StockChartInterval) => void
  removeLocalIndicator: (indicator: string) => void
}

export const JknChart = forwardRef<JknChartIns, JknChartProps>((props: JknChartProps, ref) => {
  const domRef = useRef<HTMLDivElement>(null)
  const chart = useRef<Chart | null>()
  const { up: upColor, down: downColor } = getStockColor()
  useMount(() => {
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
            showType: 'rect',
            custom: ({ current }: { current: Candlestick }) => {
              let format = 'MM-DD HH:mm w'

              const time = dateUtils.toUsDay(current.timestamp)
              if (time.format('HH:mm') === '00:00') {
                format = 'YYYY-MM-DD w'
              }
              const amount = current.close - current.prevClose
              const percent = amount / current.prevClose * 100
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
          },
        },
        xAxis: {
          axisLine: {
            color: '#202123'
          },
          tickLine: {
            color: '#202123'
          }
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
              position: 'right' as AxisPosition,

            }
          }
        }
      ],
      timezone: 'America/New_York',
    })
  })

  useUnmount(() => {
    domRef.current && dispose(domRef.current)
    chart.current = null
  })


  useImperativeHandle(ref, () => ({
    applyNewData: (data) => {
      chart.current?.applyNewData(data)
    },
    setLeftAxis: (show) => {
      chart.current?.setPaneOptions({
        leftAxis: {
          position: (show ? 'left' : 'none') as AxisPosition
        }
      })
    },
    setRightAxis: (type) => {
      chart.current?.setPaneOptions({
        axis: {
          name: type
        }
      })
    },
    setChartType: (type) => {
      chart.current?.setStyles({
        candle: {
          type: (type === 'area' ? 'area' : undefined) as CandleType
        }
      })
    },
    setCoiling: (coiling, data) => {
      const hasIndicator = chart.current?.getIndicators({ id: `coiling-${coiling}` })
      let indicator: { name: string, id: string, calcParams?: any[] } | undefined = undefined

      if (CoilingIndicatorId.PEN === coiling) {
        indicator = {
          name: `coiling-${CoilingIndicatorId.PEN}`,
          id: `coiling-${CoilingIndicatorId.PEN}`,
          calcParams: [data.points, data.status]
        }
      } else if ([CoilingIndicatorId.ONE_TYPE, CoilingIndicatorId.TWO_TYPE, CoilingIndicatorId.THREE_TYPE].includes(coiling)) {
        indicator = {
          name: `coiling-${coiling}`,
          id: `coiling-${coiling}`,
          calcParams: coiling === CoilingIndicatorId.THREE_TYPE ? [data.class_3_trade_points] : coiling === CoilingIndicatorId.TWO_TYPE ? [data.class_2_trade_points] : [data.class_1_trade_points]
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
        chart.current?.createIndicator(indicator, true,
          { id: ChartTypes.MAIN_PANE_ID })
      }
    },
    removeCoiling: (coiling) => {
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
    createLocalIndicator: (indicator, symbol, interval) => {
      const formula = useIndicator.getState().formula

      if (!formula[indicator]) return

      chart.current?.createIndicator({
        name: 'local-indicator',
        id: indicator,
        calcParams: [indicator, symbol, interval]
      }, true, { id: ChartTypes.MAIN_PANE_ID })
    },
    removeLocalIndicator: (indicator) => {
      chart.current?.removeIndicator({ id: indicator })
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

  return (
    <div className={cn('w-full h-full', props.className)} ref={domRef} />
  )
})