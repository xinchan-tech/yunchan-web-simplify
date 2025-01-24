import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { ComponentType } from "react"

type WithTooltipProps<T> = T & { label?: string }

export const withTooltip = <T extends {}>(Component: ComponentType<T>) => {
  return ({ label, ...props }: WithTooltipProps<T>) => {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Component {...(props as T)} />
          </TooltipTrigger>
          <TooltipContent>
            <p>{label}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
}