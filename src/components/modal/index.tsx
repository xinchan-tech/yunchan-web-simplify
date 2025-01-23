import { cn } from "@/utils/style"
import { Cross2Icon } from "@radix-ui/react-icons"
import { useBoolean, useUpdateEffect } from 'ahooks'
import to from "await-to-js"
import type { ReactNode } from "react"
import { FormProvider, type UseFormReturn } from "react-hook-form"
import type { z } from "zod"
import { Button } from "../ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog"
import { useConfig } from "@/store"
import { usePropValue } from "@/hooks"

export interface UseModalProps {
  content: ReactNode
  title?: string
  closeIcon?: boolean
  onOpen?: (...arg: any[]) => void
  className?: string
  footer?: boolean | ReactNode
  onOk?: () => void
}

export interface UseModalAction {
  open: (...arg: unknown[]) => void
  close: () => void
  title: (title?: string) => string
}

export const useModal = ({ content, onOpen, title, closeIcon, className, footer, ...props }: UseModalProps) => {
  const [modalVisible, { toggle: toggleModalVisible }] = useBoolean(false)
  const [innerTitle, setInnerTitle] = usePropValue(title)
  const [visible, { setFalse, setTrue }] = useBoolean(false)
  const platform = useConfig(s => s.platform)
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

  const render = () => {
    if (!visible) return null
    return (
      <Dialog open={modalVisible} onOpenChange={_onOpenChange}>
        <DialogContent className={cn('w-[680px]', className)}>
          <DialogHeader>
            <DialogTitle asChild>
              <div>
                {
                  innerTitle && (
                    <div className="title text-center h-10" style={{}}>
                      {
                        closeIcon && (
                          <span
                            className={
                              cn(
                                'bg-[#F36059] box-border rounded-full cursor-pointer  hover:opacity-90 absolute -z-0 w-4 h-4 top-3 flex items-center justify-center',
                                platform === 'mac' ? 'left-2' : 'right-2'
                              )
                            }
                            onClick={toggleModalVisible}
                            onKeyDown={() => { }}
                          >
                            <Cross2Icon className="scale-75" />
                          </span>
                        )
                      }
                      <span className="leading-[40px]">{innerTitle}</span>
                    </div>
                  )
                }
              </div>
            </DialogTitle>
            <DialogDescription className="text-center" />
          </DialogHeader>
          {
            content
          }
          {
            footer === null ? null : (
              footer === undefined ? (
                <DialogFooter className="m-4">
                  <Button variant="outline" onClick={() => toggleModalVisible()}>取消</Button>
                  <Button onClick={() => props.onOk?.()}>确认</Button>
                </DialogFooter>
              ) : (
                footer
              )
            )
          }
        </DialogContent>
      </Dialog >
    )
  }

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

  return {
    modal,
    context: render()
  }
}

export interface UseFormModalProps<T extends z.ZodTypeAny> extends Omit<UseModalProps, 'onOk'> {
  onOk: (values: z.infer<T>) => void
  form: UseFormReturn<z.infer<T>>
}

export const useFormModal = <T extends z.ZodTypeAny>({ content, onOk, onOpen, form, ...props }: UseFormModalProps<T>) => {
  const _onFinish = async (values: z.infer<T>) => {
    const [err] = await to(new Promise(r => r(onOk(values))))

    if (err) {
      throw err
    }
  }

  const _content = (
    <FormProvider {...form}>
      <form className="space-y-8">
        {
          content
        }
      </form>
    </FormProvider>
  )

  const _onOpen = (...arg: unknown[]) => {
    form.reset()
    onOpen?.(...arg)
  }

  const _onOk = async () => {
    await form.trigger()
    form.handleSubmit(_onFinish)()
  }

  const { modal, context } = useModal({
    content: _content, onOpen: _onOpen, onOk: _onOk, ...props
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
