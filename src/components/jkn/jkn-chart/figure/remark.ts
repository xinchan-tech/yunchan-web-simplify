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

/**
 *
 */
export const RemarkFigure: FigureTemplate<RemarkAttrs, FigureStyles> = {
  name: 'remark',
  draw: (ctx, attrs, styles) => {
    const { coordinates, text, fontSize = 16 } = attrs
    const { color = '#fff' } = styles
    console.log(coordinates, text)
    let textMax = 32
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

    drawRoundedRect(ctx, x, y, textMax, height, 4)
    ctx.fill()

    /**
     * 画箭头
     *
     */
    const { x: x1, y: y1 } = coordinates[0]
    const centerX = x + textMax / 2
    const centerY = y + height / 2

    // Calculate the direction vector from (x1, y1) to the center
    const dx = centerX - x1
    const dy = centerY - y1
    const length = Math.sqrt(dx * dx + dy * dy)

    // Normalize the direction vector
    const nx = dx / length
    const ny = dy / length

    // Perpendicular vector for the arrowhead
    const px = -ny
    const py = nx

    // Arrowhead points
    const arrowLength = 10
    const arrowX1 = x1 + px * arrowLength
    const arrowY1 = y1 + py * arrowLength
    const arrowX2 = x1 - px * arrowLength
    const arrowY2 = y1 - py * arrowLength

    // Draw the line from (x1, y1) to the center
    // ctx.beginPath()
    // ctx.moveTo(x1, y1)
    // ctx.lineTo(centerX, centerY)
    // ctx.stroke()

    // Draw the arrowhead
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(arrowX1, arrowY1)
    ctx.lineTo(arrowX2, arrowY2)
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
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    text.forEach((t, i) => {
      ctx.fillText(t, centerX, centerY + (i - 1) * fontSize)
    })
    ctx.fillStyle = color
  },
  checkEventOn: (coordinate, attrs) => {
    const { coordinates } = attrs
    const { x, y } = coordinates[1]
    const { x: x1, y: y1 } = coordinates[0]

    return (
      (coordinate.x > x - 10 && coordinate.x < x + 10 && coordinate.y > y - 10 && coordinate.y < y + 10) ||
      (coordinate.x > x1 - 10 && coordinate.x < x1 + 10 && coordinate.y > y1 - 10 && coordinate.y < y1 + 10)
    )
  }
}
