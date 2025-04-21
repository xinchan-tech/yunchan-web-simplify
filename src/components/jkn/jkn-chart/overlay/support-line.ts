import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'
import type { DrawOverlayParams } from '../types'
import { drawOverlayParamsToFigureStyle, createOverlayTemplate } from "../utils"

export const SupportLineOverlay = createOverlayTemplate({
  name: 'support-line',
  totalStep: 2,
  createYAxisFigures: ({ coordinates, bounding, overlay }) => {
    if(coordinates.length === 1) {
      const styles = drawOverlayParamsToFigureStyle('line', overlay.extendData)
      const textStyles = drawOverlayParamsToFigureStyle('text', overlay.extendData)
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
        },
        {
          type: 'text',
          attrs: {
            x: 0,
            y: coordinates[0].y - styles.size - 2,
            text: '支撑线',
            baseline: 'bottom'
          },
          styles: {
            ...textStyles,
            color: '#fff',
            backgroundColor: styles.color,
            fontSize: 16
          }
        }
      ]
    }
    return []
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
});
