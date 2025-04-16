import type { StockRawRecord } from '@/api'
import type { IndicatorData } from '@/utils/coiling'
import type { IndicatorDataType } from '@/utils/coiling/transform'
import { colorUtil } from '@/utils/style'
import type { Candlestick } from './types'
import { candlestickToRaw } from './utils'

export enum CoilingIndicatorId {
  PEN = '1',
  ONE_TYPE = '227',
  TWO_TYPE = '228',
  THREE_TYPE = '229',
  /**
   * 中枢
   */
  PIVOT = '2',
  PIVOT_PRICE = '230',
  PIVOT_NUM = '231',
  /**
   * 反转点
   */
  REVERSAL = '232',
  /**
   * 重叠
   */
  OVERLAP = '233',
  /**
   * 短线
   */
  SHORT_LINE = '234',
  /**
   * 主力
   */
  MAIN = '235'
}

export type CoilingCalcResult = CoilingData & {
  pivotsResult: ReturnType<typeof calcCoilingPivots>
  expandsResult: ReturnType<typeof calcCoilingPivotsExpands>
  tradePointsResult: [
    ReturnType<typeof calcTradePoints>,
    ReturnType<typeof calcTradePoints>,
    ReturnType<typeof calcTradePoints>
  ]
  maResult: Record<string, ReturnType<typeof calculateMA>>
}

const SEGMENT_NUM_LIMIT = 7
/**
 * 获取中枢数据
 * @param coiling 缠论数据
 * @param points 笔端点
 * @description 中枢数据格式, 具体算法查看examples/coiling.js/readPivots
 * rgba(8, 153, 129, 0.6) 绿
 * rgba(41, 98, 255, 0.6) 蓝
 * rgba(242, 54, 69, 0.6) 红
 * rgba(156, 39, 176, 0.6) 紫
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
        bgColor = 'rgba(8, 153, 129, 0.6)'
        color = 'rgba(8, 153, 129, 1)'
      } else {
        bgColor = 'rgba(41, 98, 255, 0.6)'
        color = 'rgba(41, 98, 255, 1)'
      }
    } else {
      if (p.segmentNum <= SEGMENT_NUM_LIMIT) {
        bgColor = 'rgba(242, 54, 69, 0.6)'
        color = 'rgba(242, 54, 69, 1)'
      } else {
        bgColor = 'rgba(156, 39, 176, 0.6)'
        color = 'rgba(156, 39, 176, 1)'
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
          bgColor = 'rgba(156, 39, 176, 0.6)'
          color = 'rgba(156, 39, 176, 1)'
        } else if (segmentNum > PIVOTS_EXPAND_LIMIT) {
          bgColor = 'rgba(41, 98, 255, 0.6)'
          color = 'rgba(41, 98, 255, 1)'
        }
      } else {
        if (segmentNum === PIVOTS_EXPAND_LIMIT) {
          bgColor = 'rgba(41, 98, 255, 0.6)'
          color = 'rgba(41, 98, 255, 1)'
        } else if (segmentNum > PIVOTS_EXPAND_LIMIT) {
          bgColor = 'rgba(156, 39, 176, 0.6)'
          color = 'rgba(156, 39, 176, 1)'
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
      color = v.large ? '#22AB94' : 'rgba(41, 98, 255, 1)'
    } else {
      color = v.large ? 'rgba(242, 54, 69, 1)' : '#D500F9'
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

  return result
}

/**
 * 计算底部信号
 */
