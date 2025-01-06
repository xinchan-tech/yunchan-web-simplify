import '@tanstack/react-table' //or vue, svelte, solid, qwik, etc.
import 'rc-table'

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    width?: number | string
    align?: 'left' | 'center' | 'right' | string
    cellClassName?: string
    sort?: boolean
    rowSpan?: number
    minWidth?: number | string
  }

  interface TableMeta<TData extends RowData> {
    emit: (arg: {event: string, params: any}) => void
  }
}