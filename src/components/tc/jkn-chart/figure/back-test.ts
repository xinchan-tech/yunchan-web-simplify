import type { FigureTemplate } from '@/plugins/jkn-kline-chart'

export type BackTestMarkAttrs = {
  x: number
  y1: number
  y2: number
  type: string
  price: number
  count: number
  line: boolean
}

export type BackTestMarkStyles = {
  color: string
}

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number | [number, number, number, number]
) => {
  let leftTop = 0
  let rightTop = 0
  let rightBottom = 0
  let leftBottom = 0
  if (Array.isArray(radius)) {
    ;[leftTop, rightTop, rightBottom, leftBottom] = radius
  } else {
    leftTop = rightTop = rightBottom = leftBottom = radius
  }
  ctx.beginPath()
  ctx.moveTo(x + leftTop, y)
  ctx.arcTo(x + width, y, x + width, y + rightTop, rightTop)
  ctx.lineTo(x + width, y + height - rightBottom)
  ctx.arcTo(x + width, y + height, x + width - rightBottom, y + height, rightBottom)
  ctx.lineTo(x + leftBottom, y + height)
  ctx.arcTo(x, y + height, x, y + height - leftBottom, leftBottom)
  ctx.lineTo(x, y + leftTop)
  ctx.arcTo(x, y, x + leftTop, y, leftTop)
  ctx.closePath()
  ctx.fill()
}

const getText = (type: string) => {
  switch (type) {
    case 'buy':
      return '买入'
    case 'sell':
      return '卖出'
    case 'buyToZero':
      return '平仓买入'
    case 'sellToZero':
      return '平仓卖出'
    default:
      return ''
  }
}

export const backTestMarkFigure: FigureTemplate<BackTestMarkAttrs, BackTestMarkStyles> = {
  name: 'back-test-mark',
  draw: (ctx, attrs, styles) => {
    const { x, y1, y2, type, price, count, line } = attrs
    const { color } = styles
    const fontSize = 12
    ctx.font = `${fontSize}px Arial`
    const title = `${getText(type)} ${count}`
    const priceText = `$ ${price.toFixed(3)}`
    const maxWidth = Math.max(ctx.measureText(title).width, ctx.measureText(priceText).width)
    const padding = [5, 10, 5, 10]

    const height = padding[0] + fontSize + fontSize / 2 + fontSize + padding[2]
    const width = maxWidth + padding[1] + padding[3]
    ctx.save()
    ctx.beginPath()
    // // 虚线
    if (line) {
      ctx.moveTo(x, y1)
      ctx.strokeStyle = '#949596'
      ctx.setLineDash([5, 5])
      ctx.lineTo(x, y2 + (y2 > y1 ? 0 : height))
      ctx.stroke()
    }

    ctx.fillStyle = color
    drawRoundedRect(ctx, x - width / 2, y2 + (y2 > y1 ? 0 : height), width, height, 4)
    ctx.fillStyle = '#fff'
    ctx.font = `${fontSize}px Arial`
    ctx.textBaseline = 'top'
    ctx.fillText(title, x - width / 2 + padding[1], y2 + (y2 > y1 ? 0 : height) + padding[0])
    ctx.fillText(
      priceText,
      x - width / 2 + padding[1],
      y2 + (y2 > y1 ? 0 : height) + padding[0] + fontSize + fontSize / 2
    )

    ctx.restore()
  },
  checkEventOn: () => {
    return false
  }
}

export type BackTestLineAttrs = {
  x1: number
  x2: number
  y: number
  price: number
  profit: number
  count: number
}

export type BackTestLineStyles = {
  color: string
}

export const backTestLineFigure: FigureTemplate<BackTestLineAttrs, BackTestLineStyles> = {
  name: 'back-test-line',
  draw: (ctx, attrs, styles) => {
    const { x1, x2, y, price, count, profit } = attrs
    const { color } = styles
    const fontSize = 14
    ctx.font = `${fontSize}px Arial`
    const leftText = `${count} | ${price.toFixed(3)} `
    const rightText = `${profit.toFixed(3)} USD`
    const padding = [5, 10, 5, 10]
    const width = ctx.measureText(leftText).width + ctx.measureText(rightText).width + padding[1] + padding[3] + 10
    const height = padding[0] + fontSize + padding[2]

    ctx.save()
    ctx.beginPath()

    ctx.moveTo(x1 + width, y)
    ctx.strokeStyle = '#949596'
    ctx.setLineDash([5, 5])
    ctx.lineTo(x2, y)
    ctx.stroke()
    ctx.strokeStyle = 'transparent'
    ctx.fillStyle = '#3861f6'
    drawRoundedRect(ctx, x1, y - height / 2, width, height, 10)
    ctx.fillStyle = '#141519'

    drawRoundedRect(
      ctx,
      x1 + ctx.measureText(leftText).width + padding[1],
      y - height / 2 + padding[0] / 2,
      ctx.measureText(rightText).width + 15,
      height - padding[0] * 2 + padding[0] / 2,
      [0, 4, 4, 0]
    )
    ctx.stroke()
    ctx.closePath()
    ctx.fillStyle = '#fff'

    ctx.fillText(leftText, x1 + padding[3], y - height / 2 + padding[0])
    ctx.fillStyle = color
    ctx.fillText(rightText, x1 + ctx.measureText(leftText).width + padding[1] + padding[3], y - height / 2 + padding[0])

    ctx.restore()
  },
  checkEventOn: () => {
    return false
  }
}
