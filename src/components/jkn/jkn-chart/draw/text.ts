import {
  type FigureConstructor,
  type IndicatorDrawParams,
  type TextAttrs,
  type TextStyle,
  getFigureClass
} from '@/plugins/jkn-kline-chart'

/**
 * 文本
 */
type TextShape = {
  color: string
  attrs: {
    x: number
    y: number
    text: string | number
    offsetX: number
    offsetY: number
  }[]
}
type DrawTextFunc = (params: IndicatorDrawParams<any, any, any>, data: TextShape) => void

export const drawText: DrawTextFunc = (params, { color, attrs }) => {
  const Text = getFigureClass('text')! as FigureConstructor<TextAttrs, Partial<TextStyle>>

  const { xAxis, yAxis } = params
  const { realFrom, realTo } = params.chart.getVisibleRange()
  attrs.forEach(item => {
    if (item.x < realFrom || item.x > realTo) return
    new Text({
      name: 'text',
      attrs: {
        x: xAxis.convertToPixel(item.x) + item.offsetX,
        y: yAxis.convertToPixel(item.y) + item.offsetY,
        text: item.text.toString(),
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
