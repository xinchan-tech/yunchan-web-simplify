import { calcCoiling } from '@/utils/coiling'
import { getFigureClass, IndicatorSeries, IndicatorTemplate, TooltipShowRule } from 'jkn-kline-chart'
import { candlestickToRaw } from './utils'
import { inRange } from 'radash'
import { colorUtil } from '@/utils/style'
import Decimal from 'decimal.js'
import {
  calcCoilingPivots,
  calcCoilingPivotsExpands,
  calcTradePoints,
  calculateMA,
  calculateMABatch
} from './coiling-calc'

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

/**
 * 笔
 */
export const penCoiling: IndicatorTemplate = {
  name: `coiling-${CoilingIndicatorId.PEN}`,
  shortName: 'pen',
  zLevel: 1,
  calcParams: [[], -1],
  calc: dataList => dataList,
  styles: {
    tooltip: {
      showRule: 'none' as TooltipShowRule
    }
  },
  createTooltipDataSource: () => ({
    name: '',
    icons: [],
    legends: [],
    calcParamsText: ''
  }),
  draw: ({ ctx, indicator, xAxis, yAxis }) => {
    const result = indicator.calcParams[0] as (CoilingPoint & { type: 'DASH' | 'SOLID' })[]
    const status = indicator.calcParams[1] as number
    const Line = getFigureClass('line')!

    if (!result?.length) return false

    if (status === 1) {
      new Line({
        name: 'line',
        attrs: {
          coordinates: result.map(p => ({ x: xAxis.convertToPixel(p.index), y: yAxis.convertToNicePixel(p.price) }))
        },
        styles: {
          color: '#fff',
          size: 1
        }
      }).draw(ctx)
    } else {
      new Line({
        name: 'line',
        attrs: {
          coordinates: result
            .slice(0, -1)
            .map(p => ({ x: xAxis.convertToPixel(p.index), y: yAxis.convertToNicePixel(p.price) }))
        },
        styles: {
          color: '#fff',
          size: 1
        }
      }).draw(ctx)
      new Line({
        name: 'line',
        attrs: {
          coordinates: [result[result.length - 2], result[result.length - 1]].map(p => ({
            x: xAxis.convertToPixel(p.index),
            y: yAxis.convertToNicePixel(p.price)
          }))
        },
        styles: {
          color: '#fff',
          size: 1,
          style: 'dashed'
        }
      }).draw(ctx)
    }

    return true
  }
}

/**
 * 中枢
 */
