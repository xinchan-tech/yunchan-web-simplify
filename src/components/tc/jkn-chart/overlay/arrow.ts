import { drawOverlayParamsToFigureStyle, createOverlayTemplate } from '../utils'

export const ArrowOverlay = createOverlayTemplate({
  name: 'arrow',
  totalStep: 3,
  createPointFigures: ({ coordinates, overlay }) => {
    const styles = drawOverlayParamsToFigureStyle('line', overlay.extendData)
    if (coordinates.length === 2) {
      const [start, end] = coordinates
      const angle = Math.atan2(end.y - start.y, end.x - start.x)
      const arrowLength = 10

      const arrowPoint1 = {
        x: end.x - arrowLength * Math.cos(angle - Math.PI / 6),
        y: end.y - arrowLength * Math.sin(angle - Math.PI / 6)
      }

      const arrowPoint2 = {
        x: end.x - arrowLength * Math.cos(angle + Math.PI / 6),
        y: end.y - arrowLength * Math.sin(angle + Math.PI / 6)
      }

      return [
        {
          type: 'line',
          attrs: {
            coordinates: [start, end]
          },
          styles
        },
        {
          type: 'line',
          attrs: {
            coordinates: [end, arrowPoint1]
          },
          styles
        },
        {
          type: 'line',
          attrs: {
            coordinates: [end, arrowPoint2]
          },
          styles
        }
      ]
    }
    return []
  }
})
