import { useBoolean, useUpdate, useUpdateEffect } from 'ahooks'
import to from "await-to-js"
import type { ReactNode } from "react"
import { Form } from "react-router-dom"
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader, DialogFooter } from "../ui/dialog"
import { Cross2Icon } from "@radix-ui/react-icons"
import useZForm from "@/hooks/use-z-form"
import { FieldValues, UseFormReturn } from "react-hook-form"
import { Button } from "../ui/button"

export interface UseModalProps {
  content: ReactNode
  title?: string
  closeIcon?: boolean
  onOpen?: (...arg: unknown[]) => void
  className?: string
  footer?: boolean | ReactNode
  onOk?: () => void
}

export interface UseModalAction {
  open: (...arg: unknown[]) => void
  close: () => void
}

export const useModal = ({ content, onOpen, title, closeIcon, className, footer, ...props }: UseModalProps) => {
  const [modalVisible, { toggle: toggleModalVisible }] = useBoolean(false)
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

  const render = () => {
    if (!visible) return null
    return (
      <Dialog open={modalVisible} onOpenChange={_onOpenChange}>
        <DialogContent className={className}>
          <DialogHeader>
            <DialogTitle asChild>
              <div>
                {
                  title && (
                    <div className="title text-center h-10" style={{}}>
                      {
                        !closeIcon && (
                          <span
                            className="bg-[#F36059] box-border rounded-full cursor-pointer  hover:opacity-90 absolute -z-0 w-4 h-4 left-2 top-3 flex items-center justify-center"
                            onClick={toggleModalVisible}
                            onKeyDown={() => { }}
                          >
                            <Cross2Icon className="scale-75" />
                          </span>
                        )
                      }
                      <span className="leading-[40px]">{title}</span>
                    </div>
                  )
                }
              </div>
            </DialogTitle>
          </DialogHeader>
          {
            content
          }
          {
            footer !== false && (
              footer === undefined ? (
                <DialogFooter>
                  <Button onClick={() => toggleModalVisible()}>取消</Button>
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
    }
  }

  return {
    modal,
    context: render()
  }
}

export interface UseFormModalProps<T extends FieldValues> extends Omit<UseModalProps, 'onOk'> {
  onOk: (values: T) => void
  form: UseFormReturn<T>
}

export const useFormModal = <T extends FieldValues>({ content, onOk, onOpen, form, ...props }: UseFormModalProps<T>) => {
  const _onFinish = async (values: T) => {
    const [err] = await to(new Promise(r => r(onOk(values))))

    if (err) {
      throw err
    }
  }

  const _content = (
    <Form {...form}>
      <form className="space-y-8">

      </form>
    </Form>
    // <Form form={form} onFinish={_onFinish}>
    //   {
    //     content
    //   }
    // </Form>
  )

  const _onOpen = (...arg: unknown[]) => {
    form.reset()
    onOpen?.(...arg)
  }

  const _onOk = () => {
    form.handleSubmit(_onFinish)
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
    setFieldsValue: form.setValue,
    getFieldValue: form.getValues
  }
}

interface SimpleFormModalOptions {
  title: string
  content: ReactNode
  create: (values: unknown) => Promise<unknown>
  update: (values: unknown) => Promise<unknown>
  refresh: () => void
}

export const useSimpleFormModal = (props: SimpleFormModalOptions) => {
  const form = useFormModal({
    title: props.title,
    content: props.content,
    className: 'w-form',
    onOk: async (values) => {
      const [err] = await to(((values as { id: number | string }).id ? props.update?.(values) : props.create?.(values)))

      if (err) {
        message.error(err.message)
        return
      }

      message.success('操作成功')
      form.close()
      props.refresh()
    },
    onOpen: (v: unknown) => {
      form.form.setFieldsValue(v)
    }
  })

  return form
}

type JknModalOptions = Parameters<typeof Modal.info>[0]

export const JknModal = {
  info({ content, title, closeIcon, ...args }: JknModalOptions) {
    const model = Modal.info({
      className: 'custom-static-model',
      title: null,
      icon: null,
      centered: true,
      content: (
        <div className="text-white">
          {
            title && (
              <div className="title text-center text-white h-10" style={{ background: 'var(--bg-secondary-color)' }}>
                {
                  !closeIcon && (
                    <span
                      className="bg-[#F36059] box-border rounded-full cursor-pointer  hover:opacity-90 absolute -z-0 w-4 h-4 left-2 top-3 flex items-center justify-center"
                      onClick={() => model.destroy()}
                      onKeyDown={() => { }}
                    >
                      <CloseOutlined className="scale-75" />
                    </span>
                  )
                }
                <span className="leading-[40px]">{title}</span>
              </div>
            )
          }
          {
            typeof content === 'string' ? (
              <div className="text-white text-center mt-4">{content}</div>
            ) : (
              content
            )
          }
        </div>
      ),
      ...args
    })

    return model
  },

  confirm(args: JknModalOptions) {
    return JknModal.info(args)
  }

}