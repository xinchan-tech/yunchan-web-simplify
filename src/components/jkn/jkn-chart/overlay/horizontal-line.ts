import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'

export const HorizontalLineOverlay: OverlayTemplate = {
  name: 'hline',
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
                x: 0,
                y: coordinates[0].y
              },
              {
                x: bounding.width,
                y: coordinates[0].y
              }
            ]
          }
        }
      ]
    }
    return []
  }
}
