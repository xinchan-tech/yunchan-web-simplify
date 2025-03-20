import { ScrollArea } from '@/components'
import { useLatestRef } from '@/hooks'
import { cn } from '@/utils/style'
import { type CSSProperties, type PropsWithChildren, forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react'
import { animateScroll } from 'react-scroll'

interface JknInfiniteAreaProps {
  direction?: 'up' | 'down'
  hasMore?: boolean
  className?: string
  fetchMore?: () => void
  style?: CSSProperties
}

type JknInfiniteAreaInstance = {
  scrollTo: (position: number) => void
  scrollToBottom: () => void
  scrollToTop: () => void
  isOnLimit: () => boolean
  getContainer: () => HTMLDivElement | null
}

const getScrollViewId = (container: HTMLDivElement | null) => {
  return container?.querySelector('.scroll-area-viewport[data-radix-scroll-area-viewport]')?.id
}

export const JknInfiniteArea = forwardRef<JknInfiniteAreaInstance, PropsWithChildren<JknInfiniteAreaProps>>(
  ({ direction = 'down', hasMore, className, children, fetchMore, style }, ref) => {
    const uid = useId()
    const container = useRef<HTMLDivElement>(null)
    const fetchFn = useLatestRef(fetchMore)
    const hasMoreRef = useLatestRef(hasMore)
    const isLimit = useRef(true)

    useEffect(() => {
      const loadMoreNode = container.current?.querySelector(`.jkn-infinite-load-${direction}[data-load-more="${uid}"]`)

      if (!loadMoreNode) return

      const observer = new IntersectionObserver(([entry]) => {
        isLimit.current = entry.isIntersecting

        if (entry.isIntersecting && hasMoreRef.current) {
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
      },
      isOnLimit: () => isLimit.current,
      getContainer: () => container.current
    }))

    return (
      <ScrollArea className={cn('jkn-infinite-area', className)} ref={container} style={style}>
        {direction === 'up' ? <div data-load-more={uid} className="jkn-infinite-load-up h-[1px]" /> : null}
        {children}
        {direction === 'down' ? <div data-load-more={uid} className="jkn-infinite-load-down h-[1px]" /> : null}
      </ScrollArea>
    )
  }
)
