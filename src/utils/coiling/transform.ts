import type { StockRawRecord } from '@/api'

/**
 * 指标数据
 */
export type IndicatorRawData = {
  color: string
  data?: any[]
  draw_data?: any[]
  draw?: string
  linethick: number
  name: string
  style_type?: string
}

export type IndicatorData =
  | IndicatorDataLine
  | IndicatorDataDrawGradient
  | IndicatorDataDrawStickLine
  | IndicatorDataDrawText
  | IndicatorDataDrawNumber
  | IndicatorDataDrawRectRel
  | IndicatorDataDrawIcon
  | IndicatorDataDrawBand

type DrawFunc = '' | 'STICKLINE' | 'DRAWTEXT' | 'DRAWGRADIENT' | 'DRAWNUMBER' | 'DRAWRECTREL' | 'DRAWICON' | 'DRAWBAND'
type IndicatorDataBase<T extends DrawFunc> = {
  draw: T
  color: string
  width: number
  name?: string
  lineType: string
}

type IndicatorDataLine = IndicatorDataBase<''> & {
  drawData: number[]
}
type IndicatorDataDrawStickLine = IndicatorDataBase<'STICKLINE'> & {
  drawData: {
    x: number
    y1: number
    y2: number
    width: number
    empty: number
  }[]
}
type IndicatorDataDrawText = IndicatorDataBase<'DRAWTEXT'> & {
  drawData: {
    x: number
    y: number
    text: string
    offsetX: number
    offsetY: number
  }[]
}
/**
 * 一个渐变的多边形
 * 值类型为 [startX, endX, minY, maxY, [number, number][], color1, color2]
 * startX: 多边形起始x轴坐标
 * endX: 多边形结束x轴坐标
 * minY: 多边形最小y轴坐标
 * maxY: 多边形最大y轴坐标
 * [number, number][]: 多边形的点，每个点是一个数组，第一个元素是x轴坐标，第二个元素是y轴坐标
 * color1: 颜色1
 * color2: 颜色2
 */
type IndicatorDataDrawGradient = IndicatorDataBase<'DRAWGRADIENT'> & {
  drawData: [number, number, number, number, [number, number][], string, string][]
}
type IndicatorDataDrawNumber = IndicatorDataBase<'DRAWNUMBER'> & {
  drawData: {
    x: number
    y: number
    drawY: number
    number: number
    offsetX: number
    offsetY: number
  }[]
}
type IndicatorDataDrawBand = IndicatorDataBase<'DRAWBAND'> & {
  drawData: {
    polygonIndex: number
    x: number
    y: number
    polygon?: {
      color: string
      points: {
        x: number
        drawY: number
      }[]
    }
  }[]
}
/**
 * 一个固定位置的矩形
 * 值类型为 [leftTopX, leftTopY, rightBottomX, rightBottomY, color]
 * leftTopX: 矩形左上角x轴坐标
 * leftTopY: 矩形左上角y轴坐标
 * rightBottomX: 矩形右下角x轴坐标
 * rightBottomY: 矩形右下角y轴坐标
 * color: 颜色
 */
type IndicatorDataDrawRectRel = IndicatorDataBase<'DRAWRECTREL'> & {
  drawData: Record<number, [number, number, number, number, string]>
}
type IndicatorDataDrawIcon = IndicatorDataBase<'DRAWICON'> & {
  drawData: {
    x: number
    y: number
    drawY: number
    icon: number
    offsetX: number
    offsetY: number
  }[]
}

export const drawLineTransform = (raw: IndicatorRawData) => {
  if (raw.draw === '') {
    raw.draw_data = raw.data
  }

  return raw
}

export const drawTextTransform = (raw: IndicatorRawData) => {
  if (raw.draw !== 'DRAWTEXT') return raw
  if (raw.draw_data!.length <= 0) return raw

  const drawData = raw.draw_data as [number, number, string, number, number][]
  const [condition, y, text, offsetX, offsetY] = drawData[0]
  const r: IndicatorDataDrawText['drawData'] = []

  Object.entries(drawData).forEach(([key, value]) => {
    if (key === '0') {
      if (condition === 0) {
        return
      }
      r.push({ x: 0, y, text: text, offsetX: offsetX, offsetY: -offsetY })
      return
    }

    const typedValue = value as unknown as [number]
    r.push({
      x: Number(key),
      y: typedValue[0],
      text: text,
      offsetX: offsetX,
      offsetY: -offsetY,
    })
  })

  raw.draw_data = r
  return raw
}