export const pivotCoiling: IndicatorTemplate = {
  name: `coiling-${CoilingIndicatorId.PIVOT}`,
  shortName: 'pivot',
  zLevel: -1,
  calcParams: [[], []] as [CoilingData['pivots'], CoilingData['expands']],
  calc: dataList => dataList,
  createTooltipDataSource: () => ({ name: '', icons: [], legends: [], calcParamsText: '' }),
  draw: ({ ctx, indicator, xAxis, yAxis }) => {
    const pivots = calcCoilingPivots(indicator.calcParams[0] as CoilingData['pivots'])
    const expands = calcCoilingPivotsExpands(indicator.calcParams[1] as CoilingData['expands'])
    const Rect = getFigureClass('rect')!
    const Text = getFigureClass('text')!

    if (!pivots?.length && !expands?.length) return false
    pivots.forEach(p => {
      const startPoints = [xAxis.convertToPixel(p.start[0]), yAxis.convertToNicePixel(p.start[1])]
      const endPoints = [xAxis.convertToPixel(p.end[0]), yAxis.convertToNicePixel(p.end[1])]
      const width = endPoints[0] - startPoints[0]
      const height = endPoints[1] - startPoints[1]
      const mark = `${p.direction === 1 ? '↑' : '↓'}${p.mark}${p.segmentNum >= 9 ? '2' : ''}`
      new Rect({
        name: 'rect',
        attrs: {
          x: startPoints[0],
          y: startPoints[1],
          width: width,
          height: height
        },
        styles: {
          color: p.bgColor
        }
      }).draw(ctx)

      new Text({
        name: 'text',
        attrs: {
          x: endPoints[0] + 24,
          y: startPoints[1],
          text: mark,
          align: 'center',
          baseline: 'bottom'
        },
        styles: {
          color: p.color,
          size: 24,
          weight: 600
        }
      }).draw(ctx)
    })

    expands.forEach(e => {
      const startPoints = [xAxis.convertToPixel(e.start[0]), yAxis.convertToNicePixel(e.start[1])]
      const endPoints = [xAxis.convertToPixel(e.end[0]), yAxis.convertToNicePixel(e.end[1])]
      const width = endPoints[0] - startPoints[0]
      const height = endPoints[1] - startPoints[1]
      const mark = `${e.direction === 1 ? '↑' : '↓'}${e.mark}`
      new Rect({
        name: 'rect',
        attrs: {
          x: startPoints[0] - 5,
          y: startPoints[1] + 5,
          width: width + 10,
          height: height - 10
        },
        styles: {
          style: e.level === 1 && e.mark !== 'A²' ? 'stroke' : 'fill',
          color: e.bgColor,
          borderColor: e.bgColor,
          borderStyle: 'dashed',
          borderWidth: 1
        }
      }).draw(ctx)
      new Text({
        name: 'text',
        attrs: {
          x: endPoints[0] + 32,
          y: startPoints[1],
          text: mark,
          align: 'center',
          baseline: 'bottom'
        },
        styles: {
          color: e.color,
          size: 24,
          weight: 600
        }
      }).draw(ctx)
    })

    return true
  }
}

/**
 * 1类买卖点
 */
export const tradePointOneTypeCoiling: IndicatorTemplate = {
  name: `coiling-${CoilingIndicatorId.ONE_TYPE}`,
  shortName: 'trade-point-one-type',
  zLevel: 1,
  calcParams: [[]] as [CoilingData['class_1_trade_points']],
  calc: dataList => dataList,
  createTooltipDataSource: () => ({ name: '', icons: [], legends: [], calcParamsText: '' }),
  draw: ({ ctx, indicator, xAxis, yAxis }) => drawTradePoint({ ctx, indicator, xAxis, yAxis } as any, 1)
}

export const tradePointTwoTypeCoiling: IndicatorTemplate = {
  name: `coiling-${CoilingIndicatorId.TWO_TYPE}`,
  shortName: 'trade-point-two-type',
  zLevel: 1,
  calcParams: [[]] as [CoilingData['class_2_trade_points']],
  calc: dataList => dataList,
  createTooltipDataSource: () => ({
    name: '',
    icons: [],
    legends: [],
    calcParamsText: ''
  }),
  draw: ({ ctx, indicator, xAxis, yAxis }) => drawTradePoint({ ctx, indicator, xAxis, yAxis } as any, 2)
}

export const tradePointThreeTypeCoiling: IndicatorTemplate = {
  name: `coiling-${CoilingIndicatorId.THREE_TYPE}`,
  shortName: 'trade-point-three-type',
  zLevel: 1,
  calcParams: [[]] as [CoilingData['class_3_trade_points']],
  calc: dataList => dataList,
  createTooltipDataSource: () => ({
    name: '',
    icons: [],
    legends: [],
    calcParamsText: ''
  }),
  draw: ({ ctx, indicator, xAxis, yAxis }) => drawTradePoint({ ctx, indicator, xAxis, yAxis } as any, 3)
}

