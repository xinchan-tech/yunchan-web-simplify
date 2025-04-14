import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast'
import { useToast } from '@/hooks'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider swipeDirection="down" duration={3000}>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1 text-center w-full">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <VisuallyHidden>
            <ToastClose />
          </VisuallyHidden>
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}
