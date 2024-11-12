"use client"

import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/utils/style"

const toggleVariants = cva(
  "inline-flex items-center border text-secondary cursor-pointer border-solid justify-center rounded-sm text-sm transition-all hover:bg-[var(--toggle-active-bg)] hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-[var(--toggle-active-bg)] data-[state=on]:text-foreground [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-accent border-transparent",
        outline:
          "border border-dialog-border data-[state=on]:border-stock-up-color bg-transparent shadow-sm hover:text-accent-foreground",
      },
      size: {
        default: "h-10 leading-10 py-2 min-w-9",
        sm: "h-8 px-1.5 min-w-8",
        lg: "h-10 px-2.5 min-w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

interface ToggleProps {
  activeColor?: string
}

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> &
  VariantProps<typeof toggleVariants> & ToggleProps
>(({ className, variant, size, activeColor, ...props }, ref) => (
  <div style={{
    '--toggle-active-bg': activeColor ?? 'var(--primary-color)'
  } as React.CSSProperties}>
    <TogglePrimitive.Root
      ref={ref}
      className={cn(
        toggleVariants({ variant, size, className })
      )}

      {...props}
    />
  </div>
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
