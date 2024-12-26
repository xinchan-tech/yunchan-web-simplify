declare type AnyRecord = Record<string, any>

declare type PageResult<T> = {
  items: T[]
  before: number
  current: number
  first: number
  last: number
  limit: number
  next: number
  previous: number
  total_items: number
  total_nums: number
  total_pages: number
}

declare type NormalizedRecord<T = any> = Record<string, T>

declare type ArrayItem<T> = T extends Array<infer U> ? U : never

declare const __RELEASE_TAG__: string

declare const __RELEASE_VERSION__: string
