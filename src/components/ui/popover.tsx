import * as PopoverPrimitive from '@radix-ui/react-popover'
import * as React from 'react'

import { cn } from '@/utils/style'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { isFunction } from 'radash'

const Popover = PopoverPrimitive.Root

const PopoverTrigger = PopoverPrimitive.Trigger

const PopoverAnchor = PopoverPrimitive.Anchor

const PopoverClose = PopoverPrimitive.Close

type PopoverContentProps = Omit<React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>, 'children'> & {
  children: React.ReactNode | ((action: { close: () => void }) => React.ReactNode)
}

const PopoverContent = React.forwardRef<React.ElementRef<typeof PopoverPrimitive.Content>, PopoverContentProps>(
  ({ className, align = 'center', sideOffset = 4, children, ...props }, ref) => {
    const closeButtonRef = React.useRef<HTMLButtonElement>(null)
    const onClose = React.useCallback(() => {
      closeButtonRef.current?.click()
      console.log(closeButtonRef)
    }, [])
    return (
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          ref={ref}
          align={align}
          sideOffset={sideOffset}
          className={cn(
            'z-50 w-72 overflow-hidden rounded-sm border-solid border border-dialog-border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            className
          )}
          // biome-ignore lint/correctness/noChildrenProp: <explanation>
          children={
            <div>
              {isFunction(children) ? children({ close: onClose }) : children}
              <VisuallyHidden>
                <PopoverClose ref={closeButtonRef}></PopoverClose>
              </VisuallyHidden>
            </div>
          }
          {...props}
        />
      </PopoverPrimitive.Portal>
    )
  }
)
PopoverContent.displayName = PopoverPrimitive.Content.displayName

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor, PopoverClose }
