import { JknInfiniteArea, ScrollArea, Skeleton } from '@/components'
import { type VirtualItem, type Virtualizer, useVirtualizer } from '@tanstack/react-virtual'
import { useVirtualList } from 'ahooks'
import { nanoid } from "nanoid"
import {
  type ComponentProps,
  type ComponentRef,
  type ForwardedRef,
  type ReactNode,
  forwardRef,
  memo,
  useImperativeHandle,
  useLayoutEffect,
  useRef
} from 'react'

interface JknVirtualListProps<T> {
  data: T[]
  itemHeight: number
  rowKey: string
  overscan?: number
  renderItem: (item: T, index: number) => ReactNode
  onScroll?: (scrollTop: number) => void
  className?: string
  loading?: boolean
}
export const JknVirtualList = <T,>({
  data,
  itemHeight,
  renderItem,
  overscan = 20,
  className,
  rowKey
}: JknVirtualListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [list] = useVirtualList(data, {
    containerTarget: () => containerRef.current?.querySelector('[data-radix-scroll-area-viewport]'),
    wrapperTarget: wrapperRef,
    itemHeight: itemHeight,
    overscan: overscan
  })

  return (
    <ScrollArea ref={containerRef} className={className}>
      <div ref={wrapperRef}>
        {list.map(ele => (
          <div key={(ele.data as any)[rowKey as any]}>{renderItem(ele.data, ele.index)}</div>
        ))}
      </div>
    </ScrollArea>
  )
}

interface JknVirtualInfiniteProps<T> extends Omit<JknVirtualListProps<T>, 'onScroll'>, ComponentProps<typeof JknInfiniteArea> {
  autoBottom?: boolean
  onScrollToTop?: (range: { startIndex?: number; endIndex?: number }) => void
  onScrollToBottom?: (range: { startIndex?: number; endIndex?: number }) => void
}

interface JknVirtualInfiniteIns {
  scrollToIndex: (index: number) => void
  getVirtualItems: () => VirtualItem[]
  getVirtualizer: () => Virtualizer<any, any>
}

export const JknVirtualInfinite = forwardRef<JknVirtualInfiniteIns, JknVirtualInfiniteProps<any>>(
  (
    { data, itemHeight, renderItem, overscan = 20, className, rowKey, onScrollToTop, onScrollToBottom, autoBottom, loading, ...props },
    ref
  ) => {
    const containerRef = useRef<ComponentRef<typeof JknInfiniteArea>>(null)
    const virtualizer = useVirtualizer({
      count: data.length,
      getScrollElement: () =>
        containerRef.current?.getContainer()?.querySelector('[data-radix-scroll-area-viewport]') ?? null,
      estimateSize: () => itemHeight,
      enabled: true,
      getItemKey: (index) => rowKey ? ((data[index] as any)[rowKey as any] ?? index) : index,
      onChange: (v, sync) => {
        if (sync) {
          if (v.range?.startIndex === 0) {
            onScrollToTop?.(v.range)
          }

          if (v.range?.endIndex === data.length - 1) {
            onScrollToBottom?.(v.range)
          }
        }
      }
    })

    useImperativeHandle(
      ref,
      () => ({
        scrollToIndex: virtualizer.scrollToIndex,
        getVirtualItems: virtualizer.getVirtualItems,
        getVirtualizer: () => virtualizer
      }),
      [virtualizer]
    )

    return (
      <JknInfiniteArea ref={containerRef} className={className} {...props}>
        {loading ? (
          <Loading />
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualizer.getVirtualItems()[0]?.start ?? 0}px)`
              }}
            >
              {virtualizer.getVirtualItems().map(row => {
                return (
                  <div key={row.key} data-index={row.index} ref={virtualizer.measureElement}>
                    {renderItem(data[row.index], row.index)}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </JknInfiniteArea>
    )
  }
)

const Loading = memo(() => {
  const arr = Array.from({ length: 10 }, (_, i) => i)
  return (
    <div className="space-y-4">
      {arr.map(i => (
        <Skeleton key={i} className="h-4" />
      ))}
    </div>
  )
})
