import { Skeleton } from "@/components"
import { VirtualTable, type TableProps } from "rc-table"
import type { DefaultRecordType } from "rc-table/lib/interface"
import { memo, type ReactNode, useEffect, useMemo, useRef } from "react"
import { useImmer } from "use-immer"
import { withSort } from "../jkn-icon/with-sort"
import { useLatestRef } from "@/hooks"
import { useMount, useUnmount } from "ahooks"



export interface TcSortTableProps<T = any> extends TableProps<T> {
  headerHeight?: number
  isLoading?: boolean
  border?: boolean
  infiniteScroll?: {
    enabled?: boolean
    fetchMore?: () => void
    hasMore?: boolean
  }
  sortClear?: boolean
}

export const TcSortTable = <T extends DefaultRecordType = any>({
  headerHeight = 42,
  columns,
  emptyText,
  isLoading,
  border = true,
  infiniteScroll,
  sortClear = false,
  data,
  ...props
}: TcSortTableProps<T>) => {
  const hasMore = useLatestRef(infiniteScroll?.hasMore)
  const fetchMore = useLatestRef(infiniteScroll?.fetchMore)
  const dom = useRef<HTMLDivElement>(null)
  const [container, setContainer] = useImmer({ width: 0, height: headerHeight })
  const sortFieldCache = useRef<Map<keyof T, { sortType: 'string' | 'number' | 'custom', onSort: (data: T[], columnKey: keyof T, order: 'asc' | 'desc') => T[] }>>(new Map())
  const [sort, setSort] = useImmer<{
    columnKey: keyof T | undefined
    order: "asc" | "desc" | undefined
  }>({
    columnKey: undefined,
    order: undefined,
  })

  const [innerData, setInnerData] = useImmer(data)


  const _columns = useMemo(() => {
    if (!columns) return columns

    return columns.map((column: any) => {
      if ((column as any).sort && !(column as any).children) {
        const { onSort, sortType } = column
        sortFieldCache.current.set(column.dataIndex, {
          sortType,
          onSort,
        })
        return {
          ...column,
          title: (
            <SortTitle
              onSort={onSort}
              sortClear={false}
              sort={sort.columnKey === (column as any).dataIndex ? sort.order : undefined}
              field={(column as any).dataIndex}
            >
              {column.title}
            </SortTitle>
          )
        }
      }
      return column
    })
  }, [columns, sort])

  const observerRef = useRef<IntersectionObserver | null>(null)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  useMount(() => {
    if (!dom.current) return

    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        // console.log(111)
        setContainer(draft => {
          draft.width = width
          draft.height = height
        })
      }
    })
    resizeObserver.observe(dom.current!)
    resizeObserverRef.current = resizeObserver

    if (infiniteScroll?.enabled) {
      const table = dom.current!.querySelector('.rc-table-body table')!
      const moreElement = document.createElement('div')
      moreElement.className = 'jkn-rc-table-more'
      table.after(moreElement)

      const observer = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && hasMore.current) {
            fetchMore.current?.()
          }
        },
        {
          root: dom.current!.querySelector('.rc-table-body')!,
          rootMargin: '0px',
          threshold: 0
        }
      )

      observer.observe(moreElement)

      observerRef.current = observer
    }
  })

  useUnmount(() => {
    if (!dom.current) return
    const loadMore = dom.current!.querySelectorAll('.rc-table-body .jkn-rc-table-more')!
    Array.from(loadMore).forEach(o => o.remove())
    observerRef.current?.disconnect()
    observerRef.current = null
  })


  return (
    <div className="jkn-rc-table overflow-hidden h-full w-full" ref={dom} data-border={border}>
      <VirtualTable
        columns={_columns}
        scroll={{ y: container.height ? container.height - headerHeight : 0 }}
        rowHoverable={false}
        emptyText={
          isLoading ? (
            <div className="space-y-2 my-2">
              <Loading />
            </div>
          ) : emptyText ? (
            emptyText
          ) : (
            '没有更多的数据'
          )
        }
        getContainerWidth={(ele, width) => {
          // Minus border
          const { borderInlineStartWidth } = getComputedStyle(ele.querySelector('.rc-table-tbody')!)
          const mergedWidth = width - Number.parseInt(borderInlineStartWidth, 10)
          return mergedWidth
        }}
        {...props}
      />
    </div>
  )

}

const Loading = memo(() =>
  Array.from({ length: 8 }).map((_, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
    <Skeleton key={i} className="h-5" />
  ))
)

export const SortTitle = withSort(({ children }: { children: ReactNode }) => <span>{children}</span>)