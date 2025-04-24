import { Button, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, JknIcon } from "@/components"
import { cn } from "@/utils/style"
import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import { isFunction } from "@tanstack/react-table"
import { useBoolean } from "ahooks"
import type { PropsWithChildren, ReactNode } from "react"

type ModalAction = {
  close: () => void
  open: () => void
}

interface JknModalProps {
  title?: ReactNode
  closeIcon?: boolean
  trigger: ReactNode
  className?: string
  footer?: ReactNode | ((action: ModalAction) => ReactNode) | null
  confirmLoading?: boolean
  closeOnMaskClick?: boolean
  background?: string
  onOk?: () => Promise<boolean | undefined> | boolean |  undefined
  onClose?: () => void
  afterClose?: () => void
}

export const JknModal = ({ background, className, closeOnMaskClick, closeIcon = true, title, footer, confirmLoading, children, trigger, onOk, onClose, afterClose }: PropsWithChildren<JknModalProps>) => {
  const [visible, { setTrue: setOpen, setFalse: setClose }] = useBoolean(false)

  const onPointerDownOutside = (e: any) => {
    if (closeOnMaskClick) {
      e.preventDefault()
      e.stopPropagation()
    }
  }

  const _onClose = () => {
    setClose()
    onClose?.()
    setTimeout(() => {
      afterClose?.()
    }, 300)
  }

  const _onOk = () => {
    if(!onOk) {
      _onClose()
      return
    }

    const result = onOk()

    if (result instanceof Promise) {
      result.then(res => {
        if (res !== false) {
          _onClose()
        }
      })
    } else if (result !== false) {
      _onClose()
    }
  }


  return (
    <Dialog open={visible} onOpenChange={v => v ? setOpen() : _onClose()} modal>
      <DialogTrigger asChild>
        <div>
          {trigger}
        </div>
      </DialogTrigger>
      <DialogContent
        background={background}
        className={cn('w-fit', className)}
        onPointerDownOutside={onPointerDownOutside}
        onOpenAutoFocus={e => e.preventDefault()}
      >
        {title ? (
          <DialogHeader>
            <DialogTitle asChild>
              <div className="px-5 flex items-center pt-5 pb-[15px]">
                <div className="text-xl">{title}</div>
                {closeIcon && (
                  <DialogClose asChild
                    className={cn(
                      'box-border rounded cursor-pointer flex items-center justify-center ml-auto w-5 h-5 hover:bg-accent'
                    )}
                    onKeyDown={() => { }}
                  >
                    <span> <JknIcon.Svg name="close" className="w-3 h-3" /></span>
                  </DialogClose>
                )}
              </div>
            </DialogTitle>
            <DialogDescription className="text-center" />
          </DialogHeader>
        ) : (
          <VisuallyHidden>
            <DialogHeader>
              {' '}
              <DialogTitle />
            </DialogHeader>
            <DialogDescription className="text-center" />
          </VisuallyHidden>
        )}
        {children}
        {footer === null ? null : footer === undefined ? (
          <DialogFooter className="m-4">
            <Button variant="outline" className="w-24 box-border" onClick={() => _onClose()}>
              取消
            </Button>
            <Button className="w-24 box-border " loading={confirmLoading} onClick={_onOk}>
              确认
            </Button>
          </DialogFooter>
        ) : (
          <DialogFooter className="m-4">
            {
              isFunction(footer) ? footer({ open: setOpen, close: setClose }) : footer
            }
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}