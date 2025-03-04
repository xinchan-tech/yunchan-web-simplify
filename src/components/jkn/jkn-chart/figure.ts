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

// type FigureAttrs = {
//   x1: number
//   x2: number
//   points: { x: number; y: number }[]
// }


// /**
//  * 飘带
//  */
// export const bandFigure: FigureTemplate<FigureAttrs> = {

// }