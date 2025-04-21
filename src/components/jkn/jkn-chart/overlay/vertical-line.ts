import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'
import { drawOverlayParamsToFigureStyle } from "../utils"
import type { DrawOverlayParams } from "../types"

export const VerticalLineOverlay: OverlayTemplate<DrawOverlayParams> = {
  name: 'vline',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  onRightClick: (e) => {
    e.preventDefault?.()
    return true
  },
  createPointFigures: ({ coordinates, bounding, overlay }) => {
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
          },
          styles: drawOverlayParamsToFigureStyle('line', overlay.extendData)
        }
      ]
    }
    return []
  }
}
