import {
  type Bounding,
  type Coordinate,
  type LineAttrs,
  LineType,
  type Point,
  type TextAttrs
} from '@/plugins/jkn-kline-chart'
import type { DrawOverlayParams } from '../types'
import { drawOverlayParamsToFigureStyle, createOverlayTemplate } from '../utils'

function getGoldLines(
  coordinates: Coordinate[],
  bounding: Bounding,
  points: Point[]
): (LineAttrs & { value: number })[] {
  const startX = 0
  const endX = bounding.width

  return coordinates.map((coordinate, index) => ({
    coordinates: [
      {
        x: startX,
        y: coordinate.y
      },
      {
        x: endX,
        y: coordinate.y
      }
    ],
    value: points[index].value
  }))
}

const r = [0.191, 0.382, 0.5, 0.618]

const getExtendLine = (
  coordinates: Coordinate[],
  bounding: Bounding,
  points: Point[]
): (LineAttrs & { value: number })[] => {
  if (coordinates.length < 2) {
    return []
  }

  const lines: (LineAttrs & { value: number })[] = []

  coordinates.slice(1).forEach((coordinate, index) => {
    const prev = coordinates[index]

    const distance = coordinate.y - prev.y

    const prevText = points[index].value
    const textDistance = points[index + 1].value - prevText
    

    r.forEach(ratio => {
      const y = prev.y + distance * ratio
      const y2 = coordinate.y + distance * ratio
      const yText = prevText + textDistance * ratio
      const yText2 = points[index + 1].value + textDistance * ratio

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
        ],
        value: yText
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
        ],
        value: yText2
      })
    })
  })

  return lines
}

const getTexts = (lines: (LineAttrs & { value: number })[]): TextAttrs[] => {
  const texts: TextAttrs[] = []

  lines.forEach(item => {
    const { coordinates, value } = item

    if (!coordinates.length) {
      return
    }

    const { y } = coordinates[0]

    const text = value.toFixed(3)

    texts.push({
      text: text,
      x: 0,
      y: y
    })
  })

  return texts
}

export const GoldOverlay = createOverlayTemplate<DrawOverlayParams>({
  name: 'gold',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  onRightClick: e => {
    e.preventDefault?.()
    return true
  },
  createPointFigures: ({ coordinates, bounding, overlay }) => {
    if (!coordinates.length) return []
    const baseLines = getGoldLines(coordinates, bounding, overlay.points as any)
    const extendLines = getExtendLine(coordinates, bounding, overlay.points as any)
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
          size: 14,
          ...textStyles
        }
      }
    ]
  }
})
