import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'
import { drawOverlayParamsToFigureStyle, getLinearYFromCoordinates, createOverlayTemplate } from '../utils'
import type { DrawOverlayParams } from '../types'

export const PenOverlay = createOverlayTemplate({
  name: 'pen',
  totalStep: 2,
  needDefaultPointFigure: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  onRightClick: (e) => {
    e.preventDefault?.()
    return true
  },
  onClick: (e) => {
    console.log(e, 'click')
    return true
  },
  onPressedMoving: (e) => {
    console.log(e)
    return true
  },
  onPressedMoveStart: (e) => {
    console.log(e, 'start')
    return true
  },
  createPointFigures: ({ coordinates, bounding, overlay }) => {
    if(coordinates.length > 1){
      return []
    }
    return []
  }
});
