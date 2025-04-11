import { LineType, type OverlayTemplate } from '@/plugins/jkn-kline-chart'

export const VerticalLineOverlay: OverlayTemplate = {
  name: 'VerticalLineOverlay',
  totalStep: 1,
  lock: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, bounding, xAxis }) => {
    return {
      type: 'line',
      attrs: {
        coordinates: [
          { x: xAxis?.convertToPixel(40), y: 0 },
          {
            x: xAxis?.convertToPixel(coordinates[0].x),
            y: bounding.height
          }
        ]
      },
      styles: {
        color: '#2E2E2E',
        style: LineType.Dashed,
        dashValue: [5, 20]
      }
    }
  }
}
