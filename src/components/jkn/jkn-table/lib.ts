import type { Table } from '@tanstack/react-table'
import { useUpdateEffect } from 'ahooks'
import { useMemo, useRef } from 'react'

export const useCellWidth = (width: number | undefined, table: Table<any>) => {
  const headers = table.getFlatHeaders().filter(i => !i.isPlaceholder && i.subHeaders.length === 0)

  return useMemo<NormalizedRecord<number> | undefined>(() => {
    if (!width) {
      return undefined
    }
    const r = {} as NormalizedRecord<number>

    const autoHeaders: typeof headers = []
    let totalWidth = 0
    headers.forEach(header => {
      const metaWidth = header.column.columnDef.meta?.width
      if (metaWidth) {
        if (typeof metaWidth === 'number') {
          r[header.id] = metaWidth
          totalWidth += metaWidth
        } else if (typeof metaWidth === 'string' && metaWidth.endsWith('%')) {
          r[header.id] = (width * Number.parseFloat(metaWidth)) / 100
          totalWidth += r[header.id]
        } else {
          autoHeaders.push(header)
        }
      } else {
        autoHeaders.push(header)
      }
    })

    const remainWidth = width - totalWidth

    autoHeaders.forEach(header => {
      r[header.id] = remainWidth / autoHeaders.length
    })

    return r
  }, [width, headers])
}

export const useTableEvent = (handler?: (...arg: any[]) => void) => {
  const eventHandler = useRef(handler)

  useUpdateEffect(() => {
    eventHandler.current = handler
  }, [handler])

  return eventHandler
}
