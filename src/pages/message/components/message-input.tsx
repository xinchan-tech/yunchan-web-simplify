import { Button, FormControl, FormField, FormItem, JknIcon, Textarea, useModal } from '@/components'
import { uploadUtils } from '@/utils/oss'
import { useMutation } from '@tanstack/react-query'
import { useUnmount } from 'ahooks'
import { useRef, useState } from 'react'
import { FormProvider, useForm } from 'react-hook-form'

interface MessageInputProps {
  onSend: (message: string, type: string) => void
}

export const MessageInput = (props: MessageInputProps) => {
  const form = useForm()

  const _onSend = () => {
    const values = form.getValues()
    if (!values.message) return

    props.onSend(values.message, '0')
    form.setValue('message', '')
  }

  return (
    <div className="py-4 h-[170px] p-4 box-border flex flex-col">
      <div>
        <ImagePicker onUpload={v => props.onSend(v, '1')} />
      </div>
      <div className="flex justify-stretch flex-1 overflow-hidden h-full">
        <FormProvider {...form}>
          <form className="w-full">
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="h-full">
                  <FormControl>
                    <Textarea className="h-full w-full box-border" placeholder="请输入消息" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </FormProvider>
        <Button className="ml-3 h-full w-24" onClick={_onSend}>
          发送
        </Button>
      </div>
    </div>
  )
}

interface ImagePickerProps {
  onUpload: (fileUrl: string) => void
}

const ImagePicker = (props: ImagePickerProps) => {
  const fileRef = useRef<File>()
  const [image, setImage] = useState<string>('')

  const inputRef = useRef<HTMLInputElement>(null)

  const onImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = e => {
      setImage(e.target?.result as string)
      fileRef.current = file
      uploadModal.modal.open()
    }

    reader.readAsDataURL(file)
  }

  useUnmount(() => {
    fileRef.current = undefined
  })

  const upload = useMutation({
    mutationFn: async () => {
      if (!fileRef.current) return
      const f = fileRef.current
      const fileUrl = await uploadUtils.upload(f, f.name)

      props.onUpload(fileUrl.url)
    },
    onSuccess: () => {
      uploadModal.modal.close()
    }
  })

  const uploadModal = useModal({
    title: '发送图片',
    className: 'w-auto',
    content: action => (
      <div className="py-8 px-24 box-border">
        <div className="w-[600px] h-[600px] border border-solid border-border overflow-hidden">
          <img className="object-cover w-full" src={image} alt="" />
        </div>
        <div className="space-x-12 mt-4 text-center">
          <Button size="mini" variant="outline" onClick={() => action.close()}>
            取消
          </Button>
          <Button size="mini" onClick={() => action.onOk?.()}>
            发送
          </Button>
        </div>
      </div>
    ),
    footer: null,
    onOk: async () => {
      // upload.mutate()
      upload.mutate()
    }
  })

  return (
    <div className="inline-block">
      <div className="w-full flex flex-col items-center justify-center">
        <input type="file" ref={inputRef} hidden accept="image/*" onChange={onImageSelect} />
        <JknIcon name="pick_image" className="rounded-none" onClick={() => inputRef.current?.click()} />
      </div>
      {uploadModal.context}
    </div>
  )
}
