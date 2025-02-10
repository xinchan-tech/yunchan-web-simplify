import type { getStockChart, getStockIndicatorData } from '@/api'
import { CoilingIndicatorId } from './ctx'
import { colorUtil } from '@/utils/style'
import Decimal from 'decimal.js'
import echarts from '@/utils/echarts'

/**
 * 缠论计算方法
 * 具体内容查看examples/coiling.js
 */

type StockData = Awaited<ReturnType<typeof getStockChart>>

/**
 * 笔端点
 */
type CoilingPoint = {
  /**
   * x轴索引
   */
  xIndex: number
  /**
   * 最高价或者最低价
   */
  y: number
}

/**
 * 计算笔端点数据
 * @param history
 * @param coiling
 * @returns
 */
export const calcCoilingPoints = (
  history: StockData['history'],
  coiling: StockData['coiling_data']
): CoilingPoint[] => {
  if (!coiling) return []
  let isTop = coiling.istop

  return coiling.points.map(v => {
    const p = {
      xIndex: v,
      y: (isTop ? history[v][3] : history[v][4]) as number
    }

    isTop = !isTop

    return p
  })
}

/**
 * 计算买卖点位数据
 * @param coiling 缠论数据
 * @param points 笔端点
 * @param type 买卖类型： 1、2、3
 * @returns
 */
