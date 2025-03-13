import { type IndicatorDrawParams, getFigureClass } from "jkn-kline-chart"

/**
 * 画icon
 */
type IconShape = {
  data: {
    x: number
    y: number
    icon: number
    offsetX: number
    offsetY: number
  }[]
}

type DrawIconFunc = (params: IndicatorDrawParams<any, any, any>, data: IconShape) => void

export const drawIcon: DrawIconFunc = (params, { data }) => {
  const Icon = getFigureClass('icon')!
  const { xAxis, yAxis } = params
  data.forEach(({ x, y, icon, offsetX, offsetY }) => {
    new Icon({
      name: 'icon',
      attrs: {
        x: xAxis.convertToPixel(x) + offsetX,
        y: yAxis.convertToPixel(y) + offsetY,
        icon: icon,
        width: 20,
        height: 20
      },
      styles: {}
    }).draw(params.ctx)
  })
}
