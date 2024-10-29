import { Form, message, Modal, theme, type ModalProps } from 'antd'
import { useBoolean } from 'ahooks'
import to from "await-to-js"
import type { ReactNode } from "react"
import { CloseOutlined } from "@ant-design/icons"

export interface UseModalProps extends Omit<ModalProps, 'visible' | 'afterClose'> {
  content: ReactNode
  onOpen?: (...arg: unknown[]) => void
}

export interface UseModalAction {
  open: (...arg: unknown[]) => void
  close: () => void
}

export const useModal = ({ content, onOpen, title, closeIcon, classNames, ...props }: UseModalProps) => {
  const [modalVisible, { toggle: toggleModalVisible }] = useBoolean(false)
  const [visible, { toggle }] = useBoolean(false)
  const { token: themeToken } = theme.useToken()

  const _onCancel: ModalProps['onCancel'] = (e) => {
    props.onCancel ? props.onCancel(e) : toggleModalVisible()
  }



  const render = () => {
    if (!visible) return null
    return (
      <Modal
        open={modalVisible}
        onCancel={_onCancel}
        afterClose={toggle}
        closeIcon={false}
        classNames={{ content: 'custom-model', ...classNames }}
        {...props}>
        <div>
          {
            title && (
              <div className="title text-center h-10" style={{ background: themeToken.colorBgBase }}>
                {
                  !closeIcon && (
                    <span
                      className="bg-[#F36059] box-border rounded-full cursor-pointer  hover:opacity-90 absolute -z-0 w-4 h-4 left-2 top-3 flex items-center justify-center"
                      onClick={toggleModalVisible}
                      onKeyDown={() => { }}
                    >
                      <CloseOutlined className="scale-70" />
                    </span>
                  )
                }
                <span className="line-height-[40px]">{title}</span>
              </div>
            )
          }
          {content}
        </div>
      </Modal>
    )
  }

  const modal: UseModalAction = {
    open: (...arg: unknown[]) => {

      toggleModalVisible()
      toggle()
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

export interface UseFormModalProps extends UseModalProps {
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  onOk: (values: any) => void
}

export const useFormModal = ({ content, onOk, onOpen, ...props }: UseFormModalProps) => {
  const [form] = Form.useForm()
  const [confirmLoading, { setFalse, setTrue }] = useBoolean(false)

  const _onFinish = async (values: unknown) => {
    const [err] = await to(new Promise(r => r(onOk(values))))
   
    setFalse()

    if(err){
      throw err 
    }
  }

  const _content = (
    <Form form={form} onFinish={_onFinish}>
      {
        content
      }
    </Form>
  )

  const _onOpen = (...arg: unknown[]) => {
    form.resetFields()
    onOpen?.(...arg)
  }

  const _onOk = async () => {
    await form.validateFields()
    setTrue()
    form.submit()
  }



  const { modal, context } = useModal({
    content: _content, onOk: () => _onOk(), onOpen: _onOpen, confirmLoading, ...props
  })

  return {
    form,
    formModal: modal,
    context,
    open: modal.open,
    close: modal.close,
    setFieldsValue: form.setFieldsValue,
    getFieldValue: form.getFieldValue
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


