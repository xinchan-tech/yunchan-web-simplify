import { stockSubscribe, type SubscribeBarType, type SubscribeQuoteType, type SubscribeSnapshotType, SubscribeTopic } from '@/utils/stock'
import { useUnmount } from 'ahooks'
import { useEffect, useMemo, useRef } from 'react'
import { useLatestRef } from './use-latest-ref'

const useStockSubscribe = (action: SubscribeTopic, symbols: string[]) => {
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
export const useStockQuoteSubscribe = (symbols: string[], handler?: (params: Record<string, SubscribeQuoteType>) => void) => {
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

    const _handler: (params: Record<string, SubscribeQuoteType>) => void = e => {
      const r: Record<string, SubscribeQuoteType> = {}
      Object.keys(e).forEach(key => {
        if (symbolsMap.has(key)) {
          r[key] = e[key]
        }
      })
      handler?.(r)
    }
    const unsubscribe = stockSubscribe.on(SubscribeTopic.Quote, _handler)

    return () => {
      unsubscribe()
    }
  }, [symbolsMap, handler])
}

export const useStockBarSubscribe = (symbols: string[], handler: (data: SubscribeBarType) => void) => {
  useStockSubscribe(SubscribeTopic.Bar, symbols)

  const renderFn = useLatestRef(handler)

  useEffect(() => {
    const cancel = stockSubscribe.on(SubscribeTopic.Bar, renderFn.current)

    return cancel
  }, [renderFn])
}

export const useSnapshot = (symbol: string, handler: (data: SubscribeSnapshotType) => void) => {
  const unSubscribe = useRef<() => void>()

  useEffect(() => {
    if (!symbol) return
    unSubscribe.current = stockSubscribe.subscribe(SubscribeTopic.Snapshot, [symbol])

    return () => {
      unSubscribe.current?.()
    }
  }, [symbol])

  useEffect(() => {
    const cancel = stockSubscribe.on(SubscribeTopic.Snapshot, handler)

    return cancel
  }, [handler])

  useUnmount(() => {
    stockSubscribe.unsubscribeSnapshot()
  })
}

export const useSnapshotOnce = (symbol: string, handler: (data: SubscribeSnapshotType) => void) => {
  const once = useRef(0)
  const unSubscribe = useRef<() => void>()
  const unSubscribeHandler = useRef<() => void>()

  useEffect(() => {
    if (!symbol) return
    const unsubscribe = stockSubscribe.subscribe(SubscribeTopic.Snapshot, [symbol])
    unSubscribe.current = unsubscribe
    once.current = 0

    return () => {
      unsubscribe()
    }
  }, [symbol])

  useEffect(() => {
    if (once.current) return
    const _handler: (data: SubscribeSnapshotType) => void = e => {
      if (e.data.symbol !== symbol) return
      once.current = 1
      handler(e)
    }
    const cancel = stockSubscribe.on(SubscribeTopic.Snapshot, _handler)
    unSubscribeHandler.current = cancel

    return cancel
  }, [handler, symbol])

  useUnmount(() => {
    stockSubscribe.unsubscribeSnapshot()
  })
}
