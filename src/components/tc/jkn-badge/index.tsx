import { cn } from "@/utils/style"
import type { PropsWithChildren } from "react"

interface JknBadgeProps extends React.HTMLAttributes<HTMLDivElement> { }

const _JknBadge = ({ children, className, ...props }: PropsWithChildren<JknBadgeProps>) => {
  return (
    <div className={cn('min-w-[14px] min-h-3 flex rounded-full border border-solid border-white bg-[#D61B5F] box-border px-[1px]', className)} {...props} >
      <span className="m-auto text-xs leading-none text-white" style={{ transform: `scale(${10 / 12})` }}>{children}</span>
    </div>
  )
}

export const JknBadge = _JknBadge as typeof _JknBadge & {
  Number: typeof JknNumberBadge
}

interface JknNumberBadgeProps extends JknBadgeProps {
  number: number
  max?: number 
}

const JknNumberBadge = ({ number, max = 99, ...props }: JknNumberBadgeProps) => {
  const displayNumber = max && number > max ? `${max}+` : number
  return (
    <_JknBadge {...props}>
      {displayNumber}
    </_JknBadge>
  )
}

JknBadge.Number = JknNumberBadge