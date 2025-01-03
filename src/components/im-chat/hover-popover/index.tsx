import React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
const TooltipProvider = TooltipPrimitive.Provider;
const TooltipRoot = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = TooltipPrimitive.Content;

import { cn } from "@/utils/style";

type HoverPopoverProps = {
  triggerTitle: React.ReactNode | string;
  content: React.ReactNode | string;
  style?: React.CSSProperties | undefined;
  contentClassName?: string | undefined;
};
const HoverPopover = (props: HoverPopoverProps) => {
  return (
    <TooltipProvider delayDuration={0}>
      <TooltipRoot>
        <TooltipTrigger asChild>
          {props.triggerTitle}
          {/* trigger */}
        </TooltipTrigger>
        <TooltipContent
          side="bottom"
          className={cn(
            "z-50 border-solid border-dialog-border overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground",
            "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2",
            props.contentClassName
          )}
        >
          {props.content}
        </TooltipContent>
      </TooltipRoot>
    </TooltipProvider>
  );
};

export default HoverPopover;
