import { usePropValue } from '@/hooks'
import { useConfig } from '@/store'
import { cn } from '@/utils/style'
import type { DialogContentProps } from '@radix-ui/react-dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { isFunction } from '@tanstack/react-table'
import { useBoolean, useUpdateEffect } from 'ahooks'
import to from 'await-to-js'
import { type ReactNode, useCallback } from 'react'
import { FormProvider, type UseFormReturn } from 'react-hook-form'
import type { z } from 'zod'
import { JknIcon } from '../jkn/jkn-icon'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'

export interface UseModalAction {
  open: (...arg: unknown[]) => void
  close: () => void
  title: (title?: string) => string
}

export interface UseModalProps {
  content: ReactNode | ((action: UseModalAction & Pick<UseModalProps, 'onOk'>) => ReactNode)
  title?: string
  closeIcon?: boolean
  onOpen?: (...arg: any[]) => void
  className?: string
  footer?: boolean | ReactNode
  onOk?: (...arg: any[]) => void
  confirmLoading?: boolean
  closeOnMaskClick?: boolean
  background?: string
}

export const useModal = ({
  content,
  onOpen,
  title,
  closeIcon,
  className,
  footer,
  confirmLoading,
  background,
  ...props
}: UseModalProps) => {
  const [modalVisible, { toggle: toggleModalVisible }] = useBoolean(false)
  const [innerTitle, setInnerTitle] = usePropValue(title)
  const [visible, { setFalse, setTrue }] = useBoolean(false)
  const _onOpenChange = (open?: boolean) => {
    if (!open) {
      toggleModalVisible()
    }
  }

  useUpdateEffect(() => {
    if (!modalVisible) {
      setTimeout(() => {
        setFalse()
      }, 200)
    }
  }, [modalVisible])

  const onPointerDownOutside = useCallback<NonNullable<DialogContentProps['onPointerDownOutside']>>(
    e => {
      if (props.closeOnMaskClick === false) {
        e.stopPropagation()
        e.preventDefault()
      }
    },
    [props.closeOnMaskClick]
  )

  const modal: UseModalAction = {
    open: (...arg: unknown[]) => {
      toggleModalVisible()
      setTrue()
      onOpen?.(...arg)
    },
    close: () => {
      toggleModalVisible()
    },
    title: (title?: string) => {
      if (title) {
        setInnerTitle(title)
        return title
      }

      return ''
    }
  }

  const render = () => {
    if (!visible) return null
    return (
      <Dialog open={modalVisible} onOpenChange={_onOpenChange} modal>
        <DialogContent
          background={background}
          className={cn('w-[680px]', className)}
          onPointerDownOutside={onPointerDownOutside}
          onOpenAutoFocus={e => e.preventDefault()}
        >
          {innerTitle ? (
            <DialogHeader>
              <DialogTitle asChild>
                <div className="px-5 flex items-center pt-5 pb-[15px]  border-[#3D3D3D]">
                  {innerTitle && <div className="text-xl">{innerTitle}</div>}
                  {closeIcon && (
                    <span
                      className={cn(
                        'box-border rounded cursor-pointer flex items-center justify-center ml-auto w-5 h-5 hover:bg-accent'
                      )}
                      onClick={toggleModalVisible}
                      onKeyDown={() => {}}
                    >
                      <JknIcon.Svg name="close" className="w-3 h-3" />
                    </span>
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
            </VisuallyHidden>
          )}
          {isFunction(content) ? content({ ...modal, onOk: props.onOk }) : content}
          {footer === null ? null : footer === undefined ? (
            <DialogFooter className="m-4">
              <Button variant="outline" className="w-24 box-border" onClick={() => toggleModalVisible()}>
                取消
              </Button>
              <Button className="w-24 box-border " loading={confirmLoading} onClick={() => props.onOk?.()}>
                确认
              </Button>
            </DialogFooter>
          ) : (
            footer
          )}
        </DialogContent>
      </Dialog>
    )
  }

  return {
    modal,
    context: render()
  }
}

export interface UseFormModalProps<T extends z.ZodTypeAny> extends Omit<UseModalProps, 'onOk' | 'content'> {
  content: ReactNode
  onOk: (values: z.infer<T>) => void
  form: UseFormReturn<z.infer<T>>
}

export const useFormModal = <T extends z.ZodTypeAny>({
  content,
  onOk,
  onOpen,
  form,
  ...props
}: UseFormModalProps<T>) => {
  const _onFinish = async (values: z.infer<T>) => {
    const [err] = await to(new Promise(r => r(onOk(values))))

    if (err) {
      throw err
    }
  }

  const _onOpen = (...arg: unknown[]) => {
    form.reset()
    onOpen?.(...arg)
  }

  const _onOk = async () => {
    await form.trigger()
    form.handleSubmit(_onFinish)()
  }

  const _content = (
    <FormProvider {...form}>
      <form className="space-y-8">{content}</form>
    </FormProvider>
  )

  const { modal, context } = useModal({
    content: _content,
    onOpen: _onOpen,
    onOk: _onOk,
    ...props
  })

  return {
    form,
    formModal: modal,
    context,
    open: modal.open,
    close: modal.close,
    title: modal.title,
    setFieldsValue: form.setValue,
    getFieldValue: form.getValues
  }
}
