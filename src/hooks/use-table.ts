import { router } from '@/router'
import { isFunction, isNumber } from 'radash'
import { useCallback, useRef, useState } from 'react'

type OrderKey<T = any> = keyof T | ((arg: T) => string)

const convertToNumber = (data: any) => {
  if (isNumber(data)) {
    return data
  }

  if (data === undefined) {
    return -Number.NEGATIVE_INFINITY
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

const setDataOnIdle = <T extends any[] = any[]>(data: T, setFn: (data: T) => void, count: number) => {
  const splitLength = 40

  const split = data.slice(0, splitLength * count) as T

  setFn(split)

  if (split.length >= data.length) {
    return
  }

  requestAnimationFrame(() => {
    setDataOnIdle(data, setFn, count + 1)
  })
}

const sortData = <T extends Record<string, any>>(s: T[], columnKey: keyof T, order: 'asc' | 'desc') => {
  const _s = [...s]
  _s.sort((a, b) => {
    const _a = convertToNumber(a[columnKey])
    const _b = convertToNumber(b[columnKey])

    if (Number.isNaN(_a) || Number.isNaN(_b)) {
      return compareString(a[columnKey], b[columnKey], order!)
    }
    if (order === 'asc') {
      return a[columnKey] - b[columnKey]
    }
    if (order === 'desc') {
      return b[columnKey] - a[columnKey]
    }

    return 0
  })

  return _s
}

export const useTableData = <T extends Record<string, any>>(data: T[], _?: OrderKey<T>) => {
  const [list, setList] = useState<T[]>(data)
  const initList = useRef<T[]>([])
  const lastOrder = useRef<{ field?: keyof T; order?: 'asc' | 'desc' }>({ field: undefined, order: undefined })

  // const _orderKey = useRef(orderKey)

  // const getOrderKey = useCallback((item: T) => {
  //   if (isFunction(_orderKey.current)) {
  //     return _orderKey.current(item)
  //   }

  //   return item[_orderKey.current]
  // }, [])

  const _setList = useCallback(
    (data: T[]) => {
      initList.current = [...data]

      if (lastOrder.current.field && lastOrder.current.order) {
        setList(sortData(data, lastOrder.current.field, lastOrder.current.order))
      } else {
        setList(data)
      }
    },
    []
  )

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
        return sortData(s, columnKey, order)
      })
    },
    []
  )

  return [list, { setList: _setList, onSort, updateList }] as const
}

export const useTableRowClickToStockTrading = (symbolField: string) => {
  return useCallback(
    (record: any) => {
      return {
        onDoubleClick: () => router.navigate(`/stock/trading?symbol=${record[symbolField]}`)
      }
    },
    [symbolField]
  )
}
