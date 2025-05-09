import { drawOverlayParamsToFigureStyle, createOverlayTemplate } from '../utils'

const colors = ['#1e8bf1', '#00a74e', '#ff2c3f']
const texts = ['止盈位', '买入位', '止损位']

export const FireWallOverlay = createOverlayTemplate({
  name: 'firewall',
  totalStep: 4,
  createYAxisFigures: ({ coordinates, bounding, overlay }) => {
    const lineStyles = drawOverlayParamsToFigureStyle('line', overlay.extendData)
    return [
      ...coordinates.map((c, i) => ({
        type: 'text',
        attrs: {
          x: 0,
          y: c.y - lineStyles.size - 2,
          text: texts[i],
          baseline: 'bottom'
        },
        styles: {
          color: '#fff',
          backgroundColor: colors[i],
          fontSize: 16
        }
      })),
      ...coordinates.map((c, i) => ({
        type: 'line',
        attrs: {
          coordinates: [
            {
              x: 0,
              y: c.y
            },
            {
              x: bounding.width,
              y: c.y
            }
          ]
        },
        styles: {
          ...lineStyles,
          color: colors[i]
        }
      }))
    ]
  },
  createPointFigures: ({ coordinates, bounding, overlay }) => {
    const lineStyles = drawOverlayParamsToFigureStyle('line', overlay.extendData)
    const textStyles = drawOverlayParamsToFigureStyle('text', overlay.extendData)
    if (coordinates.length >= 1) {
      return [
        ...coordinates.map((c, i) => ({
          type: 'line',
          attrs: {
            coordinates: [
              {
                x: 0,
                y: c.y
              },
              {
                x: bounding.width,
                y: c.y
              }
            ]
          },
          styles: {
            ...lineStyles,
            color: colors[i]
          }
        })),
        ...coordinates.map((c, i) => ({
          type: 'text',
          attrs: {
            x: bounding.width,
            y: c.y,
            text: overlay.points[i].value?.toFixed(3) ?? '',
            align: 'right',
            baseline: 'bottom'
          },
          styles: {
            ...textStyles,
            color: colors[i],
            backgroundColor: 'transparent',
            size: 14
          }
        }))
      ]
    }
    return []
  }
})
