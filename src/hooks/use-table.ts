import type { QuoteBuffer, StockSubscribeHandler } from '@/utils/stock'
import { isNumber } from 'radash'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useLatestRef } from './use-latest-ref'
import { useStockQuoteSubscribe } from './use-stock-subscribe'

type OrderKey<T = any> = keyof T | ((arg: T) => string)

const convertToNumber = (data: any, order: 'asc' | 'desc') => {
  if (isNumber(data)) {
    return data
  }

  if (data === undefined) {
    return order === 'asc' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY
  }

  return Number.parseFloat(data)
}

const compareString = (a: string, b: string, order: 'asc' | 'desc') => {
  if (order === 'asc') {
    return a.localeCompare(b)
  }
  if (order === 'desc') {
    return b.localeCompare(a)
  }
  return 0
}

const sortData = <T extends Record<string, any>>(s: T[], columnKey: keyof T, order: 'asc' | 'desc') => {
  const _s = [...s]

  _s.sort((a, b) => {
    const _a = convertToNumber(a[columnKey], order)
    const _b = convertToNumber(b[columnKey], order)

    if (!isNumber(_a) || !isNumber(_b)) {
      return compareString(a[columnKey], b[columnKey], order!)
    }

    if (order === 'asc') {
      return _a - _b
    }
    if (order === 'desc') {
      return _b - _a
    }

    return 0
  })

  return _s
}

export const useTableData = <T extends Record<string, any>>(data: T[], _?: OrderKey<T>) => {
  const [list, setList] = useState<T[]>(data)
  const listLast = useLatestRef(list)
  const initList = useRef<T[]>([])
  const lastOrder = useRef<{ field?: keyof T; order?: 'asc' | 'desc' }>({ field: undefined, order: undefined })

  const _setList = useCallback(
    (cb: T[] | ((d: T[]) => T[])) => {
      let data: typeof cb = cb
      if (typeof cb === 'function') {
        data = cb(listLast.current)
      } else {
        data = cb
      }
      initList.current = [...data]

      if (lastOrder.current.field && lastOrder.current.order) {
        setList(sortData(data, lastOrder.current.field, lastOrder.current.order))
      } else {
        setList(data)
      }
    },
    [listLast]
  )

  const updateList = useCallback(setList, [])

  const onSort = useCallback((columnKey: keyof T, order: 'asc' | 'desc' | undefined) => {
    if (!order) {
      lastOrder.current = { field: undefined, order: undefined }
      setList([...initList.current])
      return
    }

    lastOrder.current = { field: columnKey, order }
    setList(s => {
      return sortData(s, columnKey, order)
    })
  }, [])

  const cleanSort = useCallback(() => {
    lastOrder.current = { field: undefined, order: undefined }
  }, [])

  return [list, { setList: _setList, onSort, updateList, cleanSort }] as const
}

type SortTableType = {
  symbol: string
  [key: string]: any
}

export type SortTableDataTransform<T extends SortTableType> = (
  src: T,
  data: Parameters<StockSubscribeHandler<'quoteTopic'>>[0]
) => T

export const useTableSortDataWithWs = <T extends SortTableType>(
  data: T[],
  options: {
    transform: SortTableDataTransform<T>
  }
) => {
  const [list, setList] = useState<T[]>(data)
  const initList = useRef<T[]>([])
  const lastOrder = useRef<{ field?: keyof T; order?: 'asc' | 'desc' }>({ field: undefined, order: undefined })
  const listOrderByRowKey = useRef<T[]>([])
  const lastSortTime = useRef(0)

  const symbols = useMemo(() => {
    return Array.from(new Set(list.map(item => item.symbol)))
  }, [list])

  const _setList = useCallback((data: T[]) => {
    initList.current = [...data]
    listOrderByRowKey.current = sortData(data, 'symbol', 'asc')

    if (lastOrder.current.field && lastOrder.current.order) {
      setList(sortData(data, lastOrder.current.field, lastOrder.current.order))
    } else {
      setList(data)
    }
  }, [])

  const updateList = useCallback(setList, [])

  const onSort = useCallback((columnKey: keyof T, order: 'asc' | 'desc' | undefined) => {
    if (!order) {
      lastOrder.current = { field: undefined, order: undefined }
      setList([...initList.current])
      return
    }

    lastOrder.current = { field: columnKey, order }
    setList(s => {
      const r = sortData(s, columnKey, order)
      return r
    })
  }, [])

  useStockQuoteSubscribe(
    symbols,
    useCallback(
      (e: QuoteBuffer) => {
        if (!lastOrder.current.order || !lastOrder.current.field) return
        const field = lastOrder.current.field

        Object.keys(e).forEach(item => {
          const index = binarySearch(listOrderByRowKey.current, item)

          if (index === -1) return

          listOrderByRowKey.current[index] = options.transform(listOrderByRowKey.current[index], e[item])
        })

        if (Date.now() - lastSortTime.current > 2000) {
          lastSortTime.current = Date.now()
          setList(() => {
            return sortData(listOrderByRowKey.current, field, lastOrder.current.order!)
          })
        }
      },
      [options.transform]
    )
  )

  return [list, { setList: _setList, onSort, updateList }] as const
}

export const useTableRowClickToStockTrading = (symbolField: string, _interval?: number) => {
  const navigate = useNavigate()
  return useCallback(
    (record: any) => {
      return {
        onClick: () => navigate(`/app/stock?symbol=${record[symbolField]}`)
      }
    },
    [symbolField, navigate]
  )
}

/**
 * 二分法查找symbol的index
 */
export const binarySearch = (list: SortTableType[], symbol: string) => {
  let low = 0
  let high = list.length - 1

  while (low <= high) {
    const mid = Math.floor((low + high) / 2)
    if (list[mid].symbol === symbol) {
      return mid
    }

    if (list[mid].symbol < symbol) {
      low = mid + 1
    } else {
      high = mid - 1
    }
  }

  return -1
}
