import { JknRcTableProps } from '@/components'
import { router } from '@/router'
import { isFunction, isNumber } from 'radash'
import { useCallback, useMemo, useRef, useState } from 'react'

type OrderKey<T = any> = keyof T | ((arg: T) => string)

const convertToNumber = (data: any) => {
  if (isNumber(data)) {
    return data
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

export const useTableData = <T extends Record<string, any>>(data: T[], orderKey: OrderKey<T>) => {
  const [list, setList] = useState<T[]>(data)
  const initOrderKey = useRef<(keyof T)[]>([])
  const lastOrderKey = useRef<(keyof T)[]>([])

  const _orderKey = useRef(orderKey)

  const getOrderKey = useCallback((item: T) => {
    if (isFunction(_orderKey.current)) {
      return _orderKey.current(item)
    }

    return item[_orderKey.current]
  }, [])

  const _setList = useCallback(
    (data: T[]) => {
      initOrderKey.current = data.map(getOrderKey)
      setList(data)
      // if(lastOrderKey.current.length) {
      //   const _s = lastOrderKey.current.map(key => {
      //     return data.find(item =>
      //       getOrderKey(item) === key
      //     )
      //   })

      //   setList(_s as T[])
      // }else{

      // }
    },
    [getOrderKey]
  )

  const updateList = useCallback(setList, [])

  const onSort = useCallback(
    (columnKey: keyof T, order: 'asc' | 'desc' | undefined) => {
      if (!order) {
        setList(s => {
          const _s = initOrderKey.current.map(key => {
            return s.find(item => getOrderKey(item) === key)
          })
          lastOrderKey.current = []
          return _s as T[]
        })
      }

      setList(s => {
        s.sort((a, b) => {
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

        lastOrderKey.current = s.map(getOrderKey)
        return [...s]
      })
    },
    [getOrderKey]
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
