import { stockSubscribe, type StockSubscribeHandler, type SubscribeActionType } from "@/utils/stock"
import { useEffect } from "react"

/**
 * TODO：处理重复订阅，修改股票数据时会重新订阅，影响性能
 */
const useStockSubscribe = (action: SubscribeActionType, symbols: string[]) => {
  // useEffect(() => {
  //   if(symbols.length === 0) return
  //   const unsubscribe =  stockSubscribe.subscribe(action, symbols)

  //   return unsubscribe
  // }, [action, symbols])
}

export const useStockQuoteSubscribe = (symbols: string[], handler: StockSubscribeHandler<'bar'>) => {
  // useStockSubscribe('quote', symbols)

  // useEffect(() => {
  //   stockSubscribe.on('quote', handler)

  //   return () => {
  //     stockSubscribe.off('quote', handler)
  //   }
  // }, [handler])
}

export const useStockBarSubscribe = (symbols: string[], handler: StockSubscribeHandler<'bar'>) => {
  // useStockSubscribe('bar', symbols)

  // useEffect(() => {
  //   stockSubscribe.on('bar', handler)

  //   return () => {
  //     stockSubscribe.off('bar', handler)
  //   }
  // }, [handler])
}