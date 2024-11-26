import { type ColumnDef, type ColumnSort, type Row, type SortingState, type TableOptions, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { useMount, useUnmount, useUpdateEffect } from "ahooks"
import { type CSSProperties, useRef, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import JknIcon from "../jkn-icon"
import { ScrollArea, Skeleton } from "@/components"
import { cn } from "@/utils/style"
import { useVirtualizer } from '@tanstack/react-virtual'
import { appEvent } from "@/utils/event"
import { nanoid } from "nanoid"

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
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  onEvent?: (arg: { event: string, params: any }) => void
}

const SortUp = () => <JknIcon name="ic_btn_up" className="w-2 h-4" />
const SortDown = () => <JknIcon name="ic_btn_down" className="w-2 h-4" />
const SortNone = () => <JknIcon name="ic_btn_nor" className="w-2 h-4" />

const VirtualizedTable = <TData extends Record<string, unknown>, TValue>({ className, style, ...props }: JknTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  const [rowClick, setRowClick] = useState<string | number>()

  const _onSortCHange: TableOptions<TData>['onSortingChange'] = (e) => {
    setSorting(e)
  }

  useUpdateEffect(() => {
    props.onSortingChange?.(sorting[0] ?? { desc: undefined, id: '' })
  }, [sorting])

  useUpdateEffect(() => {
    props.onSelection?.(Object.keys(rowSelection))
  }, [rowSelection])

  const eventTopic = useRef(`table:${nanoid(8)}`)
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

  const { rows } = table.getRowModel()

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 44, //estimate row height for accurate scrollbar dragging
    getScrollElement: () => scrollRef.current?.querySelector('[data-radix-scroll-area-viewport]') ?? null,
    //measure dynamic row height, except in firefox because it measures table border height incorrectly
    measureElement:
      typeof window !== 'undefined' &&
        navigator.userAgent.indexOf('Firefox') === -1
        ? element => element?.getBoundingClientRect().height
        : undefined,
    overscan: 20,
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

  const _onRowClick = (row: Row<TData>) => {
    props.onRowClick?.(row.original, row)
    setRowClick(rowClick !== undefined ? undefined : row.original[props.rowKey ?? 'id'] as string | number)
  }

  const scrollRef = useRef<HTMLDivElement>(null)

  return (
    <ScrollArea ref={scrollRef} className={cn('w-full relative', className)} style={style}>
      <Table className="w-full mt-[-1px] grid">
        <TableHeader className="sticky top-0 z-10 grid">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id} className="flex w-full">
              {headerGroup.headers.map((header) => {
                const { align, width } = header.column.columnDef.meta ?? {}
                return (
                  <TableHead key={header.id} className="flex flex-shrink-0" style={{
                    width: width === 'full' ? 'auto' : (width || header.column.getSize()),
                    minWidth: 0,
                    flexGrow: width === 'full' ? 1 : undefined,
                    flexShrink: width === 'full' ? 1 : undefined
                  }} >
                    {header.isPlaceholder
                      ? null
                      : (
                        <div className="flex items-center w-full space-x-1">
                          <div className="flex-1" style={{ textAlign: align as undefined }}>
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
            <TableBody className="grid relative z-0" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
              {table.getRowModel().rows?.length ? (
                rowVirtualizer.getVirtualItems().map(virtualRow => {
                  const row = rows[virtualRow.index] as Row<TData>

                  return (
                    <TableRow
                      data-index={virtualRow.index}
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      ref={node => rowVirtualizer.measureElement(node)}
                      onClick={() => _onRowClick(row)}
                      className="bg-muted hover:bg-accent transition-all duration-200 flex absolute w-full z-0"
                      style={{
                        transform: `translateY(${virtualRow.start}px)` //this should always be a `style` as it changes on scroll
                      }}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const { align, width } = cell.column.columnDef.meta ?? {}
                        return (
                          <TableCell className="flex items-center flex-shrink-0" key={cell.id} style={{
                            textAlign: align as undefined, width: width === 'full' ? 'auto' : (width || cell.column.getSize()),
                            flexGrow: width === 'full' ? 1 : undefined,
                            flexShrink: width === 'full' ? 1 : undefined,
                            minWidth: 0
                          }}>
                            <div className="w-full">
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </div>
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })
              ) : (
                <TableRow className="flex">
                  <TableCell colSpan={props.columns.length} className="h-24 text-center w-full mt-12">
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
    </ScrollArea>
  )
}


export default VirtualizedTable