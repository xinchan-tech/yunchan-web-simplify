import { isNumber } from 'radash'
import { useCallback, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useStockQuoteSubscribe } from './use-stock-subscribe'
import type { QuoteBuffer } from '@/utils/stock'

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
  const initList = useRef<T[]>([])
  const lastOrder = useRef<{ field?: keyof T; order?: 'asc' | 'desc' }>({ field: undefined, order: undefined })

  const _setList = useCallback((data: T[]) => {
    initList.current = [...data]

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
      return sortData(s, columnKey, order)
    })
  }, [])

  return [list, { setList: _setList, onSort, updateList }] as const
}

export const useTableSortDataWithWs = <T extends Record<string, any>>(
  data: T[],
  options: {
    transform?: (data: T) => T
  }
) => {
  const { transform } = options
  const [list, setList] = useState<T[]>(data)
  const initList = useRef<T[]>([])
  const lastOrder = useRef<{ field?: keyof T; order?: 'asc' | 'desc' }>({ field: undefined, order: undefined })
  const listOrderByRowKey = useRef<T[]>([])

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

  const onSort = useCallback(
    (columnKey: keyof T, order: 'asc' | 'desc' | undefined) => {
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
    },
    []
  )

  useStockQuoteSubscribe(
    symbols,
    useCallback(
      (e: QuoteBuffer) => {
        if (!lastOrder.current.order || !lastOrder.current.field) return
        // const field = lastOrder.current.field
        // Object.keys(e).forEach(item => {
        //   const v = initList.current.find((v: any) => item === (v[key] as string)) as any

        //   if (!v) return

        //   if (field === 'percent') {
        //     v[field as any] = e[item].record.changePercent
        //   } else {
        //     if ((e[item].record as any)[field] === undefined) return

        //     v[field as any] = (e[item].record as any)[field]
        //   }
        // })

        // if (Date.now() - lastSortTime.current > 2000) {
        //   lastSortTime.current = Date.now()
        //   setList(() => {
        //     const r = sortData(initList.current, field, lastOrder.current.order!)
        //     keysSort.current = r.map(o => o[key as string])
        //     return r
        //   })
        // }
      },
      []
    )
  )

  return [list, { setList: _setList, onSort, updateList }] as const
}

export const useTableRowClickToStockTrading = (symbolField: string, _interval?: number) => {
  const navigate = useNavigate()
  return useCallback(
    (record: any) => {
      return {
        onClick: () => navigate(`/stock?symbol=${record[symbolField]}`)
      }
    },
    [symbolField, navigate]
  )
}
