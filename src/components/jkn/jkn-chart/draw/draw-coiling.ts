import {
  type CircleAttrs,
  type FigureConstructor,
  getFigureClass,
  type PolygonStyle,
  PolygonType,
  type IndicatorDrawParams
} from 'jkn-kline-chart'
import type { DrawFunc } from '../types'
import type { CoilingCalcResult } from '../coiling-calc'

type DrawCoilingFunc = DrawFunc<CoilingCalcResult>

export const drawCoilingPen: DrawCoilingFunc = ({ xAxis, yAxis, indicator, ctx }) => {
  const data = indicator.result[0]
  const { points, status } = data
  const Line = getFigureClass('line')!

  if (!points?.length) return false

  if (status === 1) {
    new Line({
      name: 'line',
      attrs: {
        coordinates: points.map(p => ({ x: xAxis.convertToPixel(p.index), y: yAxis.convertToPixel(p.price) }))
      },
      styles: {
        color: '#E7C88D',
        size: 1
      }
    }).draw(ctx)
  } else {
    new Line({
      name: 'line',
      attrs: {
        coordinates: points
          .slice(0, -1)
          .map(p => ({ x: xAxis.convertToPixel(p.index), y: yAxis.convertToPixel(p.price) }))
      },
      styles: {
        color: '#E7C88D',
        size: 1
      }
    }).draw(ctx)
    new Line({
      name: 'line',
      attrs: {
        coordinates: [points[points.length - 2], points[points.length - 1]].map(p => ({
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

export const drawCoilingPivot: DrawCoilingFunc = ({ ctx, xAxis, yAxis, indicator }) => {
  const data = indicator.result[0]
  const pivots = data.pivotsResult
  const expands = data.expandsResult
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

type DrawCoilingTradePointFunc = (params: IndicatorDrawParams<CoilingCalcResult, any, any>, type: number) => void

export const drawCoilingTradePoint: DrawCoilingTradePointFunc = ({ ctx, xAxis, yAxis, indicator }, type) => {
  const data = indicator.result[0]
  let coilingData: ArrayItem<CoilingCalcResult['tradePointsResult']>

  switch (type) {
    case 1:
      coilingData = data.tradePointsResult[0]
      break
    case 2:
      coilingData = data.tradePointsResult[1]
      break
    case 3:
      coilingData = data.tradePointsResult[2]
      break
    default:
      coilingData = []
  }

  const Line = getFigureClass('line')!
  const Circle = getFigureClass('circle')! as FigureConstructor<CircleAttrs, Partial<PolygonStyle>>
  const Text = getFigureClass('text')!

  if (!coilingData?.length) return false

  coilingData.forEach(p => {
    const y = yAxis.convertToPixel(p.price)
    const x = xAxis.convertToPixel(p.index)
    const height = y + (!p.buy ? -1 : 1) * 30
    const cy = height + (!p.buy ? -1 : 1) * 14

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
        r: 14
      },
      styles: {
        borderColor: p.color,
        borderSize: 1,
        color: 'transparent',
        style: PolygonType.Stroke
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
        color: p.color,
        fontSize: 12
      }
    }).draw(ctx)
  })

  return true
}

type DrawCoilingMAFunc = (params: IndicatorDrawParams<CoilingCalcResult, any, any>, ma: number[]) => void

const maColorMap = {
  20: 'rgb(186, 64, 127)',
  30: 'rgb(156, 171, 232)',
  55: 'rgb(250,28,19)',
  60: 'rgb(255,255,255)',
  65: 'rgb(51,251,41)',
  120: 'rgb(51,251,41)',
  250: 'rgb(249,42,251)'
}

export const drawCoilingMA: DrawCoilingMAFunc = ({ ctx, xAxis, yAxis, indicator }, ma) => {
  const data = indicator.result[0].maResult
  const Line = getFigureClass('line')!

  if (!data?.length) return false

  ma.forEach(m => {
    const maData = data[m]
    if (!maData) return false
    new Line({
      name: 'line',
      attrs: {
        coordinates: maData.map((p, i) => ({ x: xAxis.convertToPixel(i), y: yAxis.convertToPixel(p!) }))
      },
      styles: {
        color: maColorMap[m as keyof typeof maColorMap],
        size: 1
      }
    }).draw(ctx)
  })

  return true
}
