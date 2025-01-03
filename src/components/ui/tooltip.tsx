import * as React from "react";
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from "@/utils/style";

const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;
const TooltipProtal = TooltipPrimitive.Portal;
const TooltipContent = TooltipPrimitive.Content;
const TooltipArrow = TooltipPrimitive.Arrow;

const TooltipSubContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content> & {
    inset?: boolean
  }
>(({className, ...props},ref) => {
    return (
        <TooltipPrimitive.Content
        ref={ref}
        className={cn(
            "z-50 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            className
        )}
        {...props}
        />
    )
})

export {TooltipSubContent}