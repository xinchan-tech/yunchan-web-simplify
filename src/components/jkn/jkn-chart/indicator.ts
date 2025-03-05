import { useIndicator } from '@/store'
import { calcIndicator, type IndicatorData } from '@/utils/coiling'
import { aesDecrypt } from '@/utils/string'
import {
  type CircleAttrs,
  type FigureConstructor,
  getFigureClass,
  type IndicatorDrawParams,
  IndicatorSeries,
  type IndicatorTemplate,
  type LineAttrs,
  type PolygonAttrs,
  type TextAttrs,
  type TextStyle
} from 'jkn-kline-chart'
import { candlestickToRaw } from './utils'
import { inRange, isArray, isNumber } from 'radash'
import Decimal from 'decimal.js'
import type { StockRawRecord } from '@/api'
import type { IndicatorDataType } from '@/utils/coiling/transform'

type LocalIndicatorExtend = {
  name: string
}

const isCoilingIndicator = (indicatorId: string) => {
  return indicatorId === '9' || indicatorId === '10'
}

export const localIndicator: IndicatorTemplate<IndicatorData, any, LocalIndicatorExtend> = {
  name: 'local-indicator',
  shortName: 'local-indicator',
  zLevel: 1,
  series: IndicatorSeries.Normal,
  calcParams: [],
  getValueRangeInVisibleRange: ({ result }, chart) => {
    let max = Number.MIN_SAFE_INTEGER
    let min = Number.MAX_SAFE_INTEGER
    const { realFrom, realTo } = chart.getVisibleRange()

    for (let i = realFrom; i < realTo; i++) {
      result.forEach((r: any) => {
        if (!r.draw) {
          const value = r.drawData[i]
          if (isNumber(value)) {
            max = Math.max(max, value)
            min = Math.min(min, value)
          }
        }
      })
    }
    return { max, min }
  },
  calc: async (dataList, indicator) => {
    const [indicatorId, symbol, interval] = indicator.calcParams as [string, string, number]
    const formula = useIndicator.getState().formula
    const rawData = dataList.map(candlestickToRaw)

    if (isCoilingIndicator(indicatorId)) {
      if (indicatorId === '9') {
        return calcBottomSignal(rawData)
      }
      if (indicatorId === '10') {
        return calculateTradingPoint(rawData)
      }

      return []
    }

    if (!formula[indicatorId]) return []

    const r = await calcIndicator(
      {
        formula: aesDecrypt(formula[indicatorId]),
        symbal: symbol,
        indicatorId
      },
      rawData,
      interval
    )

    return r
  },
  createTooltipDataSource: ({ indicator, crosshair }) => {
    const data = indicator.result.filter(d => d.name)
    return {
      name: (indicator.extendData as LocalIndicatorExtend).name,
      icons: [],
      legends: data.map((d, index, arr) => ({
        title: { text: `${d.name!}: `, color: d.color as string },
        value: {
          text: isNumber(arr[index].drawData?.[crosshair.dataIndex!])
            ? Decimal.create(arr[index].drawData[crosshair.dataIndex!] as any).toFixed(3)
            : '',
          color: d.color as string
        }
      })),
      calcParamsText: ''
    }
  },
  draw: params => {
    const { indicator } = params
    const result = indicator.result as unknown as IndicatorData[]
    if (!result) return false

    result.forEach(d => {
      if (d.draw === '') {
        drawLine(params, {
          color: d.color as string,
          data: d.drawData,
          type: d.lineType,
          width: d.width
        })
      } else if (d.draw === 'STICKLINE') {
        drawStickLine(params, {
          color: d.color as string | string[],
          data: d.drawData
        })
      } else if (d.draw === 'DRAWTEXT') {
        drawText(params, { color: d.color as string, data: d.drawData })
      } else if (d.draw === 'DRAWICON') {
        drawIcon(params, { data: d.drawData })
      } else if (d.draw === 'DRAWBAND') {
        const points = d.drawData.map(d => {
          const leftArr: { x: number; y: number }[] = []
          const rightArr: typeof leftArr = []
          d.points.forEach((p, index, arr) => {
            if (p.drawX && p.drawY && index === 0) {
              leftArr.push({ x: p.drawX, y: p.drawY })
              rightArr.push({ x: p.drawX, y: p.drawY })
            }

            if (p.drawX && p.drawY && index === arr.length - 1) {
              leftArr.push({ x: p.drawX, y: p.drawY })
              rightArr.push({ x: p.drawX, y: p.drawY })
            } else {
              leftArr.push({ x: p.x, y: p.y1 })
              rightArr.push({ x: p.x, y: p.y2 })
            }
          })
          return {
            color: d.color,
            x1: d.startIndex,
            x2: d.endIndex,
            points: leftArr.concat(rightArr.reverse())
          }
        })

        drawBand(params, { data: points })
      } else if (d.draw === 'DRAWNUMBER') {
        drawText(params, { color: d.color as string, data: d.drawData.map(item => ({ ...item, text: item.number })) })
      } else if (d.draw === 'DRAWRECTREL') {
      } else if (d.draw === 'HORIZONTALLINE') {
        drawHorizonLine(params, { color: d.color as string, data: d.drawData })
      } else if (d.draw === 'HDLY_LABEL') {
        drawHDLYLabel(params, { color: d.color as string, data: d.drawData })
      }
    })

    return true
  }
}

