import { useMemo } from "react"
import type { Message, MessageImage } from "wukongimjssdk"

interface ImageRecordProps {
  message: Message
}

export const ImageRecord = (props: ImageRecordProps) => {
  const content = props.message.content as MessageImage

  const url = useMemo(() => {
    if(content.remoteUrl) return content.remoteUrl
    return content.file ? URL.createObjectURL(content.file) : ''
  }, [content.remoteUrl, content.file])

  return (
    <div className="w-full">
      <img src={url} className="w-full" alt="" />
    </div>
  )
}