import { type ColumnDef, type ColumnSort, type Row, type SortingState, type TableOptions, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { useMount, useUnmount, useUpdateEffect } from "ahooks"
import { useMemo, useRef, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import { ScrollArea, Skeleton } from "@/components"
import VirtualizedTable from './virtualized-table'
import { cn } from "@/utils/style"
import { nanoid } from "nanoid"
import { appEvent } from "@/utils/event"
import { useDomSize } from "@/hooks"
import { JknTableHeader } from "./table-header"
import { useCellWidth } from "./lib"

export interface JknTableProps<TData extends Record<any, unknown> = Record<string, unknown>, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  rowKey?: string
  loading?: boolean
  manualSorting?: boolean
  onRowClick?: (data: TData, row: Row<TData>) => void
  onSelection?: (params: string[]) => void
  onSortingChange?: (params: ColumnSort) => void
  onEvent?: (arg: { event: string, params: any }) => void
}


const _JknTable = <TData extends Record<string, unknown>, TValue>(props: JknTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const eventTopic = useRef(`table:${nanoid(8)}`)
  const _onSortCHange: TableOptions<TData>['onSortingChange'] = (e) => {
    setSorting(e)
  }

  const _onRowClick = (row: Row<TData>) => {
    props.onRowClick?.(row.original, row)
  }

  useUpdateEffect(() => {
    props.onSortingChange?.(sorting[0] ?? { desc: undefined, id: '' })
  }, [sorting])

  useUpdateEffect(() => {
    props.onSelection?.(Object.keys(rowSelection))
  }, [rowSelection])


  const emitEvent = (arg: { event: string, params: any }) => {
    if (eventTopic.current) {
      appEvent.emit(eventTopic.current as any, arg)
    }
  }

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
    // getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    meta: {
      emit: emitEvent
    }
  })

  useMount(() => {
    if (eventTopic.current) {
      appEvent.on(eventTopic.current as any, (props.onEvent as () => void) ?? (() => { }))
    }
  })

  useUnmount(() => {
    if (eventTopic?.current) {
      appEvent.off(eventTopic.current as any)
    }
  })

  const [size, dom] = useDomSize<HTMLDivElement>()
  const cellWidth = useCellWidth(size?.width, table)
 
  return (
    <div className="w-full h-full border-background border-solid border" ref={dom}>
      {
        cellWidth ? (
          <>
            <JknTableHeader table={table} width={cellWidth} />
            {
              !props.loading ? (
                <>
                  <div className="jkn-table-virtualized-body overflow-hidden" style={{ height: 'calc(100% - 36px)' }}>
                    <div className="overflow-x-hidden overflow-y-auto" style={{ height: '100%' }}>
                      <table className="table-fixed z-0  w-full" cellSpacing={0}>
                        <colgroup>
                          {
                            table.getFlatHeaders().map((header) => (
                              <col key={header.id} style={{ width: cellWidth[header.id] }} />
                            ))
                          }
                        </colgroup>
                        <tbody>
                          {
                            table.getRowModel().rows?.length ? (
                              table.getRowModel().rows.map(row =>
                                <tr
                                  key={row.id}
                                  data-state={row.getIsSelected() && "selected"}
                                  onClick={() => _onRowClick(row)}
                                  onKeyDown={() => { }}
                                  className={cn(
                                    'hover:bg-accent transition-all duration-200 jkn-table-tr',
                                  )}
                                >
                                  {row.getVisibleCells().map((cell) => {
                                    const { align } = cell.column.columnDef.meta ?? {}
                                    return (
                                      <td
                                        key={cell.id}
                                        className="jkn-table-td break-all py-12 h-1"
                                        style={{ textAlign: align as undefined }}
                                      >
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                      </td>
                                    )
                                  })}
                                </tr>
                              )
                            ) : (
                              <tr className="w-full">
                                <td colSpan={props.columns.length} className="h-24 text-center w-full mt-12">
                                  暂无数据
                                </td>
                              </tr>
                            )
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-2 my-2">
                  {
                    Array.from({ length: 8 }).map((_, i) => (
                      // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
                      <Skeleton key={i} className="h-5" />
                    ))
                  }
                </div>
              )
            }
          </>
        ): null
      }
      <style jsx>{
        `
        .jkn-table-td {
          padding: 2px 4px;
          border-width: 0 1px 1px 0;
          border-color: hsl(var(--background));
          border-style: solid;
          box-sizing: border-box;
          font-size: 13px;
        }


        .jkn-table-td:last-child {
          border-right: none;
        }

        .jkn-table-tr:last-child .jkn-table-td {
          border-bottom: none;
        }
        `
      }</style>
    </div>
  )
}

const JknTable = _JknTable as typeof _JknTable & {
  Virtualizer: typeof VirtualizedTable
}
JknTable.Virtualizer = VirtualizedTable



export default JknTable