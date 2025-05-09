import { updateUser } from "@/api"
import { useUser } from "@/store"
import { uploadUtils } from "@/utils/oss"
import { useMutation } from "@tanstack/react-query"
import { useUnmount } from "ahooks"
import { useState, useRef, useMemo, type PropsWithChildren } from "react"
import JknAvatar from "../jkn-avatar"
import { Button } from "@/components/ui/button"
import { JknModal } from "../jkn-modal"

interface JknImageUploaderProps {
  src?: string
  title?: string
  onChange?: (url: string) => void
}

export const JknImageUploader = ({ src, onChange, title, children }: PropsWithChildren<JknImageUploaderProps>) => {
  const [img, setImg] = useState<Nullable<string>>(src)
  const fileRef = useRef<File>()


  const inputRef = useRef<HTMLInputElement>(null)

  const onImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]

    if (!file) {
      return
    }

    const reader = new FileReader()

    reader.onload = e => {
      fileRef.current = file
      setImg(e.target?.result as string)
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

      onChange?.(fileUrl.url)
      return true
    }
  })

  return (
    <JknModal trigger={children} title={title} className="w-[400px]" background="rgba(0,0,0,.3)" onOk={() => upload.mutateAsync()} confirmLoading={upload.isPending}>
      <div className="p-4">
        <div className="w-full flex flex-col items-center justify-center">
          <JknAvatar className="w-56 h-56 my-4" src={img ?? undefined} title={title} />
          <div>
            <input type="file" ref={inputRef} hidden accept="image/*" onChange={onImageSelect} />
            <Button variant="outline" onClick={() => inputRef.current?.click()}>
              选择图片
            </Button>
          </div>
        </div>
      </div>
    </JknModal>
  )
}