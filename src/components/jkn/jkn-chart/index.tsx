import { useMount, useUnmount } from "ahooks"
import { init, dispose, LayoutChildType, type Chart, CandleType } from 'jkn-kline-chart'
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react"
import type { AxisPosition, Candlestick } from "./types"
import { getStockColor, transformCandleColor, transformTextColor } from "./utils"
import { cn } from "@/utils/style"
import { dateUtils } from "@/utils/date"

interface JknChartProps {
  className?: string
}

interface JknChartIns {
  applyNewData: Chart['applyNewData']
  setLeftAxis: (show: boolean) => void
  setRightAxis: (type: 'percentage' | 'normal') => void
  setChartType: (type: 'area' | 'candle') => void
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
    // chart.current?.setStyles('dark')
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