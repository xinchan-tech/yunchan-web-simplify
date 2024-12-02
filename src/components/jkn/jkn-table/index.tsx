import { type ColumnDef, type ColumnSort, type Row, type SortingState, type TableOptions, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { useMount, useUnmount, useUpdateEffect } from "ahooks"
import { useRef, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import JknIcon from "../jkn-icon"
import { Skeleton } from "@/components"
import VirtualizedTable from './virtualized-table'
import { cn } from "@/utils/style"
import { nanoid } from "nanoid"
import { appEvent } from "@/utils/event"

export interface JknTableProps<TData extends Record<string, unknown> = Record<string, unknown>, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  rowKey?: string
  loading?: boolean
  manualSorting?: boolean
  onRowClick?: (data: TData, row: Row<TData>) => void
  onSelection?: (params: string[]) => void
  onSortingChange?: (params: ColumnSort) => void
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  onEvent?: (arg: { event: string, params: any }) => void
}

const SortUp = () => <JknIcon name="ic_btn_up" className="w-2 h-4" />
const SortDown = () => <JknIcon name="ic_btn_down" className="w-2 h-4" />
const SortNone = () => <JknIcon name="ic_btn_nor" className="w-2 h-4" />

const _JknTable = <TData extends Record<string, unknown>, TValue>(props: JknTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [rowClick, setRowClick] = useState<string | number>()
  const eventTopic = useRef(`table:${nanoid(8)}`)
  const _onSortCHange: TableOptions<TData>['onSortingChange'] = (e) => {
    setSorting(e)
  }

  const _onRowClick = (row: Row<TData>) => {
    props.onRowClick?.(row.original, row)
    setRowClick(rowClick !== undefined ? undefined : row.original[props.rowKey ?? 'id'] as string | number)
  }

  useUpdateEffect(() => {
    props.onSortingChange?.(sorting[0] ?? { desc: undefined, id: '' })
  }, [sorting])

  useUpdateEffect(() => {
    props.onSelection?.(Object.keys(rowSelection))
  }, [rowSelection])

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  const emitEvent = (arg: { event: string, params: any }) => {
    if (eventTopic.current) {
      appEvent.emit(eventTopic.current, arg)
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
    getSortedRowModel: getSortedRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    meta: {
      emit: emitEvent
    }
  })

  useMount(() => {
    if (eventTopic.current) {
      appEvent.on(eventTopic.current, (props.onEvent as () => void) ?? (() => { }))
    }
  })

  useUnmount(() => {
    if (eventTopic?.current) {
      appEvent.off(eventTopic.current)
    }
  })


  return (
    <div className="w-full">
      <Table className="w-full mt-[-1px] table-fixed" >
        <TableHeader className="sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="w-fit">
              {headerGroup.headers.map((header) => {
                const { align, width } = header.column.columnDef.meta ?? {}
                return (
                  <TableHead  key={header.id} style={{ width: width || header.getSize() }} >
                    {header.isPlaceholder
                      ? null
                      : (
                        <div className="inline-flex items-center w-full space-x-1">
                          {/* biome-ignore lint/suspicious/noExplicitAny: <explanation> */}
                          <div className="flex-1" style={{ textAlign: align as any }}>
                            {
                              flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )
                            }
                          </div>
                          {
                            header.column.getCanSort() && (
                              <div onClick={header.column.getToggleSortingHandler()} onKeyDown={() => { }}>
                                {{
                                  asc: <SortUp />,
                                  desc: <SortDown />,
                                }[header.column.getIsSorted() as string] ?? <SortNone />}
                              </div>
                            )
                          }
                        </div>
                      )
                    }
                  </TableHead>
                )
              })}
            </TableRow>
          ))}
        </TableHeader>
        {
          !props.loading ? (
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => _onRowClick(row)}
                    className={cn(
                      'hover:bg-accent transition-all duration-200',
                      rowClick === row.original[props.rowKey ?? 'id'] && '!bg-accent'
                    )}
                  >
                    {row.getVisibleCells().map((cell) => {
                      const { align } = cell.column.columnDef.meta ?? {}
                      return (
                        <TableCell key={cell.id} style={{ textAlign: align as any }}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      )
                    })}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={props.columns.length} className="h-24 text-center">
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={props.columns.length} className="h-24 text-center">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              </TableRow>
            </TableBody>
          )
        }
      </Table>
    </div>
  )
}

const JknTable = _JknTable as typeof _JknTable & {
  Virtualizer: typeof VirtualizedTable
}
JknTable.Virtualizer = VirtualizedTable



export default JknTable