import deleteSvg from '@/assets/svg/delete-2.svg'
import type { FigureTemplate } from '@/plugins/jkn-kline-chart'
import { drawRoundedRect } from '../utils'

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
  y: number
  date: string
  dateWidth?: number
  title: string
  cb: (data: any) => void
}

export const markOverlayFigure: FigureTemplate<MarkOverlayAttrs> = {
  name: 'mark-overlay',
  draw: (ctx, attrs) => {
    const { x, y, date, title, cb } = attrs
    const fontSize = 16
    ctx.font = `${fontSize}px Arial`
    const titleWidth = ctx.measureText(title).width
    const dateWidth = ctx.measureText(date).width + 6 + 15
    attrs.dateWidth = dateWidth
    const maxWidth = Math.max(dateWidth, titleWidth)
    const padding = [8, 10, 8, 10]
    const height = padding[0] + fontSize + padding[2]
    const width = maxWidth + padding[1] + padding[3] + padding[3]
    ctx.save()
    ctx.beginPath()

    // 虚线
    ctx.moveTo(x, y)
    ctx.strokeStyle = '#949596'
    ctx.setLineDash([5, 5])
    ctx.lineTo(x, height * 2)
    ctx.stroke()
    ctx.fillStyle = '#e91e63'
    drawRoundedRect(ctx, x - width / 2, 0, width, height, [6, 6, 0, 0])
    // ctx.fillRect(x - width / 2, 0, width, height)
    ctx.fillStyle = '#fff'

    ctx.textBaseline = 'top'
    ctx.fillText(date, x - width / 2 + padding[1], padding[0])

    if (!imgCache.has('overlay-delete')) {
      const img = new Image()
      img.src = deleteSvg
      img.onload = () => {
        ctx.drawImage(img, x - width / 2 + dateWidth, padding[0] - 1, 15, 15)
        imgCache.set('overlay-delete', img)
      }
    } else {
      const img = imgCache.get('overlay-delete')
      ctx.drawImage(img!, x - width / 2 + dateWidth, padding[0] - 1, 15, 15)
    }

    ctx.fillStyle = '#fff'
    drawRoundedRect(ctx, x - width / 2, height, width, height, [0, 0, 6, 6])
    // ctx.fillRect(x - width / 2, height, width, height)
    ctx.fillStyle = 'black'
    ctx.fillText(title, x - width / 2 + padding[1], height + padding[0])

    // ctx.strokeText(title, x - width / 2 + padding[3], height + padding[0] + fontSize)

    ctx.closePath()
    ctx.restore()

    cb({
      x: x - width / 2 + dateWidth,
      y: padding[0] - 1,
      width: 15,
      height: 15
    })
  },
  checkEventOn: (coordinate, attrs) => {
    console.log(attrs.dateWidth)
    const { x, y } = coordinate
    const { y: y1 } = attrs
    return y >= y1 && y <= y1 && x !== undefined
  }
}
