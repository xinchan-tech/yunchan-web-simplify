import { IndicatorSeries, type IndicatorTemplate, type TooltipShowRule, getFigureClass } from 'jkn-kline-chart'
import { calcCoilingPivots, calcCoilingPivotsExpands, calcTradePoints, calculateMA } from './coiling-calc'

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
          coordinates: result.map(p => ({ x: xAxis.convertToPixel(p.index), y: yAxis.convertToPixel(p.price) }))
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
            .map(p => ({ x: xAxis.convertToPixel(p.index), y: yAxis.convertToPixel(p.price) }))
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
            y: yAxis.convertToPixel(p.price)
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
      const startPoints = [xAxis.convertToPixel(p.start[0]), yAxis.convertToPixel(p.start[1])]
      const endPoints = [xAxis.convertToPixel(p.end[0]), yAxis.convertToPixel(p.end[1])]
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
      const startPoints = [xAxis.convertToPixel(e.start[0]), yAxis.convertToPixel(e.start[1])]
      const endPoints = [xAxis.convertToPixel(e.end[0]), yAxis.convertToPixel(e.end[1])]
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
    const y = yAxis.convertToPixel(p.price)
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
  name: `coiling-${CoilingIndicatorId.SHORT_LINE}`,
  shortName: 'short-line',
  series: IndicatorSeries.Price,
  calcParams: [20, 30],
  precision: 2,
  figures: [
    { key: 'ma20', type: 'line', styles: () => ({ color: 'rgb(186, 64, 127)' }) },
    { key: 'ma30', type: 'line', styles: () => ({ color: 'rgb(156, 171, 232)' }) }
  ],
  calc: (dataList, indicator) => {
    const { calcParams: params } = indicator
    const maData = params.map(p => calculateMA(p as number, dataList))
    // console.log(1232, maData, dataList)

    return dataList.map((_, i) => {
      const ma: Record<string, number | null> = {}
      params.forEach((f, index) => {
        ma[`ma${f}`] = maData[index][i]
      })

      return ma
    })
  },
  createTooltipDataSource: () => ({ name: '', icons: [], legends: [], calcParamsText: '' })
}

/**
 * 主力趋势
 */
export const mainTrendCoiling: IndicatorTemplate = {
  name: `coiling-${CoilingIndicatorId.MAIN}`,
  shortName: 'main-trend',
  series: IndicatorSeries.Price,
  calcParams: [55, 60, 65, 120, 250],
  precision: 2,
  figures: [
    { key: 'ma55', type: 'line', styles: () => ({ color: 'rgb(250,28,19)' }) },
    { key: 'ma60', type: 'line', styles: () => ({ color: 'rgb(255,255,255)' }) },
    { key: 'ma65', type: 'line', styles: () => ({ color: 'rgb(51,251,41)' }) },
    { key: 'ma120', type: 'line', styles: () => ({ color: 'rgb(51,251,41)', lineWidth: 4 }) },
    { key: 'ma250', type: 'line', styles: () => ({ color: 'rgb(249,42,251)', lineWidth: 6 }) }
  ],
  calc: (dataList, indicator) => {
    const { calcParams: params } = indicator
    const maData = params.map(p => calculateMA(p as number, dataList))

    return dataList.map((_, i) => {
      const ma: Record<string, number | null> = {}
      params.forEach((f, index) => {
        ma[`ma${f}`] = maData[index][i]
      })

      return ma
    })
  },
  createTooltipDataSource: () => ({ name: '', icons: [], legends: [], calcParamsText: '' })
}
