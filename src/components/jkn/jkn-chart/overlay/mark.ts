import type { OverlayTemplate } from 'jkn-kline-chart'

export const OverMarkOverlay: OverlayTemplate = {
  name: 'overMarkOverlay',
  totalStep: 1,
  lock: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates }) => {
    return coordinates.map(coordinate => {
      return {
        type: 'mark-overlay',
        attrs: {
          x: coordinate.x,
          y: coordinate.y
        },
        styles: {}
      }
    })
  }
}
