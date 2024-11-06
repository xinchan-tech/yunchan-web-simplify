/// <reference types="@rsbuild/core/types" />
/// <reference types="styled-jsx" />


interface ImportMetaEnv {
  readonly PUBLIC_BASE_API_URL: string
}

import '@tanstack/react-table' //or vue, svelte, solid, qwik, etc.

declare module '@tanstack/react-table' {
  interface ColumnMeta<TData extends RowData, TValue> {
    width?: number | string
    align?: 'left' | 'center' | 'right'
  }
}