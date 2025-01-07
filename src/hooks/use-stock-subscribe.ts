import { stockSubscribe, type StockSubscribeHandler, type SubscribeActionType } from "@/utils/stock"
import { useEffect } from "react"
import { useLatest } from "ahooks"

/**
 * compare two string arrays
 */
const compareArray = (arr1: string[], arr2: string[]) => {
  const mapArr1 = arr1.reduce((acc, cur) => {
    acc[cur] = -1
    return acc
  }, {} as Record<string, number>)

  for (const item of arr2) {
    if (mapArr1[item]) {
      mapArr1[item]++
    }else{
      mapArr1[item] = 1
    }
  }

  const r = {
    add: [] as string[],
    remove: [] as string[],
    noChange: [] as string[]
  }

  for (const key in mapArr1) {
    if (mapArr1[key] === -1) {
      r.remove.push(key)
    }else if(mapArr1[key] === 1){
      r.add.push(key)
    }else{
      r.noChange.push(key)
    }
  }

  return r
}

/**
 * TODO：处理重复订阅，修改股票数据时会重新订阅，影响性能
 */
const useStockSubscribe = (action: SubscribeActionType, symbols: string[]) => {
  useEffect(() => {
    if(symbols.length === 0) return
    const unsubscribe =  stockSubscribe.subscribe(action, symbols)

    return unsubscribe
  }, [action, symbols])
}

export const useStockQuoteSubscribe = (symbols: string[], handler: StockSubscribeHandler<'quote'>) => {
  useStockSubscribe('quote', symbols)

  useEffect(() => {
    stockSubscribe.on('quote', handler)
    return () => {
      stockSubscribe.off('quote', handler)
    }
  }, [handler])
}

export const useStockBarSubscribe = (symbols: string[], handler: StockSubscribeHandler<'bar'>) => {
  useStockSubscribe('bar', symbols)

  useEffect(() => {
    stockSubscribe.on('bar', handler)

    return () => {
      stockSubscribe.off('bar', handler)
    }
  }, [handler])
}

