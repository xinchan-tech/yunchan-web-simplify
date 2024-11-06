import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "../ui/table"
import { flexRender, getCoreRowModel, useReactTable, type ColumnDef } from "@tanstack/react-table"

export interface JknTableProps<TData extends Record<string, unknown> = Record<string, unknown>, TValue = unknown> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
}

const JknTable = <TData extends Record<string, unknown>, TValue>(props: JknTableProps<TData, TValue>) => {
  const table = useReactTable({
    columns: props.columns,
    data: props.data,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <div className="w-full">
      <Table className="w-full">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const { width, align } = header.column.columnDef.meta ?? {}
                return (
                  <TableHead key={header.id} style={{ width, textAlign: align }} >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
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