const drawTradePoint = (
  { ctx, indicator, xAxis, yAxis }: Parameters<NonNullable<IndicatorTemplate['draw']>>[0],
  type: number
) => {
  const coilingData = indicator.calcParams[0] as CoilingData['class_1_trade_points']

  const Line = getFigureClass('line')!
  const Circle = getFigureClass('circle')!
  const Text = getFigureClass('text')!

  if (!coilingData?.length) return false

  const result = calcTradePoints(coilingData)

  result.forEach(p => {
    const y = yAxis.convertToNicePixel(p.price)
    const x = xAxis.convertToPixel(p.index)
    const height = y + (!p.buy ? -1 : 1) * 30
    const cy = height + (!p.buy ? -1 : 1) * 12

    new Line({
      name: 'line',
      attrs: {
        coordinates: [
          { x: x, y: y },
          { x: x, y: height }
        ]
      },
      styles: {
        color: p.color,
        size: 1,
        style: 'dashed'
      }
    }).draw(ctx) // Added .draw(ctx) to ensure the line is drawn on the context
    new Circle({
      name: 'circle',
      attrs: {
        x: x,
        y: cy,
        r: 12
      },
      styles: {
        color: p.color
      }
    }).draw(ctx)
    new Text({
      name: 'text',
      attrs: {
        x: x,
        y: cy,
        text: `${type}${p.buy ? '买' : '卖'}`,
        align: 'center',
        baseline: 'middle'
      },
      styles: {
        color: '#fff',
        fontSize: 12
      }
    }).draw(ctx)
  })

  return true
}

/**
 * 短线王
 */
export const shortLineCoiling: IndicatorTemplate = {
  // name: `coiling-${CoilingIndicatorId.SHORT_LINE}`,
  // shortName: 'short-line',
  // zLevel: 1,
  // series: IndicatorSeries.Price,
  // calcParams: [],
  // figures: [
  //   { key: 'up', title: 'UP: ', type: 'line' },
  //   { key: 'mid', title: 'MID: ', type: 'line' },
  //   { key: 'dn', title: 'DN: ', type: 'line' }
  //   // { key: 'ma20', type: 'line', styles: () => ({ color: 'rgb(186, 64, 127)' }) },
  //   // { key: 'ma30', type: 'line', styles: () => ({ color: 'rgb(156, 171, 232)' }) }
  // ],
  // regenerateFigures: (params) => params.map((p, i) => ({ key: `ma${i + 1}`, title: `MA${p}: `, type: 'line' })),
  // calc: (dataList, indicator) => {
  //   const maData = calculateMABatch([20, 30], dataList)
  //   const figures = indicator.figures
  //   console.log(1232, maData, dataList)
  //   return dataList
  //   // console.log( dataList.map((_, i) => {
  //   //   const ma: Record<string, number | null> = {}
  //   //   figures.forEach(f => {
  //   //     ma[f.key as string] = maData[f.key.replace('ma', '')][i]
  //   //   })

  //   //   return ma
  //   // }))

  //   // return dataList.map((_, i) => {
  //   //   const ma: Record<string, number | null> = {}
  //   //   figures.forEach(f => {
  //   //     ma[f.key as string] = maData[f.key.replace('ma', '')][i]
  //   //   })

  //   //   return ma
  //   // })
  // },
  // // createTooltipDataSource: () => ({ name: '', icons: [], legends: [], calcParamsText: '' })
  name: 'MA-2',
  shortName: 'MA',
  series: IndicatorSeries.Price,
  calcParams: [5, 10, 30, 60],
  precision: 2,
  shouldOhlc: true,
  figures: [
    { key: 'ma1', title: 'MA5: ', type: 'line' },
    { key: 'ma2', title: 'MA10: ', type: 'line' },
    { key: 'ma3', title: 'MA30: ', type: 'line' },
    { key: 'ma4', title: 'MA60: ', type: 'line' }
  ],
  regenerateFigures: (params) => params.map((p, i) => ({ key: `ma${i + 1}`, title: `MA${p}: `, type: 'line' })),
  calc: (dataList, indicator) => {
    const { calcParams: params, figures } = indicator
    const closeSums: number[] = []
    return dataList.map((kLineData, i) => {
      const ma = {}
      const close = kLineData.close
      params.forEach((p, index) => {
        closeSums[index] = (closeSums[index] ?? 0) + close
        if (i >= p - 1) {
          ma[figures[index].key] = closeSums[index] / p
          closeSums[index] -= dataList[i - (p - 1)].close
        }
      })
      return ma
    })
  }
}
