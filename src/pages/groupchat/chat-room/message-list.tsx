import { JknInfiniteArea } from "@/components"
import { ChatMessageType, useChatStore } from "@/store"
import { useQuery } from "@tanstack/react-query"
import WKSDK, { ConnectStatus, type Message, PullMode } from "wukongimjssdk"
import { TextRecord } from "./components/text-record"
import ChatAvatar from "../components/chat-avatar"
import type { PropsWithChildren } from "react"
import { getTimeFormatStr } from "../chat-utils"

export const ChatMessageList = () => {
  const channel = useChatStore(state => state.lastChannel)
  const state = useChatStore(s => s.state)

  const messages = useQuery({
    queryKey: ['syncMessages', channel?.channelID],
    queryFn: async () => {
      return WKSDK.shared().chatManager.syncMessages(channel!, {
        startMessageSeq: 0,
        endMessageSeq: 0,
        limit: 40,
        pullMode: PullMode.Up,
      })
    },
    enabled: !!channel && state === ConnectStatus.Connected,
  })

  return (
    <JknInfiniteArea className="w-full h-full">
      {messages.data?.map((msg) => (
        <ChatMessageRow key={msg.messageSeq} message={msg}>
          {{
            [ChatMessageType.Text]: <TextRecord message={msg} />,
          }[msg.contentType] ?? null}
        </ChatMessageRow>
      ))}
    </JknInfiniteArea>
  )
}

interface ChatMessageRowProps {
  message: Message
}

const ChatMessageRow = ({ message, children }: PropsWithChildren<ChatMessageRowProps>) => {
  const uid = WKSDK.shared().config.uid

  const { fromName, fromAvatar } = message.remoteExtra.extra || {}

  if (message.remoteExtra.revoke) {
    return (
      <div>
        {children}
      </div>
    )
  }

  if (message.fromUID === uid) {
    return (
      <div className="py-3 px-4 flex justify-end items-start w-full box-border">
        <div className="mr-2.5 flex flex-col items-end">
          <div>
            <span className="text-tertiary text-xs">&nbsp;{getTimeFormatStr(message.timestamp * 1000)}</span>
          </div>
          <div className="bg-[#2C2C2C] rounded p-2">
            {children}
          </div>
        </div>
        <ChatAvatar data={{ name: fromName, avatar: fromAvatar, uid: message.fromUID }} />
      </div>
    )
  }

  return (
    <div className="py-3 px-4 flex items-start w-full box-border">
      <ChatAvatar data={{ name: fromName, avatar: fromAvatar, uid: message.fromUID }} />

      <div className="ml-2.5 flex flex-col items-start">
        <div>
          <span className="text-sm">{fromName}</span>
          <span className="text-tertiary text-xs">&nbsp;{getTimeFormatStr(message.timestamp * 1000)}</span>
        </div>
        <div className="bg-[#2C2C2C] rounded p-2">
          {children}
        </div>
      </div>
    </div>
  )
}