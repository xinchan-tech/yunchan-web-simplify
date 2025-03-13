import type { IndicatorData } from '@/utils/coiling'
import {
  type CircleAttrs,
  type FigureConstructor,
  getFigureClass,
  type IndicatorDrawParams
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
  const Line = getFigureClass('line')!
  const Circle = getFigureClass('circle')! as FigureConstructor<CircleAttrs>
  // const { realFrom, realTo } = params.chart.getVisibleRange()
  // const range = data.slice(realFrom, realTo)
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
  } else {
    new Line({
      name: 'line',
      attrs: {
        coordinates: data.map((y, x) => ({
          x: params.xAxis.convertToPixel(x),
          y: y ? params.yAxis.convertToPixel(y) : y
        }))
      },
      styles: {
        color: color || '#fff',
        size: width || 1
      }
    }).draw(params.ctx)
  }
}
