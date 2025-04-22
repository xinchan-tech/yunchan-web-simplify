import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'
import { drawOverlayParamsToFigureStyle, getLinearYFromCoordinates, createOverlayTemplate } from '../utils'
import type { DrawOverlayParams } from '../types'

export const LineOverlay = createOverlayTemplate({
  name: 'line',
  totalStep: 3,
  modeSensitivity: 1,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  onRightClick: (e) => {
    e.preventDefault?.()
    return true
  },
  createPointFigures: ({ coordinates, bounding, overlay }) => {
    const styles = drawOverlayParamsToFigureStyle('line', overlay.extendData)
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
            },
            styles: {
              ...styles
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
          },
          styles: styles
        }
      ]
    }
    return []
  }
});
