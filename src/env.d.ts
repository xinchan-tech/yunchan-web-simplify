/// <reference types="@rsbuild/core/types" />
/// <reference types="styled-jsx" />


interface ImportMetaEnv {
  readonly PUBLIC_BASE_API_URL: string
  readonly PUBLIC_BASE_ICON_URL: string
}

import '@tanstack/react-table' //or vue, svelte, solid, qwik, etc.

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    width?: number | string
    align?: 'left' | 'center' | 'right' | string
    sort?: boolean
    minWidth?: number | string
  }

  interface TableMeta<TData extends RowData> {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    emit: (arg: {event: string, params: any}) => void
  }
}

