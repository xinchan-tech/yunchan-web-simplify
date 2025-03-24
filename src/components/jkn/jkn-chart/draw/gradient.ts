import { type FigureConstructor, getFigureClass, type PolygonAttrs, type IndicatorDrawParams } from 'jkn-kline-chart'

/**
 * 渐变色块
 */
type GradientShape = {
  color: string[]
  x1: number
  y1: number
  x2: number
  y2: number
  points: {
    x: number
    y: number
  }[]
}

type DrawGradientFunc = (params: IndicatorDrawParams<any, any, any>, data: GradientShape[]) => void

export const drawGradient: DrawGradientFunc = (params, data) => {
  const Rect = getFigureClass('polygon')! as FigureConstructor<PolygonAttrs>
  const { realFrom, realTo } = params.chart.getVisibleRange()
  const realFromPixel = params.xAxis.convertToPixel(realFrom)
  const realToPixel = params.xAxis.convertToPixel(realTo)

  data.forEach(polygon => {
    const x1Pixel = params.xAxis.convertToPixel(polygon.x1)
    const x2Pixel = params.xAxis.convertToPixel(polygon.x2)
    const y1Pixel = params.yAxis.convertToPixel(polygon.y1)
    const y2Pixel = params.yAxis.convertToPixel(polygon.y2)
    const middleX = (x1Pixel + x2Pixel) / 2

    if(x1Pixel > realToPixel || x2Pixel < realFromPixel) return

    const gradient = params.ctx.createLinearGradient(middleX, y1Pixel, middleX, y2Pixel)
    polygon.color.reverse().forEach((color, i) => {
      gradient.addColorStop(i / (polygon.color.length - 1), color)
    })

    const rect = new Rect({
      name: 'gradientRect',
      attrs: {
        coordinates: polygon.points.map(point => ({
          x: params.xAxis.convertToPixel(point.x),
          y: params.yAxis.convertToPixel(point.y)
        }))
      },
      styles: {
        color: gradient
      }
    })

    rect.draw(params.ctx)
  })
}
