import type { OverlayTemplate } from "jkn-kline-chart"

export const LogoOverlay: OverlayTemplate = {
  name: 'logoOverlay',
  totalStep: 2,
  lock: true,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  createPointFigures: ({bounding}) => {
    return {
      type: 'logo',
      attrs: {
        width: 128,
        height: 18,
        x: bounding.left + 128 / 2 + 16,
        y: bounding.height - 20
      }
    }
  }
}