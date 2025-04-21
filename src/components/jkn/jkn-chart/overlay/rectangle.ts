import { PolygonType } from '@/plugins/jkn-kline-chart'
import type { DrawOverlayParams } from "../types"
import { createOverlayTemplate, drawOverlayParamsToFigureStyle } from "../utils"

export const RectangleOverlay = createOverlayTemplate<DrawOverlayParams>({
  name: 'rectangle',
  totalStep: 2,
  createPointFigures: ({ coordinates, overlay }) => {
    if (coordinates.length === 2) {
      return [
        {
          type: 'rect',
          attrs: {
            x: Math.min(coordinates[0].x, coordinates[1].x),
            y: Math.min(coordinates[0].y, coordinates[1].y),
            width: Math.abs(coordinates[1].x - coordinates[0].x),
            height: Math.abs(coordinates[1].y - coordinates[0].y)
          },
          styles: {
            ...drawOverlayParamsToFigureStyle('rect', overlay.extendData),
            style: PolygonType.Stroke
          }
        }
      ]
    }
    return []
  }
});
