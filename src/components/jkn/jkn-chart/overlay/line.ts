import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'
import { getLinearYFromCoordinates } from "../utils"

export const LineOverlay: OverlayTemplate = {
  name: 'line',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, bounding }) => {
    if (coordinates.length === 2) {
      if (coordinates[0].x === coordinates[1].x) {
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
      return [
        {
          type: 'line',
          attrs: {
            coordinates: [
              {
                x: 0,
                y: getLinearYFromCoordinates(coordinates[0], coordinates[1], { x: 0, y: coordinates[0].y })
              },
              {
                x: bounding.width,
                y: getLinearYFromCoordinates(coordinates[0], coordinates[1], { x: bounding.width, y: coordinates[0].y })
              }
            ]
          }
        }
      ]
    }
    return []
  }
}