type DrawFunc<T> = (params: IndicatorDrawParams<any, any, any>, data: T) => void

/**
 * 线或者点
 */
type LineShape = {
  color: string
  width?: number
  type: IndicatorData['lineType']
  data: number[]
}
const drawLine: DrawFunc<LineShape> = (params, { color, width, type, data }) => {
  const Line = getFigureClass('line')!
  const Circle = getFigureClass('circle')! as FigureConstructor<CircleAttrs>
  const { realFrom, realTo } = params.chart.getVisibleRange()
  const range = data.slice(realFrom, realTo)
  if (type === 'POINTDOT') {
    range.forEach((y, x) => {
      if (y) {
        new Circle({
          name: 'circle',
          attrs: {
            x: params.xAxis.convertToPixel(x + realFrom),
            y: params.yAxis.convertToPixel(y),
            r: 2
          },
          styles: {
            color: color
          }
        }).draw(params.ctx)
      }
    })
  } else {
    new Line({
      name: 'line',
      attrs: {
        coordinates: range.map((y, x) => ({
          x: params.xAxis.convertToPixel(x + realFrom),
          y: y ? params.yAxis.convertToPixel(y) : y
        }))
      },
      styles: {
        color: color,
        size: width || 1
      }
    }).draw(params.ctx)
  }
}

/**
 * 文本
 */
type TextShape = {
  x: number
  y: number
  text: string | number
  offsetX: number
  offsetY: number
}
const drawText: DrawFunc<{ color: string; data: TextShape[] }> = (params, { color, data }) => {
  const Text = getFigureClass('text')!

  const { xAxis, yAxis } = params
  const { realFrom, realTo } = params.chart.getVisibleRange()
  data.forEach(item => {
    if (item.x < realFrom || item.x > realTo) return
    new Text({
      name: 'text',
      attrs: {
        x: xAxis.convertToPixel(item.x) + item.offsetX,
        y: yAxis.convertToPixel(item.y) + item.offsetY,
        text: item.text,
        align: 'center',
        baseline: 'middle'
      },
      styles: {
        color: color
      }
    }).draw(params.ctx)
  })

  return true
}

/**
 * 柱体
 */
type StickLineShape = {
  color: string | string[]
  data: IndicatorDataType<'STICKLINE'>['drawData']
}
const drawStickLine: DrawFunc<StickLineShape> = (params, { data, color }) => {
  const Rect = getFigureClass('rect')!
  const { xAxis, yAxis, chart, ctx } = params
  const { realFrom, realTo } = chart.getVisibleRange()
  const { gapBar, halfGapBar } = chart.getBarSpace()
  let _color = color
  let lineGradient: [number, string][] | undefined = undefined
  if (isArray(color)) {
    _color = color[0]
    lineGradient = color.map((c, i) => [i / (color.length - 1), c])
  }

  data.forEach(item => {
    if (inRange(item.x, realFrom, realTo)) {
      const y = yAxis.convertToPixel(item.y1)
      const y2 = yAxis.convertToPixel(item.y2)

      const rect = new Rect({
        name: 'rect',
        attrs: {
          x: xAxis.convertToPixel(item.x) - halfGapBar * item.width,
          y: y2,
          width: gapBar * item.width,
          height: y - y2
        },
        styles: {
          color: item.empty === 1 ? 'transparent' : _color,
          borderColor: item.empty === 0 ? 'transparent' : _color,
          borderSize: 1,
          style: item.empty === 1 ? 'stroke' : 'fill',
          lineGradient: lineGradient
        }
      })

      rect.draw(ctx)
    }
  })
}

