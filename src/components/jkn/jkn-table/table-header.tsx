import { flexRender, type Table } from "@tanstack/react-table"
import { JknIcon } from "../jkn-icon"

interface JknTableHeaderProps {
  table: Table<any>
  width: NormalizedRecord<number>
}

const SortUp = () => <JknIcon name="ic_btn_up" className="w-2 h-4" />
const SortDown = () => <JknIcon name="ic_btn_down" className="w-2 h-4" />
const SortNone = () => <JknIcon name="ic_btn_nor" className="w-2 h-4" />

export const JknTableHeader = ({ width, table }: JknTableHeaderProps) => {

  return (
    <div className="overflow-hidden">
      <table className="table-fixed" cellSpacing={0}>
        <colgroup>
          {
            table.getFlatHeaders().filter(i => !i.isPlaceholder && i.subHeaders.length === 0).map(header =>
              <col key={header.id} style={{ width: width[header.id] ?? 120 }}
              />)
          }
        </colgroup>
        <thead className="jkn-table-virtualized-thead">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="jkn-table-virtualized-tr bg-accent">
              {headerGroup.headers.map((header) => {
                const { align, rowSpan = 1 } = header.column.columnDef.meta ?? {}

                if (header.depth - header.column.depth > 1) {
                  return null
                }

                return (
                  <th key={header.id} colSpan={header.colSpan} rowSpan={rowSpan} className="jkn-table-virtualized-th" style={{ textAlign: (align ?? 'left') as any }}>
                    <div className="inline-flex items-center space-x-2 box-border font-normal text-xs py-2 px-1">
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
      <style jsx>{
        `
        .jkn-table-virtualized-th {
          border-width: 0 1px 1px 0;
          border-color: hsl(var(--background));
          border-style: solid;
          box-sizing: border-box;
          font-size: 13px;
        }

        .jkn-table-virtualized-th:last-child {
          border-right: none;
        `
      }</style>
    </div>
  )
}