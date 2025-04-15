import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'
import { getParallelLines } from './parallel'

export const ChannelOverlay: OverlayTemplate = {
  name: 'channel',
  totalStep: 4,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ coordinates, bounding }) => [
    {
      type: 'line',
      attrs: getParallelLines(coordinates, bounding, 1)
    }
  ]
}
