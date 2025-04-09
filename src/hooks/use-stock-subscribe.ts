import { type StockSubscribeHandler, type SubscribeActionType, stockSubscribe } from '@/utils/stock'
import { useEffect, useRef } from 'react'
import { useLatestRef } from './use-latest-ref'
import { useUnmount } from 'ahooks'

const useStockSubscribe = (action: SubscribeActionType, symbols: string[]) => {
  useEffect(() => {
    if (symbols.length === 0) return
    const unsubscribe = stockSubscribe.subscribe(action, symbols)

    return () => {
      unsubscribe()
    }
  }, [action, symbols])
}

export const useStockQuoteSubscribe = (symbols: string[], handler?: StockSubscribeHandler<'quote'>) => {
  // useStockSubscribe('quote', symbols)
  // const handlerRef = useRef(handler ?? (() => {}))
  // useEffect(() => {
  //   handlerRef.current = handler ?? (() => {})
  //   return () => {
  //     handlerRef.current = () => {}
  //   }
  // }, [handler])
  // useEffect(() => {
  //   const unSubscribe = stockSubscribe.on('quote', d => {
  //     handlerRef.current(d)
  //   })
  //   return () => {
  //     unSubscribe()
  //   }
  // }, [])
}

export const useStockBarSubscribe = (symbols: string[], handler: StockSubscribeHandler<'bar'>) => {
  useStockSubscribe('bar', symbols)

  const renderFn = useLatestRef(handler)

  useEffect(() => {
    const cancel = stockSubscribe.on('bar', renderFn.current)

    return cancel
  }, [renderFn])
}

export const useSnapshot = (symbol: string, handler: StockSubscribeHandler<'snapshot'>) => {
  const unSubscribe = useRef<() => void>()

  useEffect(() => {
    if (!symbol) return
    unSubscribe.current = stockSubscribe.snapshot(symbol)
  }, [symbol])

  useEffect(() => {
    const cancel = stockSubscribe.on('snapshot', handler)

    return cancel
  }, [handler])

  useUnmount(() => {
    unSubscribe.current?.()
  })
}

export const useSnapshotOnce = (symbol: string, handler: StockSubscribeHandler<'snapshot'>) => {
  const once = useRef(0)
  const unSubscribe = useRef<() => void>()
  const unSubscribeHandler = useRef<() => void>()

  useEffect(() => {
    if (!symbol) return
    const unsubscribe = stockSubscribe.snapshot(symbol)
    unSubscribe.current = unsubscribe
    once.current = 0
  }, [symbol])

  useEffect(() => {
    if (once.current) return
    const _handler: StockSubscribeHandler<'snapshot'> = e => {
      if (e.data.symbol !== symbol) return
      once.current = 1
      handler(e)
    }
    const cancel = stockSubscribe.on('snapshot', _handler)
    unSubscribeHandler.current = cancel

    return cancel
  }, [handler, symbol])

  useUnmount(() => {
    unSubscribe.current?.()
  })
}
