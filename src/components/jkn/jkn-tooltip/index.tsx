import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { TooltipContentProps } from '@radix-ui/react-tooltip'
import { type ComponentType, type RefObject, forwardRef } from 'react'

type WithTooltipProps<T> = T & {
  label?: string
  contentClassName?: string
} & TooltipContentProps

export const withTooltip = <T extends {}>(Component: ComponentType<T>) => {
  return ({ label, contentClassName, align, alignOffset, side, sideOffset, ...props }: WithTooltipProps<T>) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <RefWrapper>
              <Component {...(props as T)} />
            </RefWrapper>
          </TooltipTrigger>
          <TooltipContent
            side={side}
            align={align}
            sideOffset={sideOffset}
            alignOffset={alignOffset}
            className={contentClassName}
          >
            <div>{label}</div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
}

const RefWrapper = forwardRef<any, any>(({ children, ...props }, ref) => {
  return (
    <div ref={ref as RefObject<HTMLDivElement>} {...props}>
      {children}
    </div>
  )
})
