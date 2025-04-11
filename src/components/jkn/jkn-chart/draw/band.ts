import { type IndicatorDrawParams, getFigureClass, type FigureConstructor, type PolygonAttrs } from '@/plugins/jkn-kline-chart'

/**
 * 画带
 *
 */
type BandShape = {
  data: {
    color: string
    x1: number
    x2: number
    points: { x: number; y: number; convertX?: boolean; convertY?: boolean }[]
  }[]
}
type DrawBandFunc = (params: IndicatorDrawParams<any, any, any>, data: BandShape) => void
export const drawBand: DrawBandFunc = (params, { data }) => {
  const Polygon = getFigureClass('polygon')! as FigureConstructor<PolygonAttrs>
  const { realFrom, realTo } = params.chart.getVisibleRange()
  data.forEach(({ color, x1, x2, points }) => {
    /**
     * 只有一种情况不画
     * 1. 两个点都一侧可视区域外
     */
    if ((x1 < realFrom && x2 < realFrom) || (x1 > realTo && x2 > realTo)) return
    new Polygon({
      name: 'band',
      attrs: {
        coordinates: points.map(({ x, y }) => ({
          x: params.xAxis.convertToPixel(x),
          y: params.yAxis.convertToPixel(y)
        }))
      },
      styles: {
        color: color
      }
    }).draw(params.ctx)
  })
}
