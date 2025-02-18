import type { StockRawRecord } from '@/api'
import { stockUtils } from './stock'
import { useIndicator } from '@/store'
import { isEmpty, listify } from 'radash'

let coilingModule: Awaited<ReturnType<typeof window.CoilingModule>>
let policyModule: Awaited<ReturnType<typeof window.PolicyModule>>

const getCoilingModule = async () => {
  if (!coilingModule) {
    coilingModule = await window.CoilingModule()
  }

  return coilingModule
}

const getPolicyModule = async () => {
  if (!policyModule) {
    policyModule = await window.PolicyModule()
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
      item.draw_data = drawTextTransform(item.draw_data)
    } else if (item.draw === 'STICKLINE') {
      item.draw_data = drawStickLineTransform(item.draw_data)
    } else if (item.draw === 'DRAWGRADIENT') {
      item.draw_data = drawGradientTransform(item.draw_data)
    } else if (item.draw === 'DRAWICON') {
      item.draw_data = drawIconTransform(item.draw_data)
    } else if (item.draw === 'DRAWBAND') {
      item.draw_data = drawBandTransform(item.draw_data)
    }

    return item
  })

  console.log(result)
  return result
}

const drawTextTransform = (drawData: any) => {
  if (drawData.length <= 0) {
    return drawData
  }

  const [condition, x, text, offsetX, offsetY] = drawData[0]
  const r: any = {}

  Object.entries(drawData).forEach(([key, value]) => {
    if (key === '0') {
      if (condition === 0) {
        return
      }
      r[key] = [x, text, offsetX, -offsetY]
      return
    }

    r[key] = [(value as any)[0], text, offsetX, -offsetY]
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

const drawIconTransform = (drawData: any[]) => {
  if (drawData.length <= 0) {
    return drawData
  }

  const [condition, y, icon, offsetX, offsetY] = drawData[0]

  const r: any = {}

  Object.entries(drawData).forEach(([key, value]) => {
    if (key === '0') {
      if (condition === 0) {
        return
      }
      r[key] = [y, icon, offsetX, -offsetY]
      return
    }

    const typedValue = value as [number]
    r[key] = [typedValue[0], icon, offsetX, -offsetY]
  })

  return r
}

const drawBandTransform = (drawData: Record<string, [number, string, number, string]>) => {
  let polygon: { color: string; points: { y1: number; y2: number; x: number; drawY?: number }[] } = {
    color: '',
    points: []
  }
  const polygons: (typeof polygon)[] = []

  Object.entries(drawData).forEach(([x, [y1, color1, y2, color2]], index, arr) => {
    if (polygon.points.length === 0) {
      polygon.color = y1 >= y2 ? color1 : color2
    }

    polygon.points.push({ y1, y2, x: Number(x) })

    if (polygon.points.length > 1) {
      const currentPoints = polygon.points[polygon.points.length - 1]
      if (currentPoints.y1 === currentPoints.y2) {
        polygons.push(polygon)
        polygon = {
          color: '',
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

        polygons.push(polygon)
        polygon = {
          color: y1 >= y2 ? color1 : color2,
          points: [currentPoints]
        }

        return
      }

      if(arr.length - 1 === index) {
        polygons.push(polygon)
        polygon = {
          color: y1 >= y2 ? color1 : color2,
          points: [currentPoints]
        }

        return
      }
    }
  })

  return polygons
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
