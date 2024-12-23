import { type ColumnDef, type ColumnSort, type Row, type SortingState, type TableOptions, flexRender, getCoreRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table"
import { useMount, useUnmount, useUpdateEffect } from "ahooks"
import { type CSSProperties, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import JknIcon from "../jkn-icon"
import { ScrollArea, Skeleton } from "@/components"
import { cn } from "@/utils/style"
import { useVirtualizer } from '@tanstack/react-virtual'
import { appEvent } from "@/utils/event"
import { nanoid } from "nanoid"
import { useDomSize } from "@/hooks"

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
  onEvent?: (arg: { event: string, params: any }) => void
}

const SortUp = () => <JknIcon name="ic_btn_up" className="w-2 h-4" />
const SortDown = () => <JknIcon name="ic_btn_down" className="w-2 h-4" />
const SortNone = () => <JknIcon name="ic_btn_nor" className="w-2 h-4" />

const VirtualizedTable = <TData extends Record<string, unknown>, TValue>({ className, style, ...props }: JknTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})
  // const [rowClick, setRowClick] = useState<string | number>()
  // console.log('rerender')
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
    getScrollElement: () => scrollRef.current,
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
      appEvent.on(eventTopic.current as any, (props.onEvent as () => void) ?? (() => { }))
    }
  })

  useUnmount(() => {
    if (eventTopic?.current) {
      appEvent.off(eventTopic.current as any)
    }
  })

  const _onRowClick = (row: Row<TData>) => {
    props.onRowClick?.(row.original, row)
    // setRowClick(rowClick !== undefined ? undefined : row.original[props.rowKey ?? 'id'] as string | number)
  }

  const scrollRef = useRef<HTMLDivElement>(null)
  const [size, dom] = useDomSize<HTMLDivElement>()

  const [firstRender, setFirstRender] = useState(true)
  useLayoutEffect(() => {
    if (!size?.width) {
      return
    }
    setFirstRender(false)
    const headers = table.getFlatHeaders()
    const autoHeaders: typeof headers = []
    let totalWidth = 0
    headers.forEach(header => {
      const metaWidth = header.column.columnDef.meta?.width
      const borderWidth = (header.index === 0  || header.index === headers.length - 1) ? 1 : 1
      if (metaWidth) {
        if (typeof metaWidth === 'number') {
          header.column.columnDef.size = metaWidth - borderWidth
          totalWidth += metaWidth
        } else if (typeof metaWidth === 'string' && metaWidth.endsWith('%')) {
          header.column.columnDef.size = size.width * Number.parseFloat(metaWidth) / 100
          totalWidth += header.column.columnDef.size - borderWidth
        } else {
          autoHeaders.push(header)
        }
      } else {
        autoHeaders.push(header)
      }
    })

    const remainWidth = size.width - totalWidth

    autoHeaders.forEach(header => {
      const borderWidth = (header.index === 0  || header.index === headers.length - 1) ? 1 : 1
      header.column.columnDef.size = remainWidth / autoHeaders.length  - borderWidth
    })

  }, [size?.width, table.getFlatHeaders])


  return (
    <div className="jkn-table-virtualized overflow-hidden h-full" ref={dom}>
      {
        !firstRender ? (
          <>
            <div className="jkn-table-virtualized-header overflow-hidden">
              <table className="table-fixed" cellSpacing={1}>
                <colgroup>
                  {
                    table.getFlatHeaders().map(header => <col key={header.id} style={{ width: Number.isNaN(header.column.getSize()) ? 120 : header.column.getSize() }} />)
                  }
                </colgroup>
                <thead className="jkn-table-virtualized-thead">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="jkn-table-virtualized-tr bg-accent">
                      {headerGroup.headers.map((header) => {
                        const { align } = header.column.columnDef.meta ?? {}
                        return (
                          <th key={header.id} className="jkn-table-virtualized-th" style={{ textAlign: align as undefined }}>
                            <div className="flex items-center w-full space-x-2 box-border font-normal text-xs py-2 px-1">
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {header.column.getCanSort() && (
                                <span className="flex items-center ml-1" onClick={header.column.getToggleSortingHandler()} onKeyDown={() => { }}>
                                  {{
                                    asc: <SortUp />,
                                    desc: <SortDown />,
                                  }[header.column.getIsSorted() as string] ?? <SortNone />}
                                </span>
                              )}
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  ))}
                </thead>
              </table>
            </div>
            <div className="jkn-table-virtualized-body overflow-hidden" style={{ height: 'calc(100% - 36px)' }}>
              <div className="overflow-y-auto overflow-x-hidden" style={{ height: '100%', width: 'calc(100% + 18px)' }} ref={scrollRef}>
                <table className="table-fixed grid relative z-0" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
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
                                <td key={cell.id} className="jkn-table-virtualized-td box-border flex items-center flex-shrink-0 border-t-0 border-l-0 border-b border-r last:border-r-0 border-solid border-background" style={{ textAlign: align as undefined, width: cell.column.getSize() }}>
                                  <div className="w-full">
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                  </div>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })
                    ) : null
                  }
                </table>
              </div>

            </div>
          </>
        ) : null
      }
    </div>
    // <ScrollArea ref={scrollRef} className={cn('w-full relative', className)} style={style}>
    //   <Table className="w-full mt-[-1px] grid border border-b-0 border-solid border-background" >
    //     <TableHeader className="sticky top-0 z-10 grid">
    //       {table.getHeaderGroups().map((headerGroup) => (
    //         <TableRow key={headerGroup.id} className="flex w-full">
    //           {headerGroup.headers.map((header) => {
    //             const { align, width = 'full' } = header.column.columnDef.meta ?? {}
    //             return (
    //               <TableHead key={header.id} className="flex flex-shrink-0 py-4 border-t-0 border-l-0 border-b border-r last:border-r-0 border-solid border-background" style={{
    //                 width: width === 'full' ? 'auto' : (width || header.column.getSize()),
    //                 minWidth: 0,
    //                 flexGrow: width === 'full' ? 1 : undefined,
    //                 flexShrink: width === 'full' ? 1 : undefined
    //               }} >
    //                 {header.isPlaceholder
    //                   ? null
    //                   : (
    //                     <div className="flex items-center w-full space-x-1">
    //                       <div className="flex-1" style={{ textAlign: align as undefined }}>
    //                         {
    //                           flexRender(
    //                             header.column.columnDef.header,
    //                             header.getContext()
    //                           )
    //                         }
    //                       </div>
    //                       {
    //                         header.column.getCanSort() && (
    //                           <div onClick={header.column.getToggleSortingHandler()} onKeyDown={() => { }}>
    //                             {{
    //                               asc: <SortUp />,
    //                               desc: <SortDown />,
    //                             }[header.column.getIsSorted() as string] ?? <SortNone />}
    //                           </div>
    //                         )
    //                       }
    //                     </div>
    //                   )
    //                 }
    //               </TableHead>
    //             )
    //           })}
    //         </TableRow>
    //       ))}
    //     </TableHeader>
    //     {
    //       !props.loading ? (
    //         <TableBody className="grid relative z-0" style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
    //           {table.getRowModel().rows?.length ? (
    //             rowVirtualizer.getVirtualItems().map(virtualRow => {
    //               const row = rows[virtualRow.index] as Row<TData>

    //               return (
    //                 <TableRow
    //                   data-index={virtualRow.index}
    //                   key={row.id}
    //                   data-state={row.getIsSelected() && "selected"}
    //                   ref={node => rowVirtualizer.measureElement(node)}
    //                   onClick={() => _onRowClick(row)}
    //                   className="hover:bg-accent transition-all duration-200 flex absolute w-full z-0"
    //                   style={{
    //                     transform: `translateY(${virtualRow.start}px)` //this should always be a `style` as it changes on scroll
    //                   }}
    //                 >
    //                   {row.getVisibleCells().map((cell) => {
    //                     const { align, width = 'full' } = cell.column.columnDef.meta ?? {}
    //                     return (
    //                       <TableCell className="flex items-center flex-shrink-0 border-t-0 border-l-0 border-b border-r last:border-r-0 border-solid border-background" key={cell.id} style={{
    //                         textAlign: align as undefined, width: width === 'full' ? 'auto' : (width || cell.column.getSize()),
    //                         flexGrow: width === 'full' ? 1 : undefined,
    //                         flexShrink: width === 'full' ? 1 : undefined,
    //                         minWidth: 0
    //                       }}>
    //                         <div className="w-full">
    //                           {flexRender(cell.column.columnDef.cell, cell.getContext())}
    //                         </div>
    //                       </TableCell>
    //                     )
    //                   })}
    //                 </TableRow>
    //               )
    //             })
    //           ) : (
    //             <TableRow className="flex">
    //               <TableCell colSpan={props.columns.length} className="h-24 text-center w-full mt-12">
    //                 暂无数据
    //               </TableCell>
    //             </TableRow>
    //           )}
    //         </TableBody>
    //       ) : (
    //         <TableBody>
    //           <TableRow className="absolute flex w-full z-0">
    //             <TableCell colSpan={props.columns.length} className="text-center flex-1 jkn-table-cell">
    //               <div className="space-y-2 my-2">
    //                 {
    //                   Array.from({ length: 8 }).map((_, i) => (
    //                     // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
    //                     <Skeleton key={i} className="h-6" />
    //                   ))
    //                 }
    //               </div>
    //             </TableCell>
    //           </TableRow>
    //         </TableBody>
    //       )
    //     }
    //   </Table>
    //   <style jsx>
    //     {
    //       `
    //       .jkn-table-cell{
    //         border: 1px solid var(hsl(--background));
    //       }
    //       `
    //     }
    //   </style>
    // </ScrollArea>
  )
}


export default VirtualizedTable