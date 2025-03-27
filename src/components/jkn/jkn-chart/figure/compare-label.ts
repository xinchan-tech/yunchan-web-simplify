import type { FigureTemplate } from 'jkn-kline-chart'

export type CompareLabelAttrs = {
  x: number
  y: number
  label: string
  isActive: boolean
}

/**
 * logo
 */
export const compareLabelFigure: FigureTemplate<CompareLabelAttrs> = {
  name: 'compare-label',
  draw: (ctx, attrs) => {
    ctx.beginPath()
    ctx.fillStyle = attrs.isActive ? 'green' : 'red'
    ctx.fillText(attrs.label, attrs.x, attrs.y)
    ctx.closePath()
  },
  checkEventOn: (c, attrs) => {
    console.log(c)
    const { x, y } = c
    return x >= attrs.x - 10 && x <= attrs.x + 10 && y >= attrs.y - 10 && y <= attrs.y + 10
  }
}
