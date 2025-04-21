import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'

export const OverMarkOverlay: OverlayTemplate = {
  name: 'overMarkOverlay',
  totalStep: 1,
  lock: true,
  needDefaultXAxisFigure: false,
  onRightClick: (e) => {
    e.preventDefault?.()
    return true
  },
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
