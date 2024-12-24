import type { Table } from "@tanstack/react-table"
import { useMemo } from "react"

export const useCellWidth = (width: number | undefined, table: Table<any>) => useMemo<NormalizedRecord<number>>(() => {
  if (!width) {
    return {}
  }
  const r = {} as NormalizedRecord<number>
  const headers = table.getFlatHeaders()
  const autoHeaders: typeof headers = []
  let totalWidth = 0
  headers.forEach(header => {
    const metaWidth = header.column.columnDef.meta?.width
    if (metaWidth) {
      if (typeof metaWidth === 'number') {
        r[header.id] = metaWidth
        totalWidth += metaWidth
      } else if (typeof metaWidth === 'string' && metaWidth.endsWith('%')) {
        r[header.id] = width * Number.parseFloat(metaWidth) / 100
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
}, [width, table.getFlatHeaders])