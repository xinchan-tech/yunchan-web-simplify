import { memo, useMemo, useState } from 'react'
import { nanoid } from "nanoid"
import { cn } from "@/utils/style"

interface StarRectProps {
  className?: string
  activeColor: string
  count: number
  total?: number
  inactiveColor?: string
}

const StarRect = memo(({ className, activeColor, inactiveColor = '#2E2E2E', total = 5, count }: StarRectProps) => {
  const array = useMemo(() => Array.from({ length: total }, (_) => nanoid(8)), [total])

  return (
    <span className="inline-flex items-center space-x-[1px]">
      {
        array.map((id, index) => (
          <span key={id} className={cn('h-4 w-2.5 rounded-[1px]', className)} style={{ background: index < count ? activeColor : inactiveColor }} />
        ))
      }
    </span>
  )
})

export default StarRect