/**
 * 画icon
 */
type IconShape = {
  data: {
    x: number
    y: number
    icon: number
    offsetX: number
    offsetY: number
  }[]
}
const drawIcon: DrawFunc<IconShape> = (params, { data }) => {
  const Icon = getFigureClass('icon')!
  const { xAxis, yAxis } = params
  data.forEach(({ x, y, icon, offsetX, offsetY }) => {
    new Icon({
      name: 'icon',
      attrs: {
        x: xAxis.convertToPixel(x) + offsetX,
        y: yAxis.convertToPixel(y) + offsetY,
        icon: icon,
        width: 20,
        height: 20
      },
      styles: {}
    }).draw(params.ctx)
  })
}

/**
 * 画带
 *
 */
type BandShape = {
  data: {
    color: string
    x1: number
    x2: number
    points: { x: number; y: number; convertX?: boolean; convertY?: boolean }[]
  }[]
}
const drawBand: DrawFunc<BandShape> = (params, { data }) => {
  const Polygon = getFigureClass('polygon')! as FigureConstructor<PolygonAttrs>
  const { realFrom, realTo } = params.chart.getVisibleRange()
  data.forEach(({ color, x1, x2, points }) => {
    /**
     * 只有一种情况不画
     * 1. 两个点都一侧可视区域外
     */
    if ((x1 < realFrom && x2 < realFrom) || (x1 > realTo && x2 > realTo)) return
    new Polygon({
      name: 'band',
      attrs: {
        coordinates: points.map(({ x, y }) => ({
          x: params.xAxis.convertToPixel(x),
          y: params.yAxis.convertToPixel(y)
        }))
      },
      styles: {
        color: color
      }
    }).draw(params.ctx)
  })
}

type HorizonLineShape = {
  data: number[]
  color: string
}
const drawHorizonLine: DrawFunc<HorizonLineShape> = (params, { data, color }) => {
  const Line = getFigureClass('line')! as FigureConstructor<LineAttrs>

  const { xAxis, yAxis } = params
  const { realFrom, realTo } = params.chart.getVisibleRange()
  new Line({
    name: 'horizon-line',
    attrs: {
      coordinates: data.slice(realFrom, realTo).map((y, x) => ({
        x: xAxis.convertToPixel(x),
        y: yAxis.convertToPixel(y)
      }))
    },
    styles: {
      color
    }
  }).draw(params.ctx)
}

type HDLYLabelShape = {
  data: IndicatorDataType<'HDLY_LABEL'>['drawData']
  color: string
}
const drawHDLYLabel: DrawFunc<HDLYLabelShape> = (params, { data, color }) => {
  const text = getFigureClass('text')! as FigureConstructor<TextAttrs, TextStyle>

  const { xAxis, yAxis } = params
  const range = params.chart.getVisibleRange()
  data.forEach(item => {
    if (!inRange(item.x, range.realFrom, range.realTo)) {
      return
    }
    new text({
      name: 'hdly-label',
      attrs: {
        x: xAxis.convertToPixel(item.x),
        y: yAxis.convertToPixel(item.y) + 4,
        text: item.text,
        align: 'center',
        baseline: 'middle'
      },
      styles: {
        color: color,
        backgroundColor: item.color,
        paddingBottom: 4,
        paddingLeft: 4,
        paddingRight: 4,
        paddingTop: 4,
        borderRadius: 4,
        size: 12
      } as TextStyle
    }).draw(params.ctx)
  })
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
