import { ScrollArea } from "@/components"
import { useLatestRef } from "@/hooks"
import { cn } from "@/utils/style"
import { forwardRef, useEffect, useId, useImperativeHandle, useRef, type PropsWithChildren } from "react"
import { animateScroll } from 'react-scroll'

interface JknInfiniteAreaProps {
  direction?: 'up' | 'down'
  hasMore?: boolean
  className?: string
  fetchMore?: () => void
}

type JknInfiniteAreaInstance = {
  scrollTo: (position: number) => void
  scrollToBottom: () => void
  scrollToTop: () => void
}

const getScrollViewId = (container: HTMLDivElement | null) => {
  return container?.querySelector('.scroll-area-viewport[data-radix-scroll-area-viewport]')?.id
}

export const JknInfiniteArea = forwardRef<JknInfiniteAreaInstance, PropsWithChildren<JknInfiniteAreaProps>>(({ direction = 'down', hasMore, className, children, fetchMore }, ref) => {
  const uid = useId()
  const container = useRef<HTMLDivElement>(null)
  const fetchFn = useLatestRef(fetchMore)
  const hasMoreRef = useLatestRef(hasMore)

  useEffect(() => {
    const loadMoreNode = container.current?.querySelector(`.jkn-infinite-load-${direction}[data-load-more="${uid}"]`)

    if (!loadMoreNode) return

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && hasMoreRef.current) {
        console.log(entry)
        fetchFn.current?.()
      }
    })

    observer.observe(loadMoreNode)

    return () => {
      observer.unobserve(loadMoreNode)
    }
  }, [direction, uid, fetchFn, hasMoreRef])



  useImperativeHandle(ref, () => ({
    scrollTo: (position: number) => {
      animateScroll.scrollToTop({
        containerId: getScrollViewId(container.current),
        duration: 0
      })
    },
    scrollToBottom: () => {
      animateScroll.scrollToBottom({
        containerId: getScrollViewId(container.current),
        duration: 0
      })
    },
    scrollToTop: () => {
      container.current?.scrollTo({
        top: 0
      })
    }
  }))

  return (
    <ScrollArea className={cn('jkn-infinite-area', className)} ref={container}>
      {
        direction === 'up' ? (
          <div data-load-more={uid} className="jkn-infinite-load-up h-[1px]" />
        ) : null
      }
      {children}
      {
        direction === 'down' ? (
          <div data-load-more={uid} className="jkn-infinite-load-down h-[1px]" />
        ) : null
      }
    </ScrollArea>
  )
})