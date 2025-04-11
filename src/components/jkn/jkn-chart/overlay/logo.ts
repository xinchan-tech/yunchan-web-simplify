import type { OverlayTemplate } from '@/plugins/jkn-kline-chart'

export const LogoOverlay: OverlayTemplate = {
  name: 'logoOverlay',
  totalStep: 1,
  lock: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({ bounding }) => {
    return {
      type: 'logo',
      attrs: {
        width: 128,
        height: 24,
        x: bounding.left + 128 / 2 + 16,
        y: bounding.height - 24
      }
    }
  }
}
