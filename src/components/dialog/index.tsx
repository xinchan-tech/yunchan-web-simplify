import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { useBoolean, useMount } from "ahooks"
import { nanoid } from "nanoid"
import { ReactNode } from "react"
import { createRoot } from 'react-dom/client'


export const JknAlert = {
  info({ content, title }: unknown) {
    let rootEl = document.getElementById('alert-wrapper')

    if (!rootEl) {
      const el = document.createElement('div')
      el.id = 'alert-wrapper'
      document.body.appendChild(el)
      rootEl = el
    }

    const container = document.createElement('div')
    container.id = `alert-${nanoid(8)}`

    const root = createRoot(container)

    const destroy = () => {
      root.unmount()
    }

    root.render(
      <AlertComponent title={title} content={content} afterClose={destroy} />
    )
  },

  // confirm(args: JknModalOptions) {
  //   return JknModal.info(args)
  // }

}

interface AlertDialogProps {
  content: ReactNode
  title: string
  cancelBtn?: boolean
  onAction?: (action: 'confirm' | 'cancel' | 'close') => Promise<undefined | boolean>
  afterClose?: () => void
}

const AlertComponent = (props: AlertDialogProps) => {
  const [open, { setTrue, setFalse }] = useBoolean(false)
  const onClose = () => {
    waitAction('close')
  }

  const onCancel = () => {
    waitAction('cancel')
  }

  const onConfirm = () => {
    waitAction('confirm')
  }

  useMount(() => {
    setTrue()
  })

  const waitAction = async (action: 'confirm' | 'cancel' | 'close') => {
    const r = await props.onAction?.(action)

    if (r === false) {
      return
    }

    setFalse()

    setTimeout(() => {
      props.afterClose?.()
    }, 250)
  }

  return (
    <AlertDialog open={open} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{props.title}</AlertDialogTitle>
          <AlertDialogDescription>
            {
              props.content
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {
            props.cancelBtn && (
              <AlertDialogCancel onClick={onCancel}>取消</AlertDialogCancel>
            )
          }
          <AlertDialogAction>确认</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}