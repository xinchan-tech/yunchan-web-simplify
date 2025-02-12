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
    }else if(item.draw === 'STICKLINE'){
      item.draw_data = drawStickLineConvert(item.draw_data)
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

  const [condition, text] = drawData[0]

  const r: any = {}

  Object.entries(drawData).forEach(([key, value]) => {
    if (key === '0' && condition === 0) {
      return
    }

    const typedValue = value as [number, number]
    r[key] = [typedValue[0], text]
  })

  return r
}

const drawStickLineConvert = (drawData: any) => {
  if (drawData.length <= 0) {
    return drawData
  }

  const [condition, width, empty] = drawData[0]

  const r: any = {}

  Object.entries(drawData).forEach(([key, value]) => {
    if (key === '0' && condition === 0) {
      return
    }

    const typedValue = value as [number, number]
    r[key] = [typedValue[0], typedValue[1], width, empty]
  })

  return r
}