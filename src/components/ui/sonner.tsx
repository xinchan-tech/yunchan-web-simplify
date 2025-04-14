import { useTheme } from 'next-themes'
import { Toaster as Sonner } from 'sonner'

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="bottom-left"
      expand
      toastOptions={{
        classNames: {
          toast:
            'group toast group-[.toaster]:bg-muted group-[.toaster]:text-foreground group-[.toaster]:border-accent !p-0 !rounded-[12px] !w-fit',
          description: 'group-[.toast]:text-foreground !w-fit',
          actionButton: 'group-[.toast]:bg-primary group-[.toast]:text-primary-foreground',
          cancelButton: 'group-[.toast]:bg-muted group-[.toast]:text-muted-foreground'
        }
      }}
      {...props}
    ></Sonner>
  )
}

export { Toaster as Sonner }
