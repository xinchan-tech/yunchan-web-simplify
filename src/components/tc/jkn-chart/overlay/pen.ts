import { drawOverlayParamsToFigureStyle, createOverlayTemplate } from '../utils'
import type { DrawOverlayParams } from '../types'

export const PenOverlay = createOverlayTemplate<DrawOverlayParams & { points: { x: number; y: number }[] }>({
  name: 'pen',
  totalStep: 3,
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  onDrawing: ({ overlay, x, y }) => {
    if(overlay.points.length <= 1){
      return false
    }
    if (!overlay.extendData.points) {
      overlay.extendData.points = []
    }
    overlay.extendData.points.push({ x: x!, y: y! })
    return true
  },
  createPointFigures: ({ coordinates, overlay }) => {
    const styles = drawOverlayParamsToFigureStyle('line', overlay.extendData)
    if (coordinates.length > 1) {
      return [
        {
          type: 'line',
          attrs: {
            coordinates: [
              ...(overlay.extendData.points ?? [])
            ]
          },
          styles: {
            ...styles
          }
        }
      ]
    }
    return []
  }
})
