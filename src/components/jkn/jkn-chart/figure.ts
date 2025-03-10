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
  y: number
  date: string
  title: string
}

export const markOverlayFigure: FigureTemplate<MarkOverlayAttrs> = {
  name: 'mark-overlay',
  draw: (ctx, attrs) => {
    const { x, y, date, title } = attrs
    const maxWidth = Math.max(ctx.measureText(date).width, ctx.measureText(title).width)
    const padding = [5, 10, 5, 10]
    const fontSize = 12
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
    ctx.fillRect(x - width / 2, 0, width, height)
    ctx.fillStyle = '#fff'
    ctx.font = `${fontSize}px Arial`
    ctx.textBaseline = 'top'
    ctx.fillText(date, x - width / 2 + padding[1], padding[0])
    // ctx.strokeText(date, x - width / 2 + padding[3], padding[0] + fontSize)

    ctx.fillStyle = '#fff'
    ctx.fillRect(x - width / 2, height, width, height)
    ctx.fillStyle = 'black'
    ctx.fillText(title, x - width / 2 + padding[1], height + padding[0])

    // ctx.strokeText(title, x - width / 2 + padding[3], height + padding[0] + fontSize)

    ctx.closePath()
    ctx.restore()
  },
  checkEventOn: (coordinate, attrs) => {
    const { x, y } = coordinate
    const { y: y1 } = attrs
    return y >= y1 && y <= y1 && x !== undefined
  }
}

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

export const backTestMarkFigure: FigureTemplate<BackTestMarkAttrs, BackTestMarkStyles> = {
  name: 'back-test-mark',
  draw: (ctx, attrs, styles) => {
    const { x, y1, y2, type, price, count, line } = attrs
    const { color } = styles
    const fontSize = 12
    ctx.font = `${fontSize}px Arial`
    const title = `${type === 'buy' ? '买入' : '卖出'} ${count}`
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
    console.log(x1, x2)
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
