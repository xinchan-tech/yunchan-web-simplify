import { JknInfiniteArea, ScrollArea, Skeleton } from "@/components"
import { useVirtualizer, type VirtualItem } from "@tanstack/react-virtual"
import { useVirtualList } from "ahooks"
import { type ComponentProps, type ComponentRef, type ForwardedRef, forwardRef, memo, type ReactNode, useImperativeHandle, useLayoutEffect, useRef } from "react"

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
export const JknVirtualList = <T,>({ data, itemHeight, renderItem, overscan = 20, className, rowKey }: JknVirtualListProps<T>) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const [list] = useVirtualList(data, {
    containerTarget: () => containerRef.current?.querySelector('[data-radix-scroll-area-viewport]'),
    wrapperTarget: wrapperRef,
    itemHeight: itemHeight,
    overscan: overscan
  })

  return (
    <ScrollArea ref={containerRef} className={className} >
      <div ref={wrapperRef}>
        {list.map(ele =>
          <div key={(ele.data as any)[rowKey as any]}>
            {renderItem(ele.data, ele.index)}
          </div>
        )}
      </div>
    </ScrollArea>
  )
}

interface JknVirtualInfiniteProps<T> extends JknVirtualListProps<T>, ComponentProps<typeof JknInfiniteArea> {
  autoBottom?: boolean
}

interface JknVirtualInfiniteIns {
  scrollToIndex: (index: number) => void
  getVirtualItems: () => VirtualItem[]
}

export const JknVirtualInfinite = forwardRef<JknVirtualInfiniteIns, JknVirtualInfiniteProps<any>>(({ data, itemHeight, renderItem, overscan = 20, className, rowKey, onScroll, autoBottom, loading, ...props }, ref) => {
  const containerRef = useRef<ComponentRef<typeof JknInfiniteArea>>(null)


  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => containerRef.current?.getContainer()?.querySelector('[data-radix-scroll-area-viewport]') ?? null,
    estimateSize: () => itemHeight,
    enabled: true
  })

  useLayoutEffect(() => {
    if (autoBottom) {
      const items = virtualizer.getVirtualItems()
      const currentLastItems = items[items.length - 1]?.index
      const firstItems = items[0]?.index
      if (firstItems === 0) {
        virtualizer.scrollToIndex(data.length - 1)
      }
      if (data.length > 0 && currentLastItems >= data.length - 2) {
        virtualizer.scrollToIndex(data.length - 1)
      }
    }
  }, [data, virtualizer.scrollToIndex, autoBottom, virtualizer.getVirtualItems])

  useImperativeHandle(ref, () => ({
    scrollToIndex: virtualizer.scrollToIndex,
    getVirtualItems: virtualizer.getVirtualItems
  }), [virtualizer.scrollToIndex, virtualizer.getVirtualItems])

  return (
    <JknInfiniteArea ref={containerRef} className={className} {...props}>
      {
        loading ? (
          <Loading />
        ) : (
          <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualizer.getVirtualItems()[0]?.start ?? 0}px)`,
              }}
            >
              {
                virtualizer.getVirtualItems().map(row => {
                  return (
                    <div key={row.key}
                      data-index={row.index}
                      ref={virtualizer.measureElement}
                    >
                      {renderItem(data[row.index], row.index)}
                    </div>
                  )
                })
              }
            </div>
          </div>
        )
      }
    </JknInfiniteArea>
  )
})


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