import type { Coordinate, FigureTemplate } from '@/plugins/jkn-kline-chart'
import { drawRoundedRect } from '../utils'

export type RemarkAttrs = {
  text: string[]
  coordinates: Coordinate[]
  fontSize?: number
}

export type FigureStyles = {
  color?: string
}

type RemarkAttrsExt = RemarkAttrs & {
  shape: {
    x: number
    y: number
    width: number
    height: number
  }
}

/**
 *
 */
export const RemarkFigure: FigureTemplate<RemarkAttrs, FigureStyles> = {
  name: 'remark',
  draw: (ctx, attrs, styles) => {
    const { coordinates, text, fontSize = 16 } = attrs
    const { color = '#fff' } = styles
    const padding = [6, 6]
    let textMax = 128
    let height = fontSize
    ctx.font = `${fontSize}px sans-serif`

    text.forEach(t => {
      textMax = Math.max(textMax, ctx.measureText(t).width)
      height += fontSize
    })

    /**
     * 画圆角矩形
     */
    const { x, y } = coordinates[1]
    ctx.beginPath()
    ctx.fillStyle = color

    drawRoundedRect(ctx, x, y, textMax + padding[1] * 2, height + padding[0] * 2, 4)
    ctx.fill()

    /**
     * 画箭头
     *
     */
    const { x: x1, y: y1 } = coordinates[0]
    const centerX = x + textMax / 2
    const centerY = y + height / 2

    const radius = Math.sqrt((centerX - x1) ** 2 + (centerY - y1) ** 2)
    const angle = Math.atan2(centerY - y1, centerX - x1)
    const arcLength = 20 / radius // Calculate the angle for the arc length

    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.arc(x1, y1, radius, angle - arcLength / 2, angle + arcLength / 2)
    ctx.closePath()
    ctx.fill()

    // const centerX = x + textMax / 2
    // const centerY = y + height / 2

    // ctx.beginPath()
    // ctx.moveTo(x1, y1)
    // if (Math.abs(y1 - centerY) > Math.abs(x1 - centerX)) {
    //   // Vertical arrow
    //   ctx.lineTo(centerX, centerY - 10)
    //   ctx.lineTo(centerX, centerY + 10)
    // } else {
    //   // Horizontal arrow
    //   ctx.lineTo(centerX - 10, centerY)
    //   ctx.lineTo(centerX + 10, centerY)
    // }
    // ctx.closePath()
    // ctx.fill()

    /**
     * 画文本
     */
    ctx.fillStyle = '#000'
    text.forEach((t, i) => {
      ctx.fillText(t, x + padding[1], y - (i - 1) * fontSize - padding[0])
    })
    ctx.fillStyle = color

    ;(attrs as RemarkAttrsExt).shape = {
      x: x,
      y: y,
      width: textMax + padding[1] * 2,
      height: height + padding[0] * 2
    }
  },
  checkEventOn: (coordinate, attrs) => {
    const { shape } = attrs as RemarkAttrsExt
    const { x, y, width, height } = shape

    return (
      coordinate.x >= x &&
      coordinate.x <= x + width &&
      coordinate.y >= y &&
      coordinate.y <= y + height
    )
  }
}
