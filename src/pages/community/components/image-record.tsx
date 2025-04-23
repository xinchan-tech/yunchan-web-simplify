import { JknImage } from '@/components'
import { useMemo } from 'react'
import type { ChatMessageType, ChatMessageTypes } from "../lib/types"

interface ImageRecordProps {
  message: ChatMessageTypes<ChatMessageType.Image>
}

export const ImageRecord = (props: ImageRecordProps) => {
  const content = props.message.content

  const url = useMemo(() => {
    if (content) return content
    return ''
  }, [content])

  const preview = () => {
    JknImage.preview(url)
  }
  return (
    <div className="w-full cursor-zoom-in" onClick={preview} onKeyDown={preview}>
      <img src={url} className="w-full" alt="" />
    </div>
  )
}
