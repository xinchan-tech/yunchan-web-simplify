import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { useBoolean, useMount } from 'ahooks'
import to from 'await-to-js'
import { nanoid } from 'nanoid'
import type { ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { Button, type ButtonProps } from '../../ui/button'
import { JknIcon } from '../jkn-icon'

type AlertAction = 'confirm' | 'cancel' | 'close'

type AlertOptions = {
  content: ReactNode
  title?: ReactNode
  onAction?: (action: AlertAction) => Promise<unknown | boolean>
  cancelBtn?: boolean
  okBtnText?: string
  closeIcon?: boolean
  okBtnVariant?: ButtonProps['variant']
}

type PureAlertOptions = {
  content: ReactNode
  duration?: number
}

export const JknAlert = {
  info({ content, title, onAction, cancelBtn, okBtnText, closeIcon, okBtnVariant }: AlertOptions) {
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
      <AlertComponent
        title={title}
        content={content}
        afterClose={destroy}
        onAction={onAction}
        cancelBtn={cancelBtn}
        okBtnText={okBtnText}
        closeIcon={closeIcon}
        okBtnVariant={okBtnVariant}
      />
    )
  },

  confirm(args: AlertOptions) {
    return JknAlert.info({ cancelBtn: true, ...args })
  },

  success(args: PureAlertOptions | string) {
    let _args = {} as PureAlertOptions
    if (typeof args === 'string') {
      _args = { content: args }
    }
    const { content, duration } = _args

    const _content = (
      <div className="text-center flex flex-col items-center">
        <div className="size-8 rounded-full border border-solid border-foreground flex items-center justify-center">
          <JknIcon.Svg name="check" size={16} className="" />
        </div>
        <div className="text-center mt-2.5">{content}</div>
      </div>
    )

    toast({
      content: _content,
      duration
    })
  },

  toast(args: PureAlertOptions | string) {
    let _args = {} as PureAlertOptions
    if (typeof args === 'string') {
      _args = { content: args }
    }
    const { content, duration } = _args

    const _content = (
      <div className="text-center flex flex-col items-center">
        <div className="size-8 rounded-full border border-solid border-foreground flex items-center justify-center">
          <JknIcon.Svg name="check" size={16} className="" />
        </div>
        <div className="text-center mt-2.5">{content}</div>
      </div>
    )

    toast({
      content: _content,
      duration
    })
  }
}

interface AlertDialogProps extends AlertOptions {
  afterClose?: () => void
  okBtnText?: string
  closeIcon?: boolean
  okBtnVariant?: ButtonProps['variant']
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
    <AlertDialog open={open} onOpenChange={open => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <p className="flex items-center w-full box-border p-4 my-0">
            {props.title !== undefined ? (
              <AlertDialogTitle>{props.title}</AlertDialogTitle>
            ) : (
              <VisuallyHidden>
                <AlertDialogTitle />
              </VisuallyHidden>
            )}
            {props.closeIcon !== false ? (
              <JknIcon.Svg name="close" size={14} className="ml-auto text-foreground p-1" hoverable onClick={onClose} />
            ) : null}
          </p>
        </AlertDialogHeader>
        <AlertDialogDescription className="text-center text-lg">{props.content}</AlertDialogDescription>
        <AlertDialogFooter className="justify-end">
          {props.cancelBtn && (
            <Button className="w-[72px]" variant="outline" onClick={onCancel}>
              取消
            </Button>
          )}
          <Button className="w-[72px]" variant={props.okBtnVariant} onClick={onConfirm}>
            {props.okBtnText ?? '确认'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

interface PureAlertComponentProps {
  content: ReactNode
  afterClose?: () => void
  duration?: number
}

const PureAlertComponent = (props: PureAlertComponentProps) => {
  const [open, { setTrue, setFalse }] = useBoolean(false)

  const waitAction = async () => {
    setFalse()

    setTimeout(() => {
      props.afterClose?.()
    }, 250)
  }

  useMount(() => {
    setTrue()

    setTimeout(
      () => {
        waitAction()
      },
      props.duration || 3 * 1000
    )
  })

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="w-fit px-5 py-4 rounded-[12px] min-w-[102px] min-h-[102px] flex items-center justify-center box-border">
        <VisuallyHidden>
          <AlertDialogHeader>
            <AlertDialogTitle />
          </AlertDialogHeader>
        </VisuallyHidden>
        <AlertDialogDescription className="text-center p-0">{props.content}</AlertDialogDescription>
      </AlertDialogContent>
    </AlertDialog>
  )
}

const toast = (props: PureAlertOptions) => {
  let rootEl = document.getElementById('alert-pure-wrapper')

  if (!rootEl) {
    const el = document.createElement('div')
    el.id = 'alert-pure-wrapper'
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

  root.render(<PureAlertComponent content={props.content} duration={props.duration} afterClose={destroy} />)
}
