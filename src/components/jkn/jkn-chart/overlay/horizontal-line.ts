import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'
import type { DrawOverlayParams } from '../types'
import { drawOverlayParamsToFigureStyle } from "../utils"

export const HorizontalLineOverlay: OverlayTemplate<DrawOverlayParams> = {
  name: 'hline',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  onRightClick: (e) => {
    e.preventDefault?.()
    return true
  },
  createPointFigures: ({ coordinates, bounding, overlay }) => {
    const styles = drawOverlayParamsToFigureStyle('line', overlay.extendData)
 
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
          },
          styles
        }
      ]
    }
    return []
  }
}
