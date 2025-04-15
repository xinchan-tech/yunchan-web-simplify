import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'

export const VerticalLineOverlay: OverlayTemplate = {
  name: 'vline',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, bounding }) => {
    if (coordinates.length === 1) {
      return [
        {
          type: 'line',
          attrs: {
            coordinates: [
              {
                x: coordinates[0].x,
                y: 0
              },
              {
                x: coordinates[0].x,
                y: bounding.height
              }
            ]
          }
        }
      ]
    }
    return []
  }
}