import * as React from 'react'
import * as TabsPrimitive from '@radix-ui/react-tabs'

import { cn } from '@/utils/style'
import { cva, type VariantProps } from 'class-variance-authority'

const tabsVariants = cva('inline-flex  items-stretch justify-center rounded text-muted-foreground', {
  variants: {
    variant: {
      default: 'border border-solid border-border',
      line: 'relative space-x-4',
      flat: 'text-foreground bg-transparent border-accent border border-solid rounded-[6px] p-0.5 box-border'
    },
    size: {
      sm: 'h-7',
      default: 'h-9',
      lg: 'h-11'
    }
  },
  defaultVariants: {
    variant: 'default',
    size: 'default'
  }
})

const tabsItemVariants = cva(
  'inline-flex items-center cursor-pointer justify-center whitespace-nowrap px-6 py-1 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50  data-[state=active]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-transparent data-[state=active]:bg-accent data-[state=active]:font-medium rounded',
        line: 'text-tertiary data-[state=active]:text-foreground px-1 tabs-item-line inline-block relative',
        flat: 'bg-transparent data-[state=active]:bg-accent rounded'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
)

const Tabs = TabsPrimitive.Root

const TabsContext = React.createContext<VariantProps<typeof tabsVariants>>({
  variant: 'default'
})

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List> & VariantProps<typeof tabsVariants>
>(({ className, variant, size, ...props }, ref) => (
  <TabsContext.Provider value={{ variant }}>
    <TabsPrimitive.List ref={ref} className={cn(tabsVariants({ variant, size }), className)} {...props} />
  </TabsContext.Provider>
))
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger> & VariantProps<typeof tabsItemVariants>
>(({ className, ...props }, ref) => {
  const ctx = React.useContext(TabsContext)
  const { variant } = ctx
  return <TabsPrimitive.Trigger ref={ref} className={cn(tabsItemVariants({ variant }), className)} {...props} />
})
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn(
      'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      className
    )}
    {...props}
  />
))
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }
