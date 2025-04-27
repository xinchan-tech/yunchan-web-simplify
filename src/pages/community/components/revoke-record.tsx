import type { ChatMessage } from "../lib/types"
import { formatTimeStr } from "../lib/utils"
import { useChatStore } from "../lib/store"
import { useUser } from "@/store"
import { chatEvent } from "../lib/event"

interface RevokeTextRecordProps {
  message: ChatMessage
  revokeMessage: ChatMessage
}

export const RevokeRecord = ({ message, revokeMessage }: RevokeTextRecordProps) => {
  const zone = useChatStore(s => s.config.timezone)
  const format = useChatStore(s => s.config.timeFormat)
  const uid = useUser(s => s.user?.username)

  const onReEdit = () => {
    chatEvent.emit('copy', message)
  }

  return (
    <div className="text-center text-sm text-tertiary my-2.5">
      {formatTimeStr(revokeMessage.timestamp * 1000, {
        timezone: zone,
        format: format
      })}
      &nbsp;
      <span>{revokeMessage.senderName} 撤回了一条消息</span>
      {revokeMessage.senderId === uid && message.senderId === uid ? (
        <span className="text-xs cursor-pointer text-primary ml-2" onClick={onReEdit} onKeyDown={() => { }}>重新编辑</span>
      ) : null}
    </div>
  )
}
