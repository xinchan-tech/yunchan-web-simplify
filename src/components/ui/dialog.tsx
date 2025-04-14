import { cn } from '@/utils/style'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import * as React from 'react'

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-transparent data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContext = React.createContext<
  | {
      drag: (
        content: { x: number; y: number },
        originPoint: { x: number; y: number },
        targetPoint: { x: number; y: number }
      ) => void
    }
  | undefined
>(undefined)

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const uid = React.useId()
  const ele = React.useRef<HTMLDivElement>()
  const drag = React.useCallback(
    (
      content: { x: number; y: number },
      originPoint: { x: number; y: number },
      targetPoint: { x: number; y: number }
    ) => {
      if (!ele.current || ele.current.id !== uid) {
        ele.current = document.getElementById(uid) as HTMLDivElement
      }

      const offset = {
        x: targetPoint.x - originPoint.x,
        y: targetPoint.y - originPoint.y
      }

      const contentRect = {
        left: content.x + offset.x,
        top: content.y + offset.y
      }

      if (ele.current) {
        ele.current.style.left = `${contentRect.left}px`
        ele.current.style.top = `${contentRect.top}px`
        ele.current.style.transform = 'none'
        ele.current.style.transition = 'none'
      }
    },
    [uid]
  )
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        id={uid}
        className={cn(
          'jkn-dialog fixed left-[50%] top-[50%] z-50 grid w-full translate-x-[-50%] translate-y-[-50%] border bg-background duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg',
          'bg-muted text-foreground rounded',
          className
        )}
        {...props}
      >
        <DialogContext.Provider value={{ drag }}>{children}</DialogContext.Provider>
      </DialogPrimitive.Content>
    </DialogPortal>
  )
})
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const clickDownPoints = React.useRef({ x: 0, y: 0 })
  const contentPoints = React.useRef({ x: 0, y: 0 })
  const ctx = React.useContext(DialogContext)

  const onClickDown = (e: React.MouseEvent) => {
    const content = ref.current?.parentElement

    if (!content) return

    const rec = content.getBoundingClientRect()

    contentPoints.current = { x: rec.left, y: rec.top }
    clickDownPoints.current = { x: e.clientX, y: e.clientY }
  }

  const onMouseMove = (e: React.MouseEvent) => {
    if (ctx && e.buttons === 1) {
      const x = e.clientX - clickDownPoints.current.x
      const y = e.clientY - clickDownPoints.current.y
      if (Math.abs(x) > 5 || Math.abs(y) > 5) {
        ctx.drag(
          contentPoints.current,
          { x: clickDownPoints.current.x, y: clickDownPoints.current.y },
          { x: e.clientX, y: e.clientY }
        )
      }
    }
  }

  return (
    <div
      className={cn('flex flex-col text-center sm:text-left ', className)}
      {...props}
      ref={ref}
      onMouseDown={onClickDown}
      onMouseMove={onMouseMove}
      onMouseUp={() => {
        clickDownPoints.current = { x: 0, y: 0 }
        contentPoints.current = { x: 0, y: 0 }
      }}
    />
  )
}
DialogHeader.displayName = 'DialogHeader'

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-4', className)} {...props} />
)
DialogFooter.displayName = 'DialogFooter'

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('leading-none tracking-tight bg-muted py-4 font-normal rounded-t-lg', className)}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-muted-foreground my-0', className)} {...props} />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription
}
