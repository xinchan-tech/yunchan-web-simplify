import type { StockRawRecord } from '@/api'
import { stockUtils } from '../stock'

let coilingModule: ReturnType<typeof window.CoilingModule>

const getCoilingModule = async () => {
  if (!coilingModule) {
    coilingModule = window.CoilingModule()
  }

  return coilingModule
}

/**
 * 计算缠论数据
 * @param data
 *
 * @example @/example/coiling-wasm/coiling.html
 */
export const calcCoiling = async (data: StockRawRecord[], interval: number): Promise<CoilingData> => {

  return getCoilingModule().then(module => {
    console.log(module)
    // const _data = data.map((item: StockRawRecord) => {
    //   return [Math.floor(stockUtils.parseTime(item[0]) / 1000), ...item.slice(1)] as unknown as StockRawRecord
    // }, true)
    // console.log(_data)
    // return module.coiling_calculate(_data, data.length, interval)
  }).catch(r => {
    console.log(r)
  })
}
