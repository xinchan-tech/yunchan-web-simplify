import type { StockRawRecord } from '@/api'
import { stockUtils } from './stock'
import { useIndicator } from '@/store'
import { isEmpty, listify } from 'radash'

let coilingModule: ReturnType<typeof window.CoilingModule>
let policyModule: ReturnType<typeof window.PolicyModule>

const getCoilingModule = async () => {
  if (!coilingModule) {
    coilingModule = window.CoilingModule()
  }

  return coilingModule
}

const getPolicyModule = async () => {
  if (!policyModule) {
    policyModule = window.PolicyModule()
  }

  return policyModule
}

/**
 * 计算缠论数据
 * @param data
 *
 * @example @/example/coiling-wasm/coiling.html
 */
export const calcCoiling = async (data: StockRawRecord[], interval: number) => {
  return getCoilingModule().then(module => {
    const _data = data.map((item: StockRawRecord) => {
      return [Math.floor(stockUtils.parseTime(item[0]) / 1000), ...item.slice(1)] as unknown as StockRawRecord
    }, true)
    return module.coiling_calculate(_data, data.length, interval)
  })
}

/**
 * 计算指标
 */
export const calcIndicator = async (
  fml: { formula: string; symbal: string; indicatorId: string },
  data: StockRawRecord[],
  interval: number
) => {
  const module = await getPolicyModule()
  // console.log(data)
  const rawData = data.map((item: StockRawRecord) => {
    return [Math.floor(stockUtils.parseTime(item[0]) / 1000), ...item.slice(1)] as unknown as StockRawRecord
  }, true)

  const indicator = useIndicator.getState().getIndicatorQueryParams(fml.indicatorId)

  if (!isEmpty(indicator)) {
    fml.formula = listify(indicator, (k, v) => `${k}:=${v};`).join('') + fml.formula
  }

  const result = await module.policy_execute(fml, rawData, interval)

  result.data = result.data.map(item => {
    if (item.draw === 'DRAWTEXT') {
      item.draw_data = drawTextTransform(data, item.draw_data)
    } else if (item.draw === 'STICKLINE') {
      item.draw_data = drawStickLineTransform(item.draw_data)
    } else if (item.draw === 'DRAWGRADIENT') {
      item.draw_data = drawGradientTransform(item.draw_data)
    } else if (item.draw === 'DRAWICON') {
      item.draw_data = drawIconTransform(data, item.draw_data)
    } else if (item.draw === 'DRAWBAND') {
      item.draw_data = drawBandTransform(data, item.draw_data)
    } else if (item.draw === 'DRAWNUMBER') {
      item.draw_data = drawNumberTransform(data, item.draw_data)
    } else if (item.draw === '') {
      item.data = drawLineTransform(data, item.data)
    }

    return item
  })

  console.log(result)
  return result
}

const drawLineTransform = (candlesticks: StockRawRecord[], drawData: [number | null][]) => {
  return drawData.map((item, index) => [candlesticks[index][2]!, item])
}

const drawTextTransform = (candlesticks: StockRawRecord[], drawData: any) => {
  if (drawData.length <= 0) {
    return drawData
  }
  // console.log(drawData)
  const [condition, y, text, offsetX, offsetY] = drawData[0]
  const r: {
    x: number
    y: number
    drawY: number
    text: string
    offsetX: number
    offsetY: number
  }[] = []

  Object.entries(drawData).forEach(([key, value]) => {
    const candlestick = candlesticks[Number(key)]

    if (key === '0') {
      if (condition === 0) {
        return
      }
      r.push({ x: 0, y: candlestick[2]!, text: text, offsetX: offsetX, offsetY: -offsetY, drawY: y })
      return
    }

    const typedValue = value as [number]
    r.push({
      x: Number(key),
      y: candlestick[2]!,
      text: text,
      offsetX: offsetX,
      offsetY: -offsetY,
      drawY: typedValue[0]
    })
  })

  return r
}

const drawStickLineTransform = (drawData: any) => {
  if (drawData.length <= 0) {
    return drawData
  }

  const [condition, y1, y2, width, empty] = drawData[0]

  const r: any = {}

  Object.entries(drawData).forEach(([key, value]) => {
    if (key === '0') {
      if (condition === 0) {
        return
      }
      r[key] = [y1, y2, width, empty]
      return
    }

    const typedValue = value as [number, number]
    r[key] = [typedValue[0], typedValue[1], width, empty]
  })

  return r
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
          node.drawY1 =
            point.drawY || point.y1
          node.drawY2 =
            point.drawY || point.y2
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
