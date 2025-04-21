import { drawOverlayParamsToFigureStyle, createOverlayTemplate } from "../utils"
import type { DrawOverlayParams } from "../types"

export const VerticalLineOverlay = createOverlayTemplate<DrawOverlayParams>({
  name: 'vline',
  totalStep: 2,
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
});
