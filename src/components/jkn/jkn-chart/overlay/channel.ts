import { getParallelLines } from './parallel'
import { drawOverlayParamsToFigureStyle, createOverlayTemplate } from '../utils'
import type { DrawOverlayParams } from '../types'

export const ChannelOverlay = createOverlayTemplate<DrawOverlayParams>({
  name: 'channel',
  totalStep: 4,
  createPointFigures: ({ coordinates, bounding, overlay }) => [
    {
      type: 'line',
      attrs: getParallelLines(coordinates, bounding, 1),
      styles: drawOverlayParamsToFigureStyle('line', overlay.extendData)
    }
  ]
});
