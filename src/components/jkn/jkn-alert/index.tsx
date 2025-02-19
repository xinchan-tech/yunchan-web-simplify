import { AlertDialog, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog'
import { useBoolean, useMount } from "ahooks"
import { nanoid } from "nanoid"
import type { ReactNode } from "react"
import { createRoot } from 'react-dom/client'
import { Button } from "../../ui/button"
import to from "await-to-js"
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'

type AlertAction = 'confirm' | 'cancel' | 'close'

type AlertOptions = {
  content: ReactNode
  title?: ReactNode
  onAction?: (action: AlertAction) => Promise<unknown | boolean>
  cancelBtn?: boolean
}

export const JknAlert = {
  info({ content, title, onAction, cancelBtn }: AlertOptions) {
    let rootEl = document.getElementById('alert-wrapper')

    if (!rootEl) {
      const el = document.createElement('div')
      el.id = 'alert-wrapper'
      document.body.appendChild(el)
      rootEl = el
    }

    const container = document.createElement('div')
    rootEl.appendChild(container)
    container.id = `alert-${nanoid(8)}`

    const root = createRoot(container)

    const destroy = () => {
      // root.unmount()
    }

    root.render(
      <AlertComponent title={title} content={content} afterClose={destroy} onAction={onAction} cancelBtn={cancelBtn} />
    )
  },

  confirm(args: AlertOptions) {
    return JknAlert.info({ cancelBtn: true, ...args })
  }

}

interface AlertDialogProps extends AlertOptions {
  afterClose?: () => void
}

const AlertComponent = (props: AlertDialogProps) => {
  const [open, { setTrue, setFalse }] = useBoolean(false)
  const [loading, { setTrue: setLoadingTrue, setFalse: setLoadingFalse }] = useBoolean(false)
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
    if (props.onAction) {
      setLoadingTrue()
      const [err, r] = await to(props.onAction?.(action))


      if (err) {
        setLoadingFalse()
        throw err
      }
      if (r === false) {
        return
      }
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
          {
            props.title !== undefined ? (
              <AlertDialogTitle>{props.title}</AlertDialogTitle>
            ) : (
              <VisuallyHidden>
                <AlertDialogTitle />
              </VisuallyHidden>
            )
          }
          <AlertDialogDescription className="text-center text-lg mt-4">
            {
              props.content
            }
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {
            props.cancelBtn && (
              <Button variant="outline" onClick={onCancel}>取消</Button>
            )
          }
          <Button onClick={onConfirm}>确认</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}