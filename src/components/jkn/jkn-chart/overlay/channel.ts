import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'
import { getParallelLines } from './parallel'
import { drawOverlayParamsToFigureStyle } from '../utils'
import type { DrawOverlayParams } from '../types'

export const ChannelOverlay: OverlayTemplate<DrawOverlayParams> = {
  name: 'channel',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  onRightClick: (e) => {
    e.preventDefault?.()
    return true
  },
  createPointFigures: ({ coordinates, bounding, overlay }) => [
    {
      type: 'line',
      attrs: getParallelLines(coordinates, bounding, 1),
      styles: drawOverlayParamsToFigureStyle('line', overlay.extendData)
    }
  ]
}