export const calcTradePoints = (
  coiling: CoilingData | undefined,
  type: CoilingIndicatorId.ONE_TYPE | CoilingIndicatorId.TWO_TYPE | CoilingIndicatorId.THREE_TYPE
) => {
  if (!coiling) return []

  let data: CoilingData['class_1_trade_points'] | undefined = undefined

  if (type === CoilingIndicatorId.ONE_TYPE) {
    data = coiling.class_1_trade_points
  } else if (type === CoilingIndicatorId.TWO_TYPE) {
    data = coiling.class_2_trade_points
  } else if (type === CoilingIndicatorId.THREE_TYPE) {
    data = coiling.class_3_trade_points
  }

  if (!data) return []

  return data.map(v => {
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
      color,
      type: Decimal.create(type).minus(CoilingIndicatorId.ONE_TYPE).plus(1).toNumber()
    }
  })
}

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
    const mark = `${p.direction === 1 ? '↑' : '↓'}_${String.fromCharCode(p.mark)}_0_${p.segmentNum >= 9 ? 2 : ''}`

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

  return expands.map(p => {
    const mark = p.level === 2 ? '__1_' : `${p.direction === 1 ? '↑' : '↓'}_${labels[p.level]}_1_`
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
 * 底部信号海底捞月线
 * @param candlesticks 蜡烛图数据
 * @returns
 */
const hdly = (candlesticks: StockData['history']) => {
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
    PRE_LOW = candlesticks[i - 1][4]
    LOW = candlesticks[i][4]
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
      if (candlesticks[i - k][4] <= LOW) {
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
 * 底部信号月亮线
 * @param candlesticks 蜡烛图数据
 * @returns
 */
const monthLine = (candlesticks: StockData['history']) => {
  if (candlesticks.length < 1) return []

  let i: number
  let k: number
  const n = 13
  const m = 8
  const days = 21
  let lowest = candlesticks[0][4]
  let lowest_index = 0 //LLV(L,21)：21日内最低价的最低值
  let highest = candlesticks[0][3]
  let highest_index = 0 //HHV(H,21)：21日内最高价的最高值
  let close = candlesticks[0][2] //收盘价
  let VAR8 =
    Math.abs(highest - lowest) < 0.01 ? ((close - lowest) / 0.005) * 100 : ((close - lowest) / (highest - lowest)) * 100
  let VAR9 = VAR8
  const month_line = new Array(candlesticks.length).fill(0.0)
  month_line[0] = VAR9

  for (i = 1; i < candlesticks.length; ++i) {
    if (candlesticks[i][4] < lowest) {
      lowest = candlesticks[i][4] //LLV(L,21)：21日内最低价的最低值
      lowest_index = i
    } else if (i - lowest_index + 1 > days) {
      // 重新计算LLV(L,21)
      lowest = candlesticks[i][4]
      lowest_index = i
      for (k = 1; k < days; k++) {
        if (candlesticks[i - k][4] < lowest) {
          lowest = candlesticks[i - k][4]
          lowest_index = i - k
        }
      }
    }

    if (candlesticks[i][3] > highest) {
      highest = candlesticks[i][3] //HHV(H,21)：21日内最高价的最高值
      highest_index = i
    } else if (i - highest_index + 1 > days) {
      // 重新计算HHV(H,21)
      highest = candlesticks[i][3]
      highest_index = i
      for (k = 1; k < days; k++) {
        if (candlesticks[i - k][3] > highest) {
          highest = candlesticks[i - k][3]
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
const horizon = (candlesticks: StockData['history']) => {
  if (candlesticks.length < 1) return []

  let i: number
  let k: number
  const n = 5
  const m = 1
  const days = 27
  let lowest = candlesticks[0][4]
  let lowest_index = 0 //LLV(L,27)：27日内最低价的最低值
  let highest = candlesticks[0][3]
  let highest_index = 0 //HHV(H,27)：27日内最高价的最高值
  let close = candlesticks[0][2] //收盘价

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
    if (candlesticks[i][4] < lowest) {
      lowest = candlesticks[i][4] //LLV(L,27)：27日内最低价的最低值
      lowest_index = i
    } else if (i - lowest_index + 1 > days) {
      // 重新计算LLV(L,27)
      lowest = candlesticks[i][4]
      lowest_index = i
      for (k = 1; k < days; k++) {
        if (candlesticks[i - k][4] < lowest) {
          lowest = candlesticks[i - k][4]
          lowest_index = i - k
        }
      }
    }

    if (candlesticks[i][3] > highest) {
      highest = candlesticks[i][3] //HHV(H,27)：27日内最高价的最高值
      highest_index = i
    } else if (i - highest_index + 1 > days) {
      // 重新计算HHV(H,27)
      highest = candlesticks[i][3]
      highest_index = i
      for (k = 1; k < days; k++) {
        if (candlesticks[i - k][3] > highest) {
          highest = candlesticks[i - k][3]
          highest_index = i - k
        }
      }
    }

    close = candlesticks[i][2] //收盘价
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
 * 计算底部信号
 */
export const calcBottomSignal = (
  candlesticks: StockData['history']
): Awaited<ReturnType<typeof getStockIndicatorData>> => {
  const fillColor = new echarts.graphic.LinearGradient(1, 0, 0, 0, [
    {
      offset: 0,
      color: 'rgb(255, 0, 102)'
    },
    {
      offset: 0.5,
      color: 'rgb(255, 150, 186)'
    },
    {
      offset: 1,
      color: 'rgb(255, 0, 102)'
    }
  ])

  const hdlyLabel: { index: number; yAxis: number; label: string }[] = []
  const hdlyData: [number, number, number, number, number, string][] = []
  // const hdlyData = hdly(candlesticks)
  //   .map((item, index) => [index, 0, item, 18, 0, ''])
  //   .filter(v => v[2] > 0)
  let maxPos = -1
  let maxVol = 0
  hdly(candlesticks).forEach((vol: number, index) => {
    if (vol > 0) {
      hdlyData.push([index, 0, vol, 2, 0, ''])

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
        hdlyLabel.push({ index: maxPos, yAxis: maxVol + 8, label: str })
        maxPos = -1
        maxVol = 0
      }
    }
  })

  const monthLineData = monthLine(candlesticks)
  const horizonData = horizon(candlesticks)
  const topLine = candlesticks.map((_, index) => [index, 100])

  // const label = []

  // var hdlyValue = allChanData.safeAt(pos)?.hdlyVol;
  // if (hdlyValue != null) {
  //   if (hdlyValue < 30) {
  //     str = "小底";
  //   } else if (hdlyValue < 60) {
  //     str = "中底";
  //   } else if (hdlyValue < 90) {
  //     str = "大底";
  //   } else if (hdlyValue < 150) {
  //     str = "超大底";
  //   }

  return {
    result: [
      {
        draw: 'STICKLINE',
        style: {
          color: fillColor as any,
          linethick: 1
        },
        name: '海底捞月',
        data: hdlyData
      },
      {
        draw: '',
        style: {
          color: '#ff0066',
          linethick: 1
        },
        name: '月亮线',
        data: monthLineData
      },
      {
        draw: '',
        style: {
          color: '#fff',
          linethick: 1
        },
        name: '水平线',
        data: horizonData
      },
      {
        draw: 'HORIZONTALLINE',
        style: {
          color: '#ff0066',
          linethick: 1,
          style_type: 'dashed'
        },
        name: '顶部线',
        data: topLine
      },
      {
        draw: 'HDLY_LABEL',
        style: {
          color: '#fff',
          linethick: 1
        },
        name: '标签',
        data: hdlyLabel
      }
    ]
  }
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
export const calculateMA = (dayCount: number, data: StockData['history']) => {
  const result = []
  for (let i = 0, len = data.length; i < len; i++) {
    if (i < dayCount) {
      result.push(null)
      continue
    }
    let sum = 0
    for (let j = 0; j < dayCount; j++) {
      sum += data[i - j][2]
    }
    result.push(+(sum / dayCount).toFixed(3))
  }
  return result
}

/**
 * 计算买卖点
 * 附图买卖点位
 * X0画柱体, 值大于0，柱体颜色为magenta，值小于0，柱体颜色为cyan
 * S1和S2画线条，S1颜色为magenta，S2颜色为white
 */
export const calculateTradingPoint = (candlesticks: StockData['history']) => {
  const X0_arr: number[] = []
  const S1_arr: number[] = []
  const S2_arr: number[] = []
  const Z_arr: number[] = []

  const length = candlesticks.length
  if (length < 1) return { X0: X0_arr, S1: S1_arr, S2: S2_arr, Z: Z_arr }
  let WY1001 = (2 * candlesticks[0][1] + candlesticks[0][2] + candlesticks[0][4]) / 4 // (2 * 开盘价 + 收盘价 + 最低价) / 4
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
    WY1001 = (2 * candlesticks[i][1] + candlesticks[i][2] + candlesticks[i][4]) / 4 // (2 * 开盘价 + 收盘价 + 最低价) / 4
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
  return { X0: X0_arr, S1: S1_arr, S2: S2_arr, Z: Z_arr }
}
