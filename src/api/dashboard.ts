import request from "@/utils/request"
import type { StockRawRecord } from "./stock"

/**
 * 大盘指数
 */


type LargeCapIndex = {
  category_name: string
  stocks: LargeCapIndexStock[]
}

type LargeCapIndexStock = {
  name: string
  stock: StockRawRecord
  symbol: string
}


export const getLargeCapIndexes = () => {
  return request.get<LargeCapIndex[]>('/index/largeCapIndexes').then(r => r.data)
}
getLargeCapIndexes.cacheKey = 'index:largeCapIndexes'

