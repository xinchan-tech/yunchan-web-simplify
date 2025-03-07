import { type StockSubscribeHandler, type SubscribeActionType, stockSubscribe } from '@/utils/stock'
import { useEffect, useRef } from 'react'

const useStockSubscribe = (action: SubscribeActionType, symbols: string[]) => {
  useEffect(() => {
    if (symbols.length === 0) return
    const unsubscribe = stockSubscribe.subscribe(action, symbols)

    return unsubscribe
  }, [action, symbols])
}

export const useStockQuoteSubscribe = (symbols: string[], handler?: StockSubscribeHandler<'quote'>) => {
  useStockSubscribe('quote', symbols)
  const handlerRef = useRef(handler ?? (() => {}))

  useEffect(() => {
    handlerRef.current = handler ?? (() => {})

    return () => {
      handlerRef.current = () => {}
    }
  }, [handler])

  useEffect(() => {
    const unSubscribe = stockSubscribe.on('quote', d => {
      handlerRef.current(d)
    })

    return () => {
      unSubscribe()
    }
  }, [])
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
