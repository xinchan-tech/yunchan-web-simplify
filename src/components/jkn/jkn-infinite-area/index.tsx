import type { PropsWithChildren } from "react"

interface JknInfiniteAreaProps {
  direction?: 'up' | 'down'
  hasMore?: boolean
  className?: string
}

export const JknInfiniteArea = ({direction, hasMore, className, children}: PropsWithChildren<JknInfiniteAreaProps>) => {
  return (
    <div>

    </div>
  )
}