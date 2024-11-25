import request from "@/utils/request"
import type { StockRawRecord } from "./stock"
import { useStock } from "@/store"

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


export const getLargeCapIndexes = async () => {
  const r = await request.get<LargeCapIndex[]>('/index/largeCapIndexes').then(r => r.data)
  for (const s of r) {
    useStock.getState().insertRawByRecords(s.stocks)
  }
  return r
}
getLargeCapIndexes.cacheKey = 'index:largeCapIndexes'

