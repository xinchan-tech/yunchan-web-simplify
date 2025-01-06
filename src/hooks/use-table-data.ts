import { useCallback, useRef, useState } from 'react'

export const useTableData = <T extends Record<string, any>>(data: T[], orderKey: string) => {
  const [list, setList] = useState<T[]>(data)
  const listOrder = useRef<(keyof T)[]>([])

  const _setList = useCallback(
    (data: T[]) => {
      setList(data)
      listOrder.current = data.map(item => item[orderKey!])
    },
    [orderKey]
  )

  const updateList = useCallback((data: T[]) => {
    setList(data)
  }, [])

  const onSort = useCallback((columnKey: keyof T, order: 'asc' | 'desc' | undefined) => {
    if (!order) {
      setList(s => {
        const _s = listOrder.current.map(key => {
          return s.find(item => item[orderKey!] === key)
        })
        return _s as T[]
      })
    }

    setList(s => {
      s.sort((a, b) => {
        if (order === 'asc') {
          return a[columnKey] - b[columnKey]
        }
        if (order === 'desc') {
          return b[columnKey] - a[columnKey]
        }
        return 0
      })

      return [...s]
    })
  }, [orderKey])

  return [list, { setList: _setList, onSort, updateList }] as const
}
