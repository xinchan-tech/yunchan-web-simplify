import { type ColumnDef, type ColumnSort, type Row, type SortingState, type TableOptions, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table"
import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../ui/table"
import JknIcon from "../jkn-icon"
import { useUpdateEffect } from "ahooks"

export interface JknTableProps<TData extends Record<string, unknown> = Record<string, unknown>, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  rowKey?: string
  onRowClick?: (data: TData, row: Row<TData>) => void
  onSortingChange?: (params: ColumnSort) => void
}

const SortUp = () => <JknIcon name="ic_btn_up" className="w-2 h-4" />
const SortDown = () => <JknIcon name="ic_btn_down" className="w-2 h-4" />
const SortNone = () => <JknIcon name="ic_btn_nor" className="w-2 h-4" />

const JknTable = <TData extends Record<string, unknown>, TValue>(props: JknTableProps<TData, TValue>) => {
  const [sorting, setSorting] = useState<SortingState>([])
  const [rowSelection, setRowSelection] = useState({})

  const _onSortCHange: TableOptions<TData>['onSortingChange'] = (e) => {
    setSorting(e)
  }

  useUpdateEffect(() => {
    props.onSortingChange?.(sorting[0] ?? { desc: undefined, id: '' })
  }, [sorting])

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
    onSortingChange: _onSortCHange,
    getCoreRowModel: getCoreRowModel(),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
  })

  return (
    <div className="w-full">
      <Table className="w-full mt-[-1px]">
        <TableHeader className="sticky top-0 z-10">
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const { width, align } = header.column.columnDef.meta ?? {}
                return (
                  <TableHead key={header.id} style={{ width }} >
                    {header.isPlaceholder
                      ? null
                      : (
                        <div className="flex items-center w-full space-x-1">
                          <div className="flex-1" style={{ textAlign: align }}>
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
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
                onClick={() => props.onRowClick?.(row.original, row)}
                className="bg-muted hover:bg-accent transition-all duration-200"
              >
                {row.getVisibleCells().map((cell) => {
                  const { align } = cell.column.columnDef.meta ?? {}
                  return (
                    <TableCell key={cell.id} style={{ textAlign: align }}>
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
      </Table>
    </div>
  )
}

export default JknTable