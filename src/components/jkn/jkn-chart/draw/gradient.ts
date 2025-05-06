import {
  type FigureConstructor,
  type IndicatorDrawParams,
  type PolygonAttrs,
  getFigureClass
} from '@/plugins/jkn-kline-chart'

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
    offsetY: number
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

    if (x1Pixel > realToPixel || x2Pixel < realFromPixel) return

    const gradient = params.ctx.createLinearGradient(middleX, y1Pixel, middleX, y2Pixel)
    
    polygon.color.slice().reverse().forEach((color, i) => {
      gradient.addColorStop(i / (polygon.color.length - 1), color)
    })

    const coordinates = polygon.points.map((point, index, arr) => {
      const originalY = params.yAxis.convertToPixel(point.y)
      const originalX = params.xAxis.convertToPixel(point.x)

      if (!point.offsetY) {
        return { x: originalX, y: originalY }
      }

      /**
       * 找相邻的且y点不为0的点计算k值
       */
      let kPoint = arr[index - 1]
      if(!kPoint) {
        kPoint = arr[index + 1]
        if(kPoint.y === 0){
          kPoint = arr[index - 1]
        }
      }else if(kPoint.y === 0){
        kPoint = arr[index + 1]
      }

      if (!kPoint) {
        return { x: originalX, y: originalY }
      }

      const kY = params.yAxis.convertToPixel(kPoint.y)
      const kX = params.xAxis.convertToPixel(kPoint.x)

      const transformedY = params.yAxis.convertToPixel(point.y + point.offsetY)
      const k  = (originalY - kY) / (originalX - kX)
      const transformedX = originalX + (transformedY - originalY) / k

      return { x: transformedX, y: transformedY }
    })

    const rect = new Rect({
      name: 'gradientRect',
      attrs: {
        coordinates
      },
      styles: {
        color: gradient
      }
    })

    rect.draw(params.ctx)
  })
}
