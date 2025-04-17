import type { Coordinate, OverlayTemplate, RectAttrs } from '@/plugins/jkn-kline-chart'

const minWidth = 32

const getRect = (coordinates: Coordinate[], text: string): RectAttrs => {
  const textWidth = minWidth

  const textHeight = 14

  return {
    x: coordinates[1].x - textWidth / 2,
    y: coordinates[1].y - textHeight / 2,
    width: textWidth,
    height: textHeight
  }
}

export const RemarkOverlay: OverlayTemplate = {
  name: 'remark',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, chart, overlay }) => {
    if (coordinates.length < 2) {
      return []
    }

    const { text = '文本' } = overlay.extendData ?? ({} as any)

    return [
      {
        type: 'remark',
        attrs: {
          coordinates: coordinates,
          text: [text]
        },
        styles: {}
      }
    ]
  }
}
