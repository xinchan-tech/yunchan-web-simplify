import type { StockRawRecord } from "@/api"
import { stockUtils } from "./stock"

/**
 * 计算缠论数据
 * @param data 
 * 
 * @example @/example/coiling-wasm/coiling.html
 */
export const calcCoiling = async (data: StockRawRecord[], interval: number) => {
  return window.CoilingModule().then((module) => {
    const _data = data.map((item: StockRawRecord) => {
      return [Math.floor(stockUtils.parseTime(item[0]) / 1000), ...item.slice(1)] as unknown as StockRawRecord
    }, true)
    return module.coiling_calculate(_data, data.length, interval)
  })
}
