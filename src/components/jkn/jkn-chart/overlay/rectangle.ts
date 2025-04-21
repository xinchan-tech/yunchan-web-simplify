import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'
import { PolygonType } from '@/plugins/jkn-kline-chart'
import type { DrawOverlayParams } from "../types"
import { drawOverlayParamsToFigureStyle } from "../utils"

export const RectangleOverlay: OverlayTemplate<DrawOverlayParams> = {
  name: 'rectangle',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  onRightClick: (e) => {
    e.preventDefault?.()
    return true
  },
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
}
