import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'
import type { DrawOverlayParams } from '../types'

export const RemarkOverlay: OverlayTemplate<DrawOverlayParams & { text?: string }> = {
  name: 'remark',
  totalStep: 3,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, overlay }) => {
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
        styles: {
          color: overlay.extendData.color
        }
      }
    ]
  }
}
