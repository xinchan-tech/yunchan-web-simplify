import type { IndicatorDataType } from '@/utils/coiling/transform'
import { type IndicatorDrawParams, getFigureClass } from '@/plugins/jkn-kline-chart'
import { inRange, isArray } from 'radash'

/**
 * 柱体
 */
type StickLineShape = {
  color: string | string[]
  data: IndicatorDataType<'STICKLINE'>['drawData']
}
type DrawStockLineFunc = (params: IndicatorDrawParams<any, any, any>, data: StickLineShape) => void
export const drawStickLine: DrawStockLineFunc = (params, { data, color }) => {
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
  if (!data) return false
  if (!Array.isArray(data)) return false
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
          borderSize: 2,
          style: item.empty === 1 ? 'stroke' : 'fill',
          lineGradient: lineGradient
        }
      })

      rect.draw(ctx)
    }
  })
}
