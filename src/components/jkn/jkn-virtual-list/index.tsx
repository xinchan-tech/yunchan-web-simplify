import { ScrollArea } from "@/components"
import { useVirtualList } from "ahooks"
import { type ReactNode, useRef } from "react"

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