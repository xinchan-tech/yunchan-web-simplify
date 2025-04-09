import type { FigureTemplate } from 'jkn-kline-chart'
import stockLogo from '@/assets/image/today-chart.png'

type LogoAttrs = {
  x: number
  y: number
  width: number
  height: number
}

let logoCache: Nullable<CanvasImageSource> = null

/**
 * logo
 */
export const LogoFigure: FigureTemplate<LogoAttrs> = {
  name: 'logo',
  draw: (ctx, attrs) => {
    if (!logoCache) {
      const img = new Image()
      img.src = stockLogo
      img.onload = () => {
        ctx.beginPath()
        ctx.drawImage(img, attrs.x - attrs.width / 2, attrs.y - attrs.height / 2, attrs.width, attrs.height)
        ctx.closePath()
        logoCache = img
      }
    } else {
      ctx.beginPath()
      ctx.drawImage(logoCache, attrs.x - attrs.width / 2, attrs.y - attrs.height / 2, attrs.width, attrs.height)
      ctx.closePath()
    }
  },
  checkEventOn: () => false
}
