import * as ToggleGroupPrimitive from '@radix-ui/react-toggle-group'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { toggleVariants } from '@/components/ui/toggle'
import { cn } from '@/utils/style'

const ToggleGroupContext = React.createContext<VariantProps<typeof toggleVariants> & { activeColor?: string }>({
  size: 'default',
  variant: 'default'
})

const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> &
    VariantProps<typeof toggleVariants> & { activeColor?: string; hoverColor?: string }
>(({ className, variant, size, children, activeColor, hoverColor, style, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn('flex items-center gap-2 flex-wrap', className)}
    style={
      {
        '--toggle-active-bg': activeColor ?? '#fff',
        '--toggle-hover-bg': hoverColor ?? '#2E2E2E',
        ...style
      } as React.CSSProperties
    }
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size, activeColor }}>{children}</ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
))

ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName

const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item> &
    VariantProps<typeof toggleVariants> & { activeColor?: string }
>(({ className, children, variant, size, activeColor, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext)

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant || variant,
          size: context.size || size
        }),
        className
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  )
})

ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName

export { ToggleGroup, ToggleGroupItem }
