import { JknInfiniteArea, ScrollArea } from "@/components"
import { useVirtualizer } from "@tanstack/react-virtual"
import { useVirtualList } from "ahooks"
import { type ComponentProps, type ComponentRef, type ReactNode, useRef } from "react"

interface JknVirtualListProps<T> {
  data: T[]
  itemHeight: number
  rowKey: string
  overscan?: number
  renderItem: (item: T, index: number) => ReactNode
  onScroll?: (scrollTop: number) => void
  className?: string
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

}

export const JknVirtualInfinite = <T,>({ data, itemHeight, renderItem, overscan = 20, className, rowKey, onScroll, ...props }: JknVirtualInfiniteProps<T>) => {
  const containerRef = useRef<ComponentRef<typeof JknInfiniteArea>>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => containerRef.current?.getContainer()?.querySelector('[data-radix-scroll-area-viewport]') ?? null,
    estimateSize: () => itemHeight,
    enabled: true
  })

  return (
    <JknInfiniteArea ref={containerRef} className={className} {...props}>
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
    </JknInfiniteArea>
  )
}