import type { StockRawRecord } from '@/api'
import {
  type Coordinate,
  type LineStyle,
  LineType,
  type OverlayTemplate,
  type RectStyle,
  type TextStyle
} from '@/plugins/jkn-kline-chart'
import { useConfig } from '@/store'
import type { StockTrading } from '@/utils/stock'
import dayjs from 'dayjs'
import type { Candlestick, DrawOverlayParams } from './types'

export enum ChartTypes {
  MAIN_PANE_ID = 'candle_pane',
  MAIN_X_AXIS_ID = 'candle_xAxis'
}

export const transformTextColor = (text: string, compareData: Candlestick, field: 'open' | 'prevClose') => {
  const getColor = useConfig.getState().getStockColor
  if (text.endsWith('%')) {
    if (Number.parseFloat(text) > 0) {
      return getColor(true, 'hex')
    }
    return getColor(false, 'hex')
  }

  if (!compareData) {
    return 'transparent'
  }
  return Number.parseFloat(text) > compareData[field] ? getColor(true, 'hex') : getColor(false, 'hex')
}

export const transformCandleColor = (candle: Candlestick) => {
  // if(candle.close - candle.open <= 0) return
  const percent = (candle.close - candle.prevClose) / candle.prevClose

  if (Math.abs(percent) < 0.09) {
    return undefined
  }

  return percent > 0 ? '#ffffff' : '#9123a7'
}

export const getStockColor = () => {
  const getColor = useConfig.getState().getStockColor

  return {
    up: getColor(true, 'hex'),
    down: getColor(false, 'hex')
  }
}

export const candlestickToRaw = (candle: Candlestick): StockRawRecord => {
  return [
    candle.timestamp as unknown as string,
    candle.open,
    candle.close,
    candle.high,
    candle.low,
    candle.volume ?? 0,
    candle.turnover ?? 0,
    candle.prevClose
  ]
}

/**
 * 必须是有序数组, 使用二分查找
 */
export const findEqualTime = (data: Candlestick[], time: number) => {
  if (data.length === 0) return
  if (data.length === 1) return data[0].timestamp === time ? data[0] : undefined

  let left = 0
  let right = data.length - 1

  while (left < right) {
    const mid = Math.floor((left + right) / 2)

    if (data[mid].timestamp === time) {
      return data[mid]
    }

    if (data[mid].timestamp < time) {
      left = mid + 1
    } else {
      right = mid
    }
  }

  return undefined
}

/**
 * 新数据是否是相同时间段
 * @param src
 * @param target
 * @param interval 分钟数
 *
 * @returns 返回undefined表示是错误数据, 返回true表示是相同时间段, 返回false表示不是相同时间段
 */
export const isSameInterval = (src: { timestamp: number }, target: { timestamp: number }, interval: number) => {
  const maxTime = src.timestamp + interval * 60 * 1000

  if (target.timestamp < src.timestamp) {
    return undefined
  }

  return target.timestamp < maxTime
}

/**
 * 根据时间段获取tick数量
 */
export const getTickNumberByTrading = (trading: StockTrading) => {
  let start = dayjs('2022-01-01 09:30:00')
  let end = dayjs('2022-01-01 15:00:00')

  switch (trading) {
    case 'preMarket':
      start = start.hour(4).minute(0)
      end = end.hour(9).minute(30)
      break
    case 'afterHours':
    case 'close':
      start = start.hour(16).minute(0)
      end = end.hour(20).minute(0)
      break
    default:
      break
  }

  return end.diff(start, 'minute')
}

export function getLinearYFromSlopeIntercept(kb: Nullable<number[]>, coordinate: Coordinate): number {
  if (kb !== null) {
    return coordinate.x * kb![0] + kb![1]
  }
  return coordinate.y
}

/**
 * 获取点在两点决定的一次函数上的y值
 * @param coordinate1
 * @param coordinate2
 * @param targetCoordinate
 */
export function getLinearYFromCoordinates(
  coordinate1: Coordinate,
  coordinate2: Coordinate,
  targetCoordinate: Coordinate
): number {
  const kb = getLinearSlopeIntercept(coordinate1, coordinate2)
  return getLinearYFromSlopeIntercept(kb, targetCoordinate)
}

export function getLinearSlopeIntercept(coordinate1: Coordinate, coordinate2: Coordinate): Nullable<number[]> {
  const difX = coordinate1.x - coordinate2.x
  if (difX !== 0) {
    const k = (coordinate1.y - coordinate2.y) / difX
    const b = coordinate1.y - k * coordinate1.x
    return [k, b]
  }
  return null
}

export const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | [number, number, number, number]
) => {
  let leftTop = 0
  let rightTop = 0
  let rightBottom = 0
  let leftBottom = 0
  if (Array.isArray(radius)) {
    ;[leftTop, rightTop, rightBottom, leftBottom] = radius
  } else {
    leftTop = rightTop = rightBottom = leftBottom = radius
  }
  ctx.beginPath()
  ctx.moveTo(x + leftTop, y)
  ctx.arcTo(x + width, y, x + width, y + rightTop, rightTop)
  ctx.lineTo(x + width, y + height - rightBottom)
  ctx.arcTo(x + width, y + height, x + width - rightBottom, y + height, rightBottom)
  ctx.lineTo(x + leftBottom, y + height)
  ctx.arcTo(x, y + height, x, y + height - leftBottom, leftBottom)
  ctx.lineTo(x, y + leftTop)
  ctx.arcTo(x, y, x + leftTop, y, leftTop)
  ctx.closePath()
  ctx.fill()
}

export const drawOverlayParamsToFigureStyle = (type: string, params: DrawOverlayParams): any => {
  const lineType = params.lineType as 'solid' | 'dashed' | 'dotted'
  switch (type) {
    case 'line':
      return {
        color: params.color,
        size: params.lineWidth,
        style: lineType === 'dashed' ? LineType.Dashed : lineType === 'dotted' ? LineType.Dashed : LineType.Solid,
        dashedValue: lineType === 'dashed' ? [4, 4] : lineType === 'dotted' ? [2, 2] : undefined
      } as LineStyle
    case 'text':
      return {
        color: params.color
      } as TextStyle
    case 'rect':
      return {
        color: params.color,
        borderColor: params.color,
        borderSize: params.lineWidth
      } as RectStyle
    default:
      return {} as any
  }
}

export const createOverlayTemplate = <T extends DrawOverlayParams = DrawOverlayParams>(
  template: OverlayTemplate<T>
) => {
  return {
    needDefaultPointFigure: true,
    needDefaultXAxisFigure: false,
    needDefaultYAxisFigure: false,
    onRightClick: e => {
      e.preventDefault?.()
      return true
    },
    onPressedMoveEnd: e => {
      e.overlay.onDrawEnd?.(e)
      return true
    },
    ...template
  } as OverlayTemplate<T>
}
