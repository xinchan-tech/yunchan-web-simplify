import { Skeleton } from '@/components/ui/skeleton'
import { useLatestRef } from '@/hooks'
import { useMount, useUnmount } from 'ahooks'
import type { TableProps } from 'rc-table'
import Table, { VirtualTable } from 'rc-table'
import type { DefaultRecordType } from 'rc-table/lib/interface'
import { type ReactNode, memo, useCallback, useMemo, useRef } from 'react'
import { useImmer } from 'use-immer'
import { withSort } from '../jkn-icon/with-sort'
import { isNumber, isString } from "radash"

export interface JknRcTableProps<T = any> extends TableProps<T> {
  headerHeight?: number
  isLoading?: boolean
  virtual?: boolean
  designWidth?: number
  onSort?: (columnKey: keyof T, order: 'asc' | 'desc' | undefined) => void
  infiniteScroll?: {
    enabled?: boolean
    fetchMore?: () => void
    hasMore?: boolean
  }
  sortClear?: boolean
}

const _JknRcTable = <T extends DefaultRecordType = any>({
  headerHeight = 42,
  columns,
  emptyText,
  isLoading,
  virtual,
  infiniteScroll,
  designWidth,
  sortClear = false,
  ...props
}: JknRcTableProps<T>) => {
  // const [size, dom] = useDomSize<HTMLDivElement>()
  const [sort, setSort] = useImmer<{ columnKey: keyof T | undefined; order: 'asc' | 'desc' | undefined }>({
    columnKey: undefined,
    order: undefined
  })
  const [container, setContainer] = useImmer({ width: 0, height: headerHeight })
  const dom = useRef<HTMLDivElement>(null)
  const hasMore = useLatestRef(infiniteScroll?.hasMore)
  const fetchMore = useLatestRef(infiniteScroll?.fetchMore)

  const onSort = useCallback(
    (columnKey: keyof T, order: 'asc' | 'desc' | undefined) => {
      setSort(draft => {
        draft.columnKey = columnKey as any
        draft.order = order
      })
      props.onSort?.(columnKey, order)
    },
    [props.onSort, setSort]
  )

  const _columns = useMemo(() => {
    if (!columns) return columns
    const width = dom.current?.getBoundingClientRect().width
    return columns.map(column => {
      if (designWidth && width) {

        columns.forEach((item: any) => {
          if (item.children) return

          if (item.width) {
            if (isNumber(item.width)) {
              item.width = item.width / designWidth * width
            } else if (isString(item.width)) {
              if (item.width.endsWith('%')) {
                item.width = Number(item.width.replace('%', '')) / 100 * width
              } else if (item.width.endsWith('px')) {
                item.width = Number(item.width.replace('px', ''))
              }
            }
          }
        })
      }
      if ((column as any).sort && !(column as any).children) {
        return {
          ...column,
          title: (
            <SortTitle
              onSort={onSort}
              sortClear={sortClear}
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
  }, [columns, sort, onSort, designWidth, sortClear])



  const observerRef = useRef<IntersectionObserver | null>(null)

  useMount(() => {
    if (!dom.current) return
    const { width, height } = dom.current!.getBoundingClientRect()
    setContainer(draft => {
      draft.width = width
      draft.height = height
    })

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
    <div className="jkn-rc-table overflow-hidden h-full w-full" ref={dom}>
      {virtual ? (
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
            ) : '没有更多的数据'
          }
          getContainerWidth={(ele, width) => {
            // Minus border
            const { borderInlineStartWidth } = getComputedStyle(ele.querySelector('.rc-table-tbody')!)
            const mergedWidth = width - Number.parseInt(borderInlineStartWidth, 10)
            return mergedWidth
          }}
          {...props}
        />
      ) : (
        <Table
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
            ) : '没有更多的数据'
          }
          {...props}
        />
      )}
    </div>
  )
}

export const JknRcTable = _JknRcTable as typeof _JknRcTable

// JknRcTable.Virtual = VirtualTable

const Loading = memo(() =>
  Array.from({ length: 8 }).map((_, i) => (
    // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
    <Skeleton key={i} className="h-5" />
  ))
)

export const SortTitle = withSort(({ children }: { children: ReactNode }) => <span>{children}</span>)
