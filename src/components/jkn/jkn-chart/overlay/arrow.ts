import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'

export const ArrowOverlay: OverlayTemplate = {
  name: 'arrow',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates }) => {
    if (coordinates.length === 2) {
      const [start, end] = coordinates
      const angle = Math.atan2(end.y - start.y, end.x - start.x)
      const arrowLength = 10

      const arrowPoint1 = {
        x: end.x - arrowLength * Math.cos(angle - Math.PI / 6),
        y: end.y - arrowLength * Math.sin(angle - Math.PI / 6)
      }

      const arrowPoint2 = {
        x: end.x - arrowLength * Math.cos(angle + Math.PI / 6),
        y: end.y - arrowLength * Math.sin(angle + Math.PI / 6)
      }

      return [
        {
          type: 'line',
          attrs: {
            coordinates: [start, end]
          }
        },
        {
          type: 'line',
          attrs: {
            coordinates: [end, arrowPoint1]
          }
        },
        {
          type: 'line',
          attrs: {
            coordinates: [end, arrowPoint2]
          }
        }
      ]
    }
    return []
  }
}
