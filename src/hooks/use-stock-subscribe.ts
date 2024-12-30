import { stockSubscribe, type StockSubscribeHandler, type SubscribeActionType } from "@/utils/stock"
import { useEffect } from "react"

const useStockSubscribe = (action: SubscribeActionType, symbols: string[]) => {
  useEffect(() => {
    const unsubscribe =  stockSubscribe.subscribe(action, symbols)

    return unsubscribe
  }, [action, symbols])
}

export const useStockQuoteSubscribe = (symbols: string[]) => {
  return useStockSubscribe('quote', symbols)
}

export const useStockBarSubscribe = (symbols: string[], handler: StockSubscribeHandler) => {
  useStockSubscribe('bar', symbols)

  useEffect(() => {
    stockSubscribe.on('bar', handler)

    return () => {
      stockSubscribe.off('bar', handler)
    }
  }, [handler])
}