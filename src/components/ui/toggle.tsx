'use client'

import * as TogglePrimitive from '@radix-ui/react-toggle'
import { type VariantProps, cva } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/utils/style'

const toggleVariants = cva(
  'inline-flex items-center border text-secondary cursor-pointer border-solid justify-center rounded-sm text-sm transition-all hover:bg-[var(--toggle-hover-bg)] hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-[var(--toggle-active-bg)] data-[state=on]:text-background [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-accent border-transparent',
        outline:
          'border border-border data-[state=on]:bg-transparent data-[state=on]:border-white data-[state=on]:text-white text-tertiary bg-transparent shadow-sm hover:text-accent-foreground hover:bg-[var(--toggle-hover-bg)]',
        ghost:
          'bg-transparent text-secondary data-[state=on]:bg-[var(--toggle-active-bg)]  data-[state=on]:border-[var(--toggle-active-bg)] data-[state=on]:text-foreground hover:border-accent hover:bg-[var(--toggle-hover-bg)] hover:text-foreground',
      },
      size: {
        default: 'h-10 leading-10 py-2 min-w-9',
        sm: 'h-8 px-1.5 min-w-8',
        lg: 'h-10 px-2.5 min-w-10',
        xl: 'h-11 px-3.5 min-w-11',
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default'
    }
  }
)

interface ToggleProps {
  activeColor?: string
}

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & VariantProps<typeof toggleVariants> & ToggleProps
>(({ className, variant, size, activeColor, ...props }, ref) => (
  <div
    style={
      {
        '--toggle-active-bg': activeColor ?? 'var(--primary-color)'
      } as React.CSSProperties
    }
  >
    <TogglePrimitive.Root ref={ref} className={cn(toggleVariants({ variant, size, className }))} {...props} />
  </div>
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
