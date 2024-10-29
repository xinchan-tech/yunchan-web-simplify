import request from "@/utils/request"

/**
 * 大盘指数
 */


type LargeCapIndex = {
  category_name: string
  stocks: LargeCapIndexStock[]
}

type LargeCapIndexStock = {
  name: string
  stock: string[]
  symbol: string
}


export const getLargeCapIndexes = () => {
  return request.get<LargeCapIndex[]>('/index/largeCapIndexes').then(r => r.data)
}