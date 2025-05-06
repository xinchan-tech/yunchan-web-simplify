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
  | IndicatorDataHorizontalLine
  | IndicatorDataHdlyLabel
  | IndicatorDataDrawPipe

export type IndicatorDataType<T extends DrawFunc> = IndicatorData & { draw: T }

type DrawFunc =
  | ''
  | 'STICKLINE'
  | 'DRAWTEXT'
  | 'DRAWGRADIENT'
  | 'DRAWNUMBER'
  | 'DRAWRECTREL'
  | 'DRAWICON'
  | 'DRAWBAND'
  | 'HORIZONTALLINE'
  | 'HDLY_LABEL'
  | 'DRAWPIPE'

type IndicatorDataBase<T extends DrawFunc> = {
  draw: T
  color: string | string[]
  width: number
  name?: string
  lineType: 'POINTDOT' | 'SOLID' | 'DASH' | 'CIRCLEDOT' | 'DOTLINE' | '' | 'NODRAW'
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
    color?: string
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
  drawData: {
    x1: number
    y1: number
    x2: number
    y2: number
    color: [string, string]
    points: {
      x: number
      y: number
      offsetY: number
    }[]
  }[]
}
type IndicatorDataDrawNumber = IndicatorDataBase<'DRAWNUMBER'> & {
  drawData: {
    x: number
    y: number
    number: number
    offsetX: number
    offsetY: number
  }[]
}
type IndicatorDataDrawBand = IndicatorDataBase<'DRAWBAND'> & {
  drawData: {
    color: string
    startIndex: number
    endIndex: number
    points: { y1: number; y2: number; x: number; drawY: number; drawX: number }[]
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
  drawData: {
    x: number
    y: number
    width: number
    height: number
    color: string
  }[]
}
type IndicatorDataDrawIcon = IndicatorDataBase<'DRAWICON'> & {
  drawData: {
    x: number
    y: number
    icon: number
    offsetX: number
    offsetY: number
  }[]
}
type IndicatorDataHorizontalLine = IndicatorDataBase<'HORIZONTALLINE'> & {
  drawData: number[]
}
type IndicatorDataHdlyLabel = IndicatorDataBase<'HDLY_LABEL'> & {
  drawData: {
    color: string
    x: number
    y: number
    text: string
  }[]
}

type IndicatorDataDrawPipe = IndicatorDataBase<'DRAWPIPE'> & {
  drawData: {
    width: number
    y: number
    height: number
    position: 'right' | 'left'
    empty: boolean
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
      offsetY: -offsetY
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

export const drawGradientTransform = (raw: IndicatorRawData) => {
  if (raw.draw !== 'DRAWGRADIENT') return raw
  const drawData = raw.draw_data as any
  if (drawData.length <= 0) {
    return raw
  }

  const gradients: IndicatorDataDrawGradient['drawData'] = []

  Object.entries(drawData).forEach(([_, value]) => {
    if ((value as any[]).length < 2) {
      return
    }
    const points: { x: number; y: number; offsetY: number }[] = []
    const [x, y1, y2, color1, color2] = value as [number, string, string, string, string, number]
    let maxY = Number.NEGATIVE_INFINITY
    let minY = Number.POSITIVE_INFINITY
    let len = 0

    y1.split(',').forEach((y, i) => {
      const _y = Number.parseFloat(y)
      points.push({ x: i + x, y: _y, offsetY: 0 })
      maxY = Math.max(maxY, _y)
      minY = Math.min(minY, _y)
      len++
    })

    const y2Points = y2.split(',').map((y, i) => {
      const _y = Number.parseFloat(y)
      maxY = Math.max(maxY, _y)
      minY = Math.min(minY, _y)
      return { x: x + i, y: _y, offsetY: 0 }
    })

    /**
     * 处理前交叉点
     */
    const previousPoints = points.slice(0, 2)
    const previousY2Points = y2Points.slice(0, 2)

    if (previousPoints.length === 2 && previousY2Points.length === 2) {
      const intersection = getIntersection(
        [previousPoints[0].x, previousPoints[0].y],
        [previousPoints[1].x, previousPoints[1].y],
        [previousY2Points[0].x, previousY2Points[0].y],
        [previousY2Points[1].x, previousY2Points[1].y]
      )

      if (intersection) {
        const [, y] = intersection
        points[0].offsetY = y - points[0].y
        y2Points[0].offsetY = y - y2Points[0].y
      }
    }

    /**
     * 处理后交叉点
     */
    const lastPoints = points.slice(-2)
    const lastY2Points = y2Points.slice(-2)

    if (lastPoints.length === 2 && lastY2Points.length === 2) {
      const intersection = getIntersection(
        [lastPoints[0].x, lastPoints[0].y],
        [lastPoints[1].x, lastPoints[1].y],
        [lastY2Points[0].x, lastY2Points[0].y],
        [lastY2Points[1].x, lastY2Points[1].y]
      )

      if (intersection) {
        const [, y] = intersection
        points[points.length - 1].offsetY = y - points[points.length - 1].y
        y2Points[y2Points.length - 1].offsetY = y - y2Points[y2Points.length - 1].y
      }
    }

    y2Points.reverse()
    points.push(...y2Points)
    // console.log(points)
    
    // gradients.push([x, x + len, minY, maxY, points, color1, color2])
    gradients.push({ x1: x, y1: minY, x2: x + len, y2: maxY, color: [color1, color2], points })
  })

  raw.draw_data = gradients

  return raw
}

export const drawIconTransform = (raw: IndicatorRawData) => {
  if (raw.draw !== 'DRAWICON') return raw
  if (!raw.draw_data) return raw

  const [condition, y, icon, offsetX, offsetY] = raw.draw_data[0]

  const r: {
    x: number
    y: number
    icon: number
    offsetX: number
    offsetY: number
  }[] = []

  Object.entries(raw.draw_data).forEach(([key, value]) => {
    if (key === '0') {
      if (condition === 0) {
        return
      }
      r[key] = { x: 0, y: y, icon: icon, offsetX: offsetX, offsetY: -offsetY }
      return
    }

    const typedValue = value as [number]
    r.push({
      x: Number(key),
      y: typedValue[0],
      icon: icon,
      offsetX: offsetX,
      offsetY: -offsetY
    })
  })
  raw.draw_data = r
  return raw
}

export const drawBandTransform = (raw: IndicatorRawData) => {
  if (raw.draw !== 'DRAWBAND') return raw
  if (!raw.draw_data) return raw
  let polygon: ArrayItem<IndicatorDataDrawBand['drawData']> = {
    color: '',
    endIndex: 0,
    startIndex: 0,
    points: []
  }
  const polygons: (typeof polygon)[] = []

  Object.entries(raw.draw_data).forEach(([x, [y1, color1, y2, color2]], index, arr) => {
    if (polygon.points.length === 0) {
      polygon.color = y1 >= y2 ? color1 : color2
    }

    polygon.points.push({ y1, y2, x: Number(x), drawY: 0, drawX: 0 })

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

        const drawPoint = getIntersection(
          [line1[0], line1[1]],
          [line1[2], line1[3]],
          [line2[0], line2[1]],
          [line2[2], line2[3]]
        )

        if (drawPoint) {
          currentPoints.drawY = drawPoint[1]
          currentPoints.drawX = drawPoint[0]
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

  raw.draw_data = polygons

  return raw
}

const getIntersection = (
  s1p1: [number, number],
  s1p2: [number, number],
  s2p1: [number, number],
  s2p2: [number, number]
): [number, number] | null => {
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
    const x = x1 + t * (x2 - x1)
    const y = y1 + t * (y2 - y1)
    return [x, y]
  }

  return null
}

export const drawNumberTransform = (raw: IndicatorRawData) => {
  if (raw.draw !== 'DRAWNUMBER') return raw
  if (!raw.draw_data) return raw

  raw.draw_data = Object.entries(raw.draw_data).map(([key, value]) => {
    const typedValue = value as [number, number, number, number]

    return {
      x: Number(key),
      y: typedValue[0],
      number: typedValue[1],
      offsetX: typedValue[2],
      offsetY: -typedValue[3]
    }
  })

  return raw
}

export const drawRectRelTransform = (raw: IndicatorRawData) => {
  if (raw.draw !== 'DRAWRECTREL') return raw
  if (!raw.draw_data) return raw

  raw.draw_data = Object.values(raw.draw_data).map(item => {
    return {
      x: item[0],
      y: item[1],
      width: item[2],
      height: item[3],
      color: item[4]
    }
  })

  return raw
}

export const drawPipeTransform = (raw: IndicatorRawData) => {
  if (raw.draw !== 'DRAWPIPE') return raw
  if (!raw.draw_data) return raw

  raw.draw_data = Object.values(raw.draw_data).map(([y1, y2, width, pos, type]) => {
    return {
      y: y2,
      height: y2 - y1,
      width,
      position: pos === 0 ? 'right' : 'left',
      empty: type === 1
    }
  })

  return raw
}
