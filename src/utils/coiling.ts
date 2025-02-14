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
      item.draw_data = drawTextConvert(item.draw_data)
    } else if (item.draw === 'STICKLINE') {
      item.draw_data = drawStickLineConvert(item.draw_data)
    } else if (item.draw === 'DRAWGRADIENT') {
      item.draw_data = drawGradientConvert(item.draw_data)
    }

    return item
  })

  console.log(result)
  return result
}

const drawTextConvert = (drawData: any) => {
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
      r[key] = [x, text, offsetX, offsetY]
      return
    }

    r[key] = [(value as any)[0], text, offsetX, offsetY]
  })

  return r
}

const drawStickLineConvert = (drawData: any) => {
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

const drawGradientConvert = (drawData: ([number] | [number, string, string, string, string, number])[]) => {
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
