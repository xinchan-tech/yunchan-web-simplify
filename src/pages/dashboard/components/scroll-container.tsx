import { JknIcon } from '@/components'
import { useMount, useUnmount } from 'ahooks'
import { type ReactNode, useEffect, useRef } from 'react'

interface ScrollContainerProps {
  children: ReactNode
  onNextStock: () => void
  onPrevStock: () => void
}

export const ScrollContainer = ({ children, onNextStock, onPrevStock }: ScrollContainerProps) => {
  const container = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = container.current
    if (!el) return

    const handle = () => {
      const left = el.scrollLeft
      const width = el.scrollWidth - el.clientWidth
      const prev = el.previousElementSibling as HTMLElement
      const next = el.nextElementSibling as HTMLElement
      console.log(width)

      if (left === 0) {
        prev.style.display = 'none'
      } else {
        prev.style.display = 'flex'
      }

      if (left === width) {
        next.style.display = 'none'
      } else {
        next.style.display = 'flex'
      }
    }
    el.addEventListener('scroll', handle)

    return () => {
      el.removeEventListener('scroll', handle)
    }
  })

  return (
    <div className="flex items-center overflow-hidden box-border flex-shrink-0 h-[63px] my-4 px-2  relative w-full">
      <div className="absolute left-0 bg-background h-full flex items-center px-2" style={{ display: 'none' }}>
        <div
          className="bg-accent rounded-full w-10 h-10 flex items-center justify-center cursor-pointer rotate-180"
          onClick={onPrevStock}
          onKeyDown={() => {}}
        >
          <JknIcon.Svg name="arrow-right" size={12} className="text-[#B8B8B8]" />
        </div>
      </div>

      <div ref={container} className="flex-1 overflow-x-auto p-1.5 flex justify-between space-x-8 whitespace-nowrap">
        {children}
      </div>

      <div className="absolute right-0 bg-background h-full flex items-center px-2">
        <div
          className="bg-accent rounded-full w-10 h-10 flex items-center justify-center cursor-pointer"
          onClick={onNextStock}
          onKeyDown={() => {}}
        >
          <JknIcon.Svg name="arrow-right" size={12} className="text-[#B8B8B8]" />
        </div>
      </div>
    </div>
  )
}