export const drawStickLineTransform = (raw: IndicatorRawData) => {
  if (raw.draw !== 'STICKLINE') return raw
  if (raw.draw_data!.length <= 0) return raw

  /**
   * index = 0 时, [condition, y1, y2, width, empty]
   *   当condition === 0时, 第0个不绘制
   *   当 empty === 1 时， 画空心
   * index > 0 时, [y1, y2]
   */
  const drawData = raw.draw_data as any
  const [condition, y1, y2, width, empty] = drawData[0] as [number, number, number, number, number]

  const r: IndicatorDataDrawStickLine['drawData'] = []

  Object.entries(drawData).forEach(([key, value]) => {
    if (key === '0') {
      if (condition === 0) {
        return
      }
      r.push({ x: +key, y1, y2, width, empty })
      return
    }

    const typedValue = value as [number, number]
    r.push({ x: +key, y1: typedValue[0], y2: typedValue[1], width, empty })
  })
  raw.draw_data = r
  return raw
}

const drawGradientTransform = (drawData: ([number] | [number, string, string, string, string, number])[]) => {
  if (drawData.length <= 0) {
    return drawData
  }

  const gradients: [number, number, number, number, [number, number][], string, string][] = []

  Object.entries(drawData).forEach(([_, value]) => {
    if (value.length < 2) {
      return
    }
    const points: [number, number][] = []
    const [x, y1, y2, color1, color2] = value as [number, string, string, string, string, number]
    let maxY = Number.NEGATIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let len = 0

    y1.split(',').forEach((y, i) => {
      const _y = Number.parseInt(y)
      points.push([x + i, _y])
      maxY = Math.max(maxY, _y)
      minY = Math.min(minY, _y)
      len++
    })

    const y2Points = y2.split(',').map((y, i) => {
      const _y = Number.parseInt(y)
      maxY = Math.max(maxY, _y)
      minY = Math.min(minY, _y)
      return [x + i, _y]
    }) as [number, number][]
    y2Points.reverse()
    points.push(...y2Points)

    gradients.push([x, x + len, minY, maxY, points, color1, color2])
  })

  return gradients
}

const drawIconTransform = (candlesticks: StockRawRecord[], drawData: any[]) => {
  if (drawData.length <= 0) {
    return drawData
  }
  // console.log(drawData)
  const [condition, y, icon, offsetX, offsetY] = drawData[0]

  const r: {
    x: number
    y: number
    drawY: number
    icon: number
    offsetX: number
    offsetY: number
  }[] = []

  Object.entries(drawData).forEach(([key, value]) => {
    const candlestick = candlesticks[Number(key)]

    if (key === '0') {
      if (condition === 0) {
        return
      }
      r[key] = { x: 0, y: candlestick[2]!, icon: icon, offsetX: offsetX, offsetY: -offsetY, drawY: y }
      return
    }

    const typedValue = value as [number]
    r.push({
      x: Number(key),
      y: candlestick[2]!,
      icon: icon,
      offsetX: offsetX,
      offsetY: -offsetY,
      drawY: typedValue[0]
    })
  })

  return r
}

const drawBandTransform = (
  candlesticks: StockRawRecord[],
  drawData: Record<string, [number, string, number, string]>
) => {
  let polygon: {
    color: string
    startIndex: number
    endIndex: number
    points: { y1: number; y2: number; x: number; drawY: number }[]
  } = {
    color: '',
    endIndex: 0,
    startIndex: 0,
    points: []
  }
  const polygons: (typeof polygon)[] = []

  Object.entries(drawData).forEach(([x, [y1, color1, y2, color2]], index, arr) => {
    if (polygon.points.length === 0) {
      polygon.color = y1 >= y2 ? color1 : color2
    }

    polygon.points.push({ y1, y2, x: Number(x), drawY: 0 })

    if (polygon.points.length > 1) {
      const currentPoints = polygon.points[polygon.points.length - 1]
      if (currentPoints.y1 === currentPoints.y2) {
        polygon.endIndex = +x
        polygons.push(polygon)
        polygon = {
          color: '',
          endIndex: +x,
          startIndex: +x,
          points: []
        }

        return
      }

      const lastPoints = polygon.points[polygon.points.length - 2]
      const lastDirection = lastPoints.y1 >= lastPoints.y2 ? 1 : -1
      const currentDirection = currentPoints.y1 >= currentPoints.y2 ? 1 : -1

      /**
       * 当前方向与上一个方向不一致时， 两条线有交叉，计算交叉点
       */
      if (lastDirection !== currentDirection) {
        const line1 = [lastPoints.x, lastPoints.y1, currentPoints.x, currentPoints.y1]

        const line2 = [lastPoints.x, lastPoints.y2, currentPoints.x, currentPoints.y2]

        const drawY = getIntersectionY(
          [line1[0], line1[1]],
          [line1[2], line1[3]],
          [line2[0], line2[1]],
          [line2[2], line2[3]]
        )

        if (drawY) {
          currentPoints.drawY = drawY
        }
        polygon.endIndex = +x
        polygons.push(polygon)
        polygon = {
          startIndex: +x,
          endIndex: +x,
          color: y1 >= y2 ? color1 : color2,
          points: [currentPoints]
        }

        return
      }

      if (arr.length - 1 === index) {
        polygon.endIndex = +x
        polygons.push(polygon)
        polygon = {
          startIndex: +x,
          endIndex: +x,
          color: y1 >= y2 ? color1 : color2,
          points: [currentPoints]
        }

        return
      }
    }
  })

  const result: {
    polygonIndex: number
    x: number
    y1: number
    y2: number
    drawY1: number
    drawY2: number
    polygon?: {
      color: string
      points?: {
        x: number
        drawY: number
      }[]
    }
  }[] = []

  candlesticks.forEach((candlestick, index) => {
    const node: ArrayItem<typeof result> = {
      polygonIndex: -1,
      x: index,
      y1: candlestick[2]!,
      y2: candlestick[2]!,
      drawY1: -1,
      drawY2: -1
    }
    for (let i = 0; i < polygons.length; i++) {
      const polygon = polygons[i]
      if (polygon.startIndex <= index && polygon.endIndex >= index) {
        node.polygonIndex = polygon.startIndex
        const point = polygon.points[index - polygon.startIndex]

        if (point) {
          node.drawY1 = point.drawY || point.y1
          node.drawY2 = point.drawY || point.y2
        }
      }
      if (polygon.startIndex === index) {
        const leftPoints: { x: number; drawY: number }[] = []
        const rightPoints: { x: number; drawY: number }[] = []

        polygon.points.forEach(point => {
          leftPoints.push({ x: point.x, drawY: point.drawY || point.y1 })
          rightPoints.unshift({ x: point.x, drawY: point.drawY || point.y2 })
        })

        node.polygon = {
          color: polygon.color,
          points: leftPoints.concat(rightPoints)
        }
      }
    }

    result.push(node)
  })

  return result
}

const getIntersectionY = (
  s1p1: [number, number],
  s1p2: [number, number],
  s2p1: [number, number],
  s2p2: [number, number]
): number | null => {
  const [x1, y1] = s1p1
  const [x2, y2] = s1p2
  const [x3, y3] = s2p1
  const [x4, y4] = s2p2

  const a1 = x2 - x1
  const b1 = -(x4 - x3)
  const c1 = x3 - x1

  const a2 = y2 - y1
  const b2 = -(y4 - y3)
  const c2 = y3 - y1

  const denominator = a1 * b2 - a2 * b1

  if (denominator === 0) {
    return null // 线段平行或重合，无交点
  }

  const t = (c1 * b2 - c2 * b1) / denominator
  const u = (a1 * c2 - a2 * c1) / denominator

  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    const y = y1 + t * (y2 - y1)
    return y
  }

  return null // 交点不在线段上
}

const drawNumberTransform = (candlesticks: StockRawRecord[], drawData: any[]) => {
  if (drawData.length <= 0) {
    return drawData
  }

  return Object.entries(drawData).map(([key, value]) => {
    const candlestick = candlesticks[Number(key)]

    const typedValue = value as [number, number, number, number]

    return {
      x: Number(key),
      y: candlestick[2]!,
      number: typedValue[1],
      offsetX: typedValue[2],
      offsetY: -typedValue[3],
      drawY: typedValue[0]
    }
  })
}
