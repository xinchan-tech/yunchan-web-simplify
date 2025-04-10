import { type QuoteBuffer, type StockSubscribeHandler, type SubscribeActionType, stockSubscribe } from '@/utils/stock'
import { useEffect, useMemo, useRef } from 'react'
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

/**
 * 不会发送实际的订阅请求，用来处理收到的数据
 * @param symbols
 * @param handler
 */
export const useStockQuoteSubscribe = (symbols: string[], handler?: (params: QuoteBuffer) => void) => {
  const symbolsMap = useMemo(() => {
    const map = new Set<string>()
    symbols.forEach(symbol => {
      map.add(symbol)
    })
    return map
  }, [symbols])

  useEffect(() => {
    if (!symbolsMap.size) return
    if (!handler) return

    const _handler: (params: QuoteBuffer) => void = e => {
      const r: QuoteBuffer = {}
      Object.keys(e).forEach(key => {
        if(symbolsMap.has(key)) {
          r[key] = e[key]
        }
      })
      handler?.(r)
    }
    const unsubscribe = stockSubscribe.on('quote', _handler)

    return () => {
      unsubscribe()
    }
  }, [symbolsMap, handler])
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
