// biome-ignore lint/suspicious/noExplicitAny: <explanation>
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
