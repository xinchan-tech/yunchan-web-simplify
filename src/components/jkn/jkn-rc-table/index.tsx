import { useDomSize } from "@/hooks"
import type { TableProps } from "rc-table"
import Table from "rc-table"
import type { DefaultRecordType } from "rc-table/lib/interface"
import { withSort } from "../jkn-icon/with-sort"
import { useCallback, useMemo, type ReactNode } from "react"
import { useImmer } from "use-immer"

export interface JknRcTableProps<T = any> extends TableProps<T> {
  headerHeight?: number
  onSort?: (columnKey: keyof T, order: 'asc' | 'desc' | undefined) => void
}


export const JknRcTable = <T extends DefaultRecordType = any>({ headerHeight = 35, columns, ...props }: JknRcTableProps<T>) => {
  const [size, dom] = useDomSize<HTMLDivElement>()
  const [sort, setSort] = useImmer<{ columnKey: keyof T | undefined, order: 'asc' | 'desc' | undefined }>({
    columnKey: undefined,
    order: undefined
  })

  const onSort = useCallback((columnKey: keyof T, order: 'asc' | 'desc' | undefined) => {
    setSort(draft => {
      draft.columnKey = columnKey as any
      draft.order = order
    })
    props.onSort?.(columnKey, order)
  }, [props.onSort, setSort])

  const _columns = useMemo(() => {
    if (!columns) return columns

    return columns.map(column => {
      if ((column as any).sort && !(column as any).children) {
        return {
          ...column,
          title: <SortTitle onSort={onSort} sort={sort.columnKey === (column as any).dataIndex ? sort.order : undefined} field={(column as any).dataIndex}>{column.title}</SortTitle>
        }
      }
      return column
    })
  }, [columns, sort, onSort])

  return (
    <div className="jkn-rc-table overflow-hidden h-full" ref={dom} >
      <Table columns={_columns} scroll={{ y: size?.height ? (size?.height - headerHeight) : size?.height }} {...props} />
    </div>
  )
}

export const SortTitle = withSort(({ children }: { children: ReactNode }) => <span>{children}</span>)