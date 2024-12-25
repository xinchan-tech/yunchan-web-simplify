import { Skeleton } from "@/components"
import { useDomSize } from "@/hooks"
import { type ColumnDef, type ColumnSort, type Row, type SortingState, type TableOptions, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { useVirtualizer } from '@tanstack/react-virtual'
import { useUpdateEffect } from "ahooks"
import { type CSSProperties, useRef, useState } from "react"
import { useCellWidth, useTableEvent } from "./lib"
import { JknTableHeader } from "./table-header"

export interface JknTableProps<TData extends Record<string, unknown> = Record<string, unknown>, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  rowKey?: string
  loading?: boolean
  onRowClick?: (data: TData, row: Row<TData>) => void
  onSelection?: (params: string[]) => void
  onSortingChange?: (params: ColumnSort) => void
  manualSorting?: boolean
  style?: CSSProperties
  className?: string
  rowHeight?: number
  onEvent?: (arg: { event: string, params: any }) => void
}

const VirtualizedTable = <TData extends Record<string, unknown>, TValue>({ className, style, ...props }: JknTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const _onSortCHange: TableOptions<TData>['onSortingChange'] = (e) => {
    setSorting(e)
  }

  useUpdateEffect(() => {
    props.onSortingChange?.(sorting[0] ?? { desc: undefined, id: '' })
  }, [sorting])

  useUpdateEffect(() => {
    props.onSelection?.(Object.keys(rowSelection))
  }, [rowSelection])

  const emitEvent = useTableEvent(props.onEvent)

  const table = useReactTable({
    columns: props.columns,
    data: props.data,
    state: {
      sorting,
      rowSelection,
    },
    getRowId: (row) => row[props.rowKey ?? 'id'] as string,
    enableMultiSort: false,
    enableSorting: true,
    sortDescFirst: true,
    manualSorting: props.manualSorting,
    onSortingChange: _onSortCHange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    meta: {
      emit: (...args) => emitEvent.current?.(...args)
    }
  })

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => props.rowHeight ?? 44, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => scrollRef.current,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' &&
        navigator.userAgent.indexOf('Firefox') === -1
        ? element => element?.getBoundingClientRect().height
        : undefined,
    overscan: 10,
  })

  const _onRowClick = (row: Row<TData>) => {
    props.onRowClick?.(row.original, row)
    // setRowClick(rowClick !== undefined ? undefined : row.original[props.rowKey ?? 'id'] as string | number)
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const [size, dom] = useDomSize<HTMLDivElement>()

  const cellWidth = useCellWidth(size?.width, table)

  return (
    <div className="jkn-table-virtualized overflow-hidden h-full flex flex-col" ref={dom}>
      {
        cellWidth ? (
          <>
            <JknTableHeader table={table} width={cellWidth} />
            {
              !props.loading ? (
                <div className="jkn-table-virtualized-body overflow-y-auto overflow-x-hidden flex-1" ref={scrollRef}>
                  <table className="table-fixed grid relative z-0" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                    <tbody>
                      {
                        table.getRowModel().rows?.length ? (
                          rowVirtualizer.getVirtualItems().map(virtualRow => {
                            const row = rows[virtualRow.index] as Row<TData>
                            return (
                              <tr
                                data-index={virtualRow.index}
                                key={row.id}
                                data-state={row.getIsSelected() && "selected"}
                                ref={node => rowVirtualizer.measureElement(node)}
                                onClick={() => _onRowClick(row)}
                                onKeyDown={() => { }}
                                className="hover:bg-accent transition-all duration-200 flex absolute w-full z-0"
                                style={{
                                  transform: `translateY(${virtualRow.start}px)` //this should always be a `style` as it changes on scroll
                                }}
                              >
                                {row.getVisibleCells().map((cell) => {
                                  const { align } = cell.column.columnDef.meta ?? {}
                                  return (
                                    <td key={cell.id} className="jkn-table-virtualized-td" style={{ width: cellWidth[cell.column.id] ?? 120 }}>
                                      <div className="w-full" style={{ textAlign: align as undefined, }}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                      </div>
                                    </td>
                                  )
                                })}
                              </tr>
                            )
                          })
                        ) : (
                          <tr className="flex">
                            <td colSpan={props.columns.length} className="h-24 text-center w-full mt-12">
                              暂无数据
                            </td>
                          </tr>
                        )
                      }
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="space-y-2 my-2">
                  {
                    Array.from({ length: 8 }).map((_, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      <Skeleton key={i} className="h-6" />
                    ))
                  }
                </div>
              )
            }
          </>
        ) : null
      }
      <style jsx>{
        `
        .jkn-table-virtualized-td {
          display: flex;
          align-items: center;
          padding: 0 4px;
          border-width: 0 1px 1px 0;
          border-color: hsl(var(--background));
          border-style: solid;
          box-sizing: border-box;
          font-size: 13px;
        }

        .jkn-table-virtualized-td:last-child {
          border-right: none;
        `
      }</style>
    </div>
  )
}


export default VirtualizedTable