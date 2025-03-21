import type { IndicatorData } from '@/utils/coiling'
import {
  type CircleAttrs,
  type FigureConstructor,
  getFigureClass,
  type IndicatorDrawParams,
  type LineAttrs,
  type LineStyle,
  LineType,
  type PolygonStyle,
  PolygonType
} from 'jkn-kline-chart'

/**
 * 线或者点
 */
type LineShape = {
  color: string
  width?: number
  type: IndicatorData['lineType']
  data: number[]
}
type DrawLineFunc = (params: IndicatorDrawParams<any, any, any>, data: LineShape) => void

export const drawLine: DrawLineFunc = (params, { color, width, type, data }) => {
  const Line = getFigureClass('line')! as FigureConstructor<LineAttrs, Partial<LineStyle>>
  const Circle = getFigureClass('circle')! as FigureConstructor<CircleAttrs, Partial<PolygonStyle>>

  if (type === 'POINTDOT') {
    data.forEach((y, x) => {
      if (y) {
        new Circle({
          name: 'circle',
          attrs: {
            x: params.xAxis.convertToPixel(x),
            y: params.yAxis.convertToPixel(y),
            r: 2
          },
          styles: {
            color: color
          }
        }).draw(params.ctx)
      }
    })
  } else if (type === 'CIRCLEDOT') {
    data.forEach((y, x) => {
      if (y) {
        new Circle({
          name: 'circle',
          attrs: {
            x: params.xAxis.convertToPixel(x),
            y: params.yAxis.convertToPixel(y),
            r: 2
          },
          styles: {
            color: color,
            style: PolygonType.Stroke,
            borderColor: color
          }
        }).draw(params.ctx)
      }
    })
  } else {
    new Line({
      name: 'line',
      attrs: {
        coordinates: data.map((y, x) => ({
          x: params.xAxis.convertToPixel(x),
          y: y !== null ? params.yAxis.convertToPixel(y) : y
        }))
      },
      styles: {
        style: type === 'DOTLINE' ? LineType.Dashed : LineType.Solid,
        color: color || '#fff',
        size: width || 1,
        dashedValue: type === 'DOTLINE' ? [5, 2] : undefined
      }
    }).draw(params.ctx)
  }
}
