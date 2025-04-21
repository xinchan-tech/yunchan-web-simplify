import {
  type Bounding,
  type Coordinate,
  type LineAttrs,
  LineType,
  type OverlayTemplate,
  type TextAttrs
} from '@/plugins/jkn-kline-chart'
import type { DrawOverlayParams } from '../types'
import { drawOverlayParamsToFigureStyle } from '../utils'

function getGoldLines(coordinates: Coordinate[], bounding: Bounding): LineAttrs[] {
  const startX = 0
  const endX = bounding.width

  return coordinates.map(coordinate => ({
    coordinates: [
      {
        x: startX,
        y: coordinate.y
      },
      {
        x: endX,
        y: coordinate.y
      }
    ]
  }))
}

const r = [0.191, 0.382, 0.5, 0.618]

const getExtendLine = (coordinates: Coordinate[], bounding: Bounding): LineAttrs[] => {
  if (coordinates.length < 2) {
    return []
  }

  const lines: LineAttrs[] = []

  coordinates.slice(1).forEach((coordinate, index) => {
    const prev = coordinates[index]

    const distance = coordinate.y - prev.y

    r.forEach(ratio => {
      const y = prev.y + distance * ratio
      const y2 = coordinate.y + distance * ratio

      lines.push({
        coordinates: [
          {
            x: 0,
            y
          },
          {
            x: bounding.width,
            y
          }
        ]
      })

      lines.push({
        coordinates: [
          {
            x: 0,
            y: y2
          },
          {
            x: bounding.width,
            y: y2
          }
        ]
      })
    })
  })

  return lines
}

const getTexts = (lines: LineAttrs[]): TextAttrs[] => {
  const texts: TextAttrs[] = []

  lines.forEach(item => {
    const { coordinates } = item

    if (!coordinates.length) {
      return
    }

    const { y } = coordinates[0]

    const text = y

    texts.push({
      text: text.toFixed(2),
      x: 0,
      y: y
    })
  })

  return texts
}

export const GoldOverlay: OverlayTemplate<DrawOverlayParams> = {
  name: 'gold',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  onRightClick: (e) => {
    e.preventDefault?.()
    return true
  },
  createPointFigures: ({ coordinates, bounding, overlay }) => {
    const baseLines = getGoldLines(coordinates, bounding)
    const extendLines = getExtendLine(coordinates, bounding)
    const texts = getTexts([...baseLines, ...extendLines])
    const lineStyles = drawOverlayParamsToFigureStyle('line', overlay.extendData)
    const textStyles = drawOverlayParamsToFigureStyle('text', overlay.extendData)
    return [
      {
        type: 'line',
        attrs: baseLines,
        styles: lineStyles
      },
      {
        type: 'line',
        attrs: extendLines,
        styles: {
          ...lineStyles,
          style: LineType.Dashed,
          dashedValue: [4, 4]
        }
      },
      {
        type: 'text',
        attrs: texts,
        styles: {
          backgroundColor: 'transparent',
          ...textStyles
        }
      }
    ]
  }
}
