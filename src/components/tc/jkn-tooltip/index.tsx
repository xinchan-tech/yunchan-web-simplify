import { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cn } from "@/utils/style"
import type { TooltipContentProps } from '@radix-ui/react-tooltip'
import type { ComponentType } from 'react'

type WithTooltipProps<T> = T & {
  label?: string
  contentClassName?: string
} & Omit<TooltipContentProps, 'onChange'>

export const withTooltip = <T extends {}>(Component: ComponentType<T>) => {
  return ({ label, contentClassName, align, alignOffset, side, sideOffset, ...props }: WithTooltipProps<T>) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Component {...(props as T)} />
            </div>
          </TooltipTrigger>
          <TooltipContent
            side={side}
            align={align}
            sideOffset={sideOffset}
            alignOffset={alignOffset}
            className={cn('bg-accent text-sm w-fit px-2', contentClassName)}
          >
            <TooltipArrow className="fill-accent" />
            <div>{label}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
}
