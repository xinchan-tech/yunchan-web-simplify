import { colorUtil } from '@/utils/style'
import { Candlestick } from './types'
import { candlestickToRaw } from './utils'

const SEGMENT_NUM_LIMIT = 7
/**
 * 获取中枢数据
 * @param coiling 缠论数据
 * @param points 笔端点
 * @description 中枢数据格式, 具体算法查看examples/coiling.js/readPivots
 */
export const calcCoilingPivots = (pivots: CoilingData['pivots'] | undefined) => {
  if (!pivots) return []

  return pivots.map(p => {
    const mark = String.fromCharCode(p.mark)

    let bgColor = ''
    let color = ''
    // 中枢背景颜色
    if (p.direction === 1) {
      if (p.segmentNum <= SEGMENT_NUM_LIMIT) {
        bgColor = colorUtil.rgbaToString(colorUtil.argbToRGBA('B2007C37'))
        color = colorUtil.rgbaToString(colorUtil.argbToRGBA('FF007C37'))
      } else {
        bgColor = colorUtil.rgbaToString(colorUtil.argbToRGBA('CB315FFF'))
        color = colorUtil.rgbaToString(colorUtil.argbToRGBA('FF315FFF'))
      }
    } else {
      if (p.segmentNum <= SEGMENT_NUM_LIMIT) {
        bgColor = colorUtil.rgbaToString(colorUtil.argbToRGBA('9DF50D0D'))
        color = colorUtil.rgbaToString(colorUtil.argbToRGBA('FFF50D0D'))
      } else {
        bgColor = colorUtil.rgbaToString(colorUtil.argbToRGBA('BCFF1DFC'))
        color = colorUtil.rgbaToString(colorUtil.argbToRGBA('FFFF1DFC'))
      }
    }

    return {
      ...p,
      start: [p.start, p.bottom],
      end: [p.end, p.top],
      mark,
      bgColor,
      color
    }
  })
}

const PIVOTS_EXPAND_LIMIT = 2
/**
 * 计算中枢扩展数据
 * @param coiling 缠论数据
 * @param points 笔端点
 * @returns
 */
export const calcCoilingPivotsExpands = (expands: CoilingData['expands'] | undefined) => {
  if (!expands) return []

  const labels = ['A0', 'A1', 'A²', 'A³', 'A⁴', 'A⁵', 'A⁶', 'A⁷', 'A⁸']

  return expands
    .filter(p => p.level <= 2)
    .map(p => {
      const mark = p.level > 2 ? '' : labels[p.level]
      const segmentNum = p.end - p.start

      let bgColor = 'transparent'
      let color = 'transparent'
      // 中枢背景颜色
      if (p.direction === 1) {
        if (segmentNum === PIVOTS_EXPAND_LIMIT) {
          bgColor = colorUtil.rgbaToString(colorUtil.argbToRGBA('BCFF1DFC'))
          color = colorUtil.rgbaToString(colorUtil.argbToRGBA('FFFF1DFC'))
        } else if (segmentNum > PIVOTS_EXPAND_LIMIT) {
          bgColor = colorUtil.rgbaToString(colorUtil.argbToRGBA('CB315FFF'))
          color = colorUtil.rgbaToString(colorUtil.argbToRGBA('FF315FFF'))
        }
      } else {
        if (segmentNum === PIVOTS_EXPAND_LIMIT) {
          bgColor = colorUtil.rgbaToString(colorUtil.argbToRGBA('CB315FFF'))
          color = colorUtil.rgbaToString(colorUtil.argbToRGBA('FF315FFF'))
        } else if (segmentNum > PIVOTS_EXPAND_LIMIT) {
          bgColor = colorUtil.rgbaToString(colorUtil.argbToRGBA('BCFF1DFC'))
          color = colorUtil.rgbaToString(colorUtil.argbToRGBA('FFFF1DFC'))
        }
      }

      return {
        ...p,
        start: [p.start, p.bottom],
        end: [p.end, p.top],
        mark,
        bgColor,
        color
      }
    })
}

/**
 * 计算买卖点位数据
 * @param coiling 缠论数据
 * @param points 笔端点
 * @param type 买卖类型： 1、2、3
 * @returns
 */
export const calcTradePoints = (coiling: CoilingData['class_1_trade_points']) => {
  if (!coiling) return []

  return coiling.map(v => {
    let color = ''

    if (v.buy) {
      color = v.large
        ? colorUtil.rgbaToString(colorUtil.argbToRGBA('FF185EFF'))
        : colorUtil.rgbaToString(colorUtil.argbToRGBA('FF00B050'))
    } else {
      color = v.large
        ? colorUtil.rgbaToString(colorUtil.argbToRGBA('FFF323C5'))
        : colorUtil.rgbaToString(colorUtil.argbToRGBA('FFFE1818'))
    }

    return {
      ...v,
      color
    }
  })
}

/**
 * 计算均线
 * 短线王DXW: MA20 rgb(186, 64, 127); MA30 rgb(156, 171, 232)
 * 波段王BDW: MA30 rgb(186, 64, 127); MA60 rgb(156, 171, 232)
 * 主力三区ZLSQ: MA120 rgb(0, 158, 202); MA250 rgb(203,158,129)
 * 主力趋势ZLQS: MA55 rgb(250,28,19); MA60 rgb(255,255,255); MA65 rgb(51,251,41); MA120 rgb(51,251,41) 线宽4; MA250 rgb(249,42,251) 线宽6
 * @param dayCount
 * @param data
 * @returns
 */
export const calculateMA = (dayCount: number, candlesticks: Candlestick[]) => {
  const result = []
  const data = candlesticks.map(candlestickToRaw)
  for (let i = 0, len = data.length; i < len; i++) {
    if (i < dayCount) {
      result.push(null)
      continue
    }
    let sum = 0
    for (let j = 0; j < dayCount; j++) {
      sum += data[i - j][2] ?? 0
    }
    result.push(+(sum / dayCount).toFixed(3))
  }
  return result
}

/**
 * 批量计算均线
 */
export const calculateMABatch = (dayCounts: number[], candlesticks: Candlestick[]) => {
  const result: Record<string, Array<number | null>> = {}
  console.log('start')
  for (let i = 0; i < candlesticks.length; i++) {
    dayCounts.forEach(dayCount => {
      if (i < dayCount) {
        if (!result[dayCount]) {
          result[dayCount] = []
        }
        result[dayCount].push(null)
        return
      }
    })
    let sum = 0
    dayCounts.forEach(dayCount => {
      for (let j = 0; j < dayCount; j++) {
        sum += candlesticks[i - j]?.close ?? 0
      }
      if (!result[dayCount]) {
        result[dayCount] = []
      }
      result[dayCount].push(+(sum / dayCount).toFixed(3))
    })
  }
  console.log(result)
  return result
}
