import type { StockRawRecord } from '@/api'
import { stockUtils } from './stock'
import { useIndicator } from '@/store'
import { isEmpty, listify } from 'radash'

/**
 * 计算缠论数据
 * @param data
 *
 * @example @/example/coiling-wasm/coiling.html
 */
export const calcCoiling = async (data: StockRawRecord[], interval: number) => {
  return window.CoilingModule().then(module => {
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
  const module = await window.PolicyModule()

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
      if (item.draw_data.length <= 0) {
        return item
      }

      const [condition, text] = item.draw_data[0]

      const r: any = {}

      Object.entries(item.draw_data).forEach(([key, value]) => {
        if (key === '0' && condition === 0) {
          return
        }

        const typedValue = value as [number, number]
        r[key] = [typedValue[0], text]
      })
   
      item.draw_data = r
    }

    return item
  })
  console.log(result)
  return result

  // return window.PolicyModule().then(module => {
  //   const _data = data.map((item: StockRawRecord) => {
  //     return [Math.floor(stockUtils.parseTime(item[0]) / 1000), ...item.slice(1)] as unknown as StockRawRecord
  //   }, true)
  //   const indicator = useIndicator.getState().getIndicatorQueryParams(fml.indicatorId)
  //   if (!isEmpty(indicator)) {
  //     fml.formula = listify(indicator, (k, v) => `${k}:=${v};`).join('') + fml.formula
  //   }

  //   const r =  module.policy_execute(fml, _data, interval)

  // }).then(r => {
  //   console.log('id', fml.indicatorId, '\nfml', fml, '\ncandlesticks', data, '\ninterval', interval, '\nresult', r)
  //   return r
  // })
}