export const calcBottomSignal = (candlesticks: StockRawRecord[]): IndicatorData[] => {
  // const fillColor = createLinearGradient(1, 0, 0, 0, [
  //   {
  //     offset: 0,
  //     color: 'rgb(255, 0, 102)'
  //   },
  //   {
  //     offset: 0.5,
  //     color: 'rgb(255, 150, 186)'
  //   },
  //   {
  //     offset: 1,
  //     color: 'rgb(255, 0, 102)'
  //   }
  // ])

  const hdlyLabel: IndicatorDataType<'HDLY_LABEL'>['drawData'] = []
  const hdlyData: IndicatorDataType<'STICKLINE'>['drawData'] = []

  let maxPos = -1
  let maxVol = 0
  hdly(candlesticks).forEach((vol: number, index, arr) => {
    if (vol > 0 && arr.length - 1 !== index) {
      // hdlyData.push([index, 0, vol, 2, 0, ''])
      hdlyData.push({
        x: index,
        y1: 0,
        y2: vol,
        width: 1,
        empty: 0
      })

      if (vol >= maxVol) {
        maxVol = vol
        maxPos = index
      }
    } else {
      if (maxPos !== -1) {
        let str = '历史大底'
        if (maxVol < 30) {
          str = '小底'
        } else if (maxVol < 60) {
          str = '中底'
        } else if (maxVol < 90) {
          str = '大底'
        } else if (maxVol < 150) {
          str = '超大底'
        }
        hdlyLabel.push({ x: maxPos, y: maxVol + 8, text: str, color: 'rgb(255, 0, 102)' })
        maxPos = -1
        maxVol = 0
      }
    }
  })

  const monthLineData = monthLine(candlesticks)
  const horizonData = horizon(candlesticks)
  const topLine = candlesticks.map(_ => 100)

  return [
    {
      draw: 'STICKLINE',
      width: 1,
      color: ['rgb(255, 0, 102)', 'rgb(255, 150, 186)', 'rgb(255, 0, 102)'],
      lineType: '',
      name: '',
      drawData: hdlyData
    },
    {
      draw: '',
      width: 1,
      color: '#ff0066',
      name: '月亮线',
      lineType: 'SOLID',
      drawData: monthLineData
    },
    {
      draw: '',
      width: 1,
      color: '#fff',
      lineType: '',
      name: '水平线',
      drawData: horizonData
    },
    {
      draw: 'HORIZONTALLINE',
      width: 1,
      color: '#fff',
      lineType: '',
      name: '',
      drawData: topLine
    },
    {
      draw: 'HDLY_LABEL',
      color: '#fff',
      lineType: '',
      width: 1,
      name: '',
      drawData: hdlyLabel
    }
  ]
}

/**
 * 底部信号月亮线
 * @param candlesticks 蜡烛图数据
 * @returns
 */
const monthLine = (candlesticks: StockRawRecord[]) => {
  if (candlesticks.length < 1) return []

  let i: number
  let k: number
  const n = 13
  const m = 8
  const days = 21
  let lowest = candlesticks[0][4] as any
  let lowest_index = 0 //LLV(L,21)：21日内最低价的最低值
  let highest = candlesticks[0][3] as any
  let highest_index = 0 //HHV(H,21)：21日内最高价的最高值
  let close = candlesticks[0][2] as any //收盘价
  let VAR8 =
    Math.abs(highest - lowest) < 0.01 ? ((close - lowest) / 0.005) * 100 : ((close - lowest) / (highest - lowest)) * 100
  let VAR9 = VAR8
  const month_line = new Array(candlesticks.length).fill(0.0)
  month_line[0] = VAR9

  for (i = 1; i < candlesticks.length; ++i) {
    if ((candlesticks[i][4] as any) < lowest) {
      lowest = candlesticks[i][4] as any //LLV(L,21)：21日内最低价的最低值
      lowest_index = i
    } else if (i - lowest_index + 1 > days) {
      // 重新计算LLV(L,21)
      lowest = candlesticks[i][4] as any
      lowest_index = i
      for (k = 1; k < days; k++) {
        if ((candlesticks[i - k][4] as any) < lowest) {
          lowest = candlesticks[i - k][4] as any
          lowest_index = i - k
        }
      }
    }

    if ((candlesticks[i][3] as any) > highest) {
      highest = candlesticks[i][3] as any //HHV(H,21)：21日内最高价的最高值
      highest_index = i
    } else if (i - highest_index + 1 > days) {
      // 重新计算HHV(H,21)
      highest = candlesticks[i][3] as any
      highest_index = i
      for (k = 1; k < days; k++) {
        if ((candlesticks[i - k][3] as any) > highest) {
          highest = candlesticks[i - k][3] as any
          highest_index = i - k
        }
      }
    }

    close = candlesticks[i][2] //收盘价

    VAR8 =
      Math.abs(highest - lowest) < 0.01
        ? ((close - lowest) / 0.05) * 100
        : ((close - lowest) / (highest - lowest)) * 100
    VAR9 = (VAR8 * m + VAR9 * (n - m)) / n
    month_line[i] = VAR9
  }
  for (i = month_line.length - 1; i >= 0; --i) {
    month_line[i] = Math.round(month_line[i] * 100) / 100
  }

  return month_line
}

