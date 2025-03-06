import type { FigureTemplate } from 'jkn-kline-chart'

const iconContext = import.meta.webpackContext('@/assets/icon/script_icons')

type IconAttrs = {
  x: number
  y: number
  icon: string
  width: number
  height: number
}

const imgCache = new Map<string, CanvasImageSource>()
/**
 * icon
 */
export const IconFigure: FigureTemplate<IconAttrs> = {
  name: 'icon',
  draw: (ctx, attrs) => {
    const { x, y, width, height, icon } = attrs
    const iconStr = iconContext(`./draw_${icon}.png`) as string
    if (!iconStr) return

    const iconImg = imgCache.get(iconStr)

    if (iconImg) {
      ctx.beginPath()
      ctx.drawImage(iconImg, x - width / 2, y - height / 2, width, height)
      ctx.closePath()
    } else {
      const img = new Image()
      img.src = iconStr
      img.onload = () => {
        ctx.beginPath()
        ctx.drawImage(img, x - width / 2, y - height / 2, width, height)
        ctx.closePath()
        imgCache.set(iconStr, img)
      }
    }
  },
  checkEventOn: (coordinate, attrs) => {
    const { x, y } = coordinate
    const { width, height } = attrs
    return Math.abs(x * height) + Math.abs(y * width) <= (width * height) / 2
  }
}

export type MarkOverlayAttrs = {
  x: number
  y1: number
  y2: number
  date: string
  title: string
}

export const markOverlayFigure: FigureTemplate<MarkOverlayAttrs> = {
  name: 'mark-overlay',
  draw: (ctx, attrs) => {
    const { x, y1, y2, date, title } = attrs
    ctx.beginPath()
    ctx.moveTo(x, y1)
    ctx.lineTo(x, y2)
    ctx.stroke()
    ctx.closePath()
  },
  checkEventOn: (coordinate, attrs) => {
    const { x, y } = coordinate
    const { y1, y2 } = attrs
    return y >= Math.min(y1, y2) && y <= Math.max(y1, y2) && x !== undefined
  }
}
