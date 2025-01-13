import { useDomSize } from "@/hooks"
import type { TableProps } from "rc-table"
import Table, { VirtualTable } from "rc-table"
import type { DefaultRecordType } from "rc-table/lib/interface"
import { withSort } from "../jkn-icon/with-sort"
import { memo, useCallback, useMemo, type ReactNode } from "react"
import { useImmer } from "use-immer"
import { Skeleton } from "@/components/ui/skeleton"

export interface JknRcTableProps<T = any> extends TableProps<T> {
  headerHeight?: number
  isLoading?: boolean
  virtual?: boolean
  onSort?: (columnKey: keyof T, order: 'asc' | 'desc' | undefined) => void
}


const _JknRcTable = <T extends DefaultRecordType = any>({ headerHeight = 35, columns, emptyText, isLoading, virtual, ...props }: JknRcTableProps<T>) => {
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
      {
        virtual ? (
          <VirtualTable columns={_columns} scroll={{ y: size?.height ? (size?.height - headerHeight) : 0, x: size?.width ? size?.width - 1 : 0 }}
            rowHoverable={false}
            emptyText={
              isLoading ? (
                <div className="space-y-2 my-2">
                  <Loading />
                </div>
              ) : (emptyText ? emptyText: null)
            }
            getContainerWidth={(ele, width) => {
              // Minus border
              const { borderInlineStartWidth } = getComputedStyle(ele.querySelector('.rc-table-tbody')!);
              const mergedWidth = width - Number.parseInt(borderInlineStartWidth, 10);
              return mergedWidth;
            }}
            {...props} />
        ) : (
          <Table columns={_columns} scroll={{ y: size?.height ? (size?.height - headerHeight) : size?.height }}
            rowHoverable={false}
            emptyText={
              isLoading ? (
                <div className="space-y-2 my-2">
                  <Loading />
                </div>
              ) : (emptyText ? emptyText: null)
            }

            {...props} />
        )
      }
    </div>
  )
}

export const JknRcTable = _JknRcTable as typeof _JknRcTable

// JknRcTable.Virtual = VirtualTable



const Loading = memo(() => (
  Array.from({ length: 8 }).map((_, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
    <Skeleton key={i} className="h-5" />
  ))
))

export const SortTitle = withSort(({ children }: { children: ReactNode }) => <span>{children}</span>)