/**
 * 底部信号水平线
 */
const horizon = (candlesticks: StockRawRecord[]) => {
  if (candlesticks.length < 1) return []

  let i: number
  let k: number
  const n = 5
  const m = 1
  const days = 27
  let lowest = candlesticks[0][4]!
  let lowest_index = 0 //LLV(L,27)：27日内最低价的最低值
  let highest = candlesticks[0][3]!
  let highest_index = 0 //HHV(H,27)：27日内最高价的最高值
  let close = candlesticks[0][2]! //收盘价

  /* 初始化：(收盘价-27日内最低价的最低值)/(27日内最高价的最高值-27日内最低价的最低值)*100 */
  let var1 =
    Math.abs(highest - lowest) < 0.01 ? ((close - lowest) / 0.05) * 100 : ((close - lowest) / (highest - lowest)) * 100

  /* 初始化：$var1的5日[1日权重]移动平均 */
  let SMA_1 = var1

  /* 初始化：$SMA_1的3日[1日权重]移动平均 */
  let SMA_2 = SMA_1

  /* 初始化：$var2 的5日简单移动平均 */
  let var2 = SMA_1 * 3 - SMA_2 * 2
  const MA = var2

  /* 保存 计算简单移动平均 */
  const length = candlesticks.length
  const var2_arr = new Array(length).fill(0.0)
  var2_arr[0] = var2

  /* 地平线 */
  const horizon = new Array(length).fill(0.0)
  horizon[0] = MA

  for (i = 1; i < length; ++i) {
    if ((candlesticks[i][4] as any) < lowest) {
      lowest = candlesticks[i][4] as any //LLV(L,27)：27日内最低价的最低值
      lowest_index = i
    } else if (i - lowest_index + 1 > days) {
      // 重新计算LLV(L,27)
      lowest = candlesticks[i][4] as any
      lowest_index = i
      for (k = 1; k < days; k++) {
        if ((candlesticks[i - k][4] as any) < lowest) {
          lowest = candlesticks[i - k][4] as any
          lowest_index = i - k
        }
      }
    }

    if ((candlesticks[i][3] as any) > highest) {
      highest = candlesticks[i][3] as any //HHV(H,27)：27日内最高价的最高值
      highest_index = i
    } else if (i - highest_index + 1 > days) {
      // 重新计算HHV(H,27)
      highest = candlesticks[i][3] as any
      highest_index = i
      for (k = 1; k < days; k++) {
        if ((candlesticks[i - k][3] as any) > highest) {
          highest = candlesticks[i - k][3] as any
          highest_index = i - k
        }
      }
    }

    close = candlesticks[i][2]! //收盘价
    /* (收盘价-27日内最低价的最低值)/(27日内最高价的最高值-27日内最低价的最低值)*100 */
    var1 =
      Math.abs(highest - lowest) < 0.01
        ? ((close - lowest) / 0.05) * 100
        : ((close - lowest) / (highest - lowest)) * 100

    /* $var1的5日[1日权重]移动平均 */
    SMA_1 = (var1 * m + SMA_1 * (n - m)) / n

    /* $SMA_1的3日[1日权重]移动平均 */
    SMA_2 = (SMA_1 * 1 + SMA_2 * (3 - 1)) / 3

    /* $var2 的5日简单移动平均 */
    var2 = SMA_1 * 3 - SMA_2 * 2
    var2_arr[i] = var2

    const min_index = i + 1 < 5 ? i + 1 : 5
    let MA = var2_arr[length - 1]
    for (k = 1; k < min_index; k++) {
      MA += var2_arr[i - k]
    }
    MA = MA / min_index

    horizon[i] = MA
  }

  for (i = horizon.length - 1; i >= 0; --i) {
    horizon[i] = Math.round(horizon[i] * 100) / 100
  }

  return horizon
}

/**
 * 底部信号海底捞月线
 * @param candlesticks 蜡烛图数据
 * @returns
 */
const hdly = (candlesticks: StockRawRecord[]) => {
  if (candlesticks.length < 2) return []

  const n = 3
  const m = 1
  let i: number
  let k: number
  let PRE_LOW: number
  let LOW: number
  let SMA_1 = 0
  let SMA_2 = 0
  let VAR2 = 0
  let EMA_1 = 0
  let VAR3 = EMA_1
  let VAR5 = VAR3
  let VAR7: number
  let EMA_2 = VAR3 / 2 + VAR5
  const length = candlesticks.length
  const VAR3_arr = new Array(length).fill(0.0)
  const VAR7_arr = new Array(length).fill(0.0)
  VAR3_arr[0] = VAR3
  VAR7_arr[0] = EMA_2 / 618

  for (i = 1; i < length; ++i) {
    /* 昨日最低 */
    PRE_LOW = candlesticks[i - 1][4]!
    LOW = candlesticks[i][4] as any
    /* 最低价减去昨日低价的绝对值的3日S移动平均 */
    SMA_1 = (Math.abs(LOW - PRE_LOW) * m) / n + (SMA_1 * (n - m)) / n
    /* 最低价减去昨日最低的差值和0的较大值的3日S移动平均 */
    SMA_2 = (Math.max(LOW - PRE_LOW, 0.0) * m) / n + (SMA_2 * (n - m)) / n
    VAR2 = SMA_2 === 0 ? VAR2 : (SMA_1 / SMA_2) * 100

    /* VAR2 * 10 的3日EMA均线 */
    EMA_1 = (VAR2 * 10 * 2) / (n + 1) + (EMA_1 * (n - 1)) / (n + 1)
    VAR3 = EMA_1
    VAR3_arr[i] = VAR3

    /* 38个周期内最大的VAR3数值 */
    VAR5 = 0
    for (k = 0; k < 38; k++) {
      if (k > i) break
      VAR5 = VAR3_arr[i - k] > VAR5 ? VAR3_arr[i - k] : VAR5
    }

    let flag = 1

    /* 最低价格是否小于等于38个周期内的最低价 */
    for (k = 1; k < 39; k++) {
      if (k > i) break
      if ((candlesticks[i - k][4] as any) <= LOW) {
        flag = 0
        break
      }
    }

    /* (VAR3 + VAR5 * 2) / 2 的3日EMA均线 */
    if (flag) {
      EMA_2 = ((VAR3 / 2 + VAR5) * 2) / (n + 1) + (EMA_2 * (n - 1)) / (n + 1)
    } else {
      EMA_2 = (EMA_2 * (n - 1)) / (n + 1)
    }
    VAR7 = EMA_2 / 618
    VAR7_arr[i] = VAR7
  }

  for (let i = 0; i < VAR7_arr.length; ++i) {
    VAR7_arr[i] = Math.round(VAR7_arr[i])
  }

  return VAR7_arr
}

/**
 * 计算买卖点
 * 附图买卖点位
 * X0画柱体, 值大于0，柱体颜色为magenta，值小于0，柱体颜色为cyan
 * S1和S2画线条，S1颜色为magenta，S2颜色为white
 */
export const calculateTradingPoint = (candlesticks: StockRawRecord[]): IndicatorData[] => {
  const X0_arr: number[] = []
  const S1_arr: number[] = []
  const S2_arr: number[] = []
  const Z_arr: number[] = []

  const res: IndicatorData[] = [
    {
      name: '',
      draw: 'STICKLINE',
      width: 1,
      color: 'magenta',
      lineType: 'SOLID',
      drawData: []
    },
    {
      name: '',
      draw: 'STICKLINE',
      width: 1,
      color: 'cyan',
      lineType: 'SOLID',
      drawData: []
    },
    {
      name: '',
      draw: 'STICKLINE',
      width: 1,
      color: 'magenta',
      lineType: 'SOLID',
      drawData: []
    },
    {
      name: '',
      draw: 'STICKLINE',
      width: 1,
      color: 'cyan',
      lineType: 'SOLID',
      drawData: []
    },
    {
      name: 'S1',
      draw: '',
      width: 1,
      color: 'magenta',
      lineType: 'SOLID',
      drawData: []
    },
    {
      name: 'S2',
      draw: '',
      width: 1,
      color: '#ffffff',
      lineType: 'SOLID',
      drawData: []
    }
  ]

  const length = candlesticks.length
  if (length < 1) return res
  let WY1001 = (2 * (candlesticks[0][1] as any) + (candlesticks[0][2] as any) + (candlesticks[0][4] as any)) / 4 // (2 * 开盘价 + 收盘价 + 最低价) / 4
  let WY1002 = WY1001
  let WY1003 = WY1002
  let WY1004 = WY1003
  let X0 = 0
  let S1 = 0
  let S2 = 0
  X0_arr.push(0)
  S1_arr.push(0)
  S2_arr.push(0)
  Z_arr.push(0)

  const n = 4
  for (let i = 1; i < length; ++i) {
    WY1001 = (2 * (candlesticks[i][1] as any) + (candlesticks[i][2] as any) + (candlesticks[i][4] as any)) / 4 // (2 * 开盘价 + 收盘价 + 最低价) / 4
    WY1002 = (2 * WY1001 + (n - 1) * WY1002) / (n + 1)
    WY1003 = (2 * WY1002 + (n - 1) * WY1003) / (n + 1)
    const WY1004_REF = WY1004
    WY1004 = (2 * WY1003 + (n - 1) * WY1004) / (n + 1)

    const X0_REF = X0
    if (WY1004_REF < 0.001) {
      X0 = 0
    } else {
      X0 = ((WY1004 - WY1004_REF) / WY1004_REF) * 100
    }
    X0_arr.push(X0)
    S1 = (X0_REF + X0) / 2
    S2 = X0
    S1_arr.push(S1)
    S2_arr.push(S2)
    Z_arr.push(0)
  }

  res[0].drawData = X0_arr.map((x, i) => ({
    x: i,
    y1: 0,
    y2: x,
    width: 1,
    empty: 0
  })).filter(x => x.y2 > 0)

  res[1].drawData = X0_arr.map((x, i) => ({
    x: i,
    y1: 0,
    y2: x,
    width: 1,
    empty: 0
  })).filter(o => o.y2 <= 0)

  res[2].drawData = Z_arr.map((x, i) => ({
    x: i,
    y1: 0,
    y2: x,
    width: 1,
    empty: 0
  })).filter(x => x.y2 > 0)

  res[3].drawData = Z_arr.map((x, i) => ({
    x: i,
    y1: 0,
    y2: x,
    width: 1,
    empty: 0
  })).filter(x => x.y2 <= 0)

  res[4].drawData = S1_arr
  res[5].drawData = S2_arr

  return res
}
