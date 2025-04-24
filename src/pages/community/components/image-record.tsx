import { JknImage } from '@/components'
import { useMemo } from 'react'
import type { ChatMessageType, ChatMessageTypes } from "../lib/types"

interface ImageRecordProps {
  message: ChatMessageTypes<ChatMessageType.Image>
}

export const ImageRecord = (props: ImageRecordProps) => {
  const url = useMemo(() => {
    if (props.message.content) return props.message.content

    if (props.message.file){
      return URL.createObjectURL(props.message.file)
    }

    return ''
  }, [props.message])

  const preview = () => {
    JknImage.preview(url)
  }
  return (
    <div className="w-full cursor-zoom-in" onClick={preview} onKeyDown={preview}>
      <img src={url} className="w-full" alt="" />
    </div>
  )
}
