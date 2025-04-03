import {
  type FigureConstructor,
  type IndicatorDrawParams,
  type RectAttrs,
  type RectStyle,
  getFigureClass
} from 'jkn-kline-chart'

/**
 * 线或者点
 */
type RectRelShape = {
  data: {
    x: number
    y: number
    width: number
    height: number
    color: string
  }[]
}
type DrawRectRelFunc = (params: IndicatorDrawParams<any, any, any>, data: RectRelShape) => void

export const drawRectRel: DrawRectRelFunc = (params, { data }) => {
  const Rect = getFigureClass('rect')! as FigureConstructor<RectAttrs, Partial<RectStyle>>
  const bound = params.bounding

  const designWidth = 1000 / bound.width
  const designHeight = 1000 / bound.height

  data.forEach(({ x, y, width, height, color }) => {
    const _width = width / designWidth
    const _height = height / designHeight
    new Rect({
      name: 'rectRel',
      attrs: {
        x,
        y,
        width: _width,
        height: _height
      },
      styles: {
        color: color
      }
    }).draw(params.ctx)
  })
}



