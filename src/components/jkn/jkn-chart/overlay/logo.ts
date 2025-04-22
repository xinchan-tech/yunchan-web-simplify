import { createOverlayTemplate } from "../utils";

export const LogoOverlay = createOverlayTemplate({
  name: 'logo',
  totalStep: 1,
  needDefaultPointFigure: false,
  needDefaultXAxisFigure: false,
  needDefaultYAxisFigure: false,
  onRightClick: (e) => {
    e.preventDefault?.()
    return true
  },
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
});
