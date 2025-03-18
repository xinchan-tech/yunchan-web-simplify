import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, JknInfiniteArea } from "@/components"
import { ChatMessageType, useChatStore } from "@/store"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import WKSDK, { CMDContent, ConnectStatus, Message, PullMode } from "wukongimjssdk"
import { TextRecord } from "./components/text-record"
import ChatAvatar from "../components/chat-avatar"
import { useEffect, useRef, type ComponentRef, type PropsWithChildren } from "react"
import { getTimeFormatStr } from "../chat-utils"
import { useMessageListener, useMessageRevokeListener } from "../lib/hooks"
import { useUpdate } from "ahooks"
import { RevokeRecord } from "./components/revoke-record"
import { ImageRecord } from "./components/image-record"
import { ChatSubscriber } from "../lib/modal"
import { chatEvent } from "../lib/event"
import { revokeMessage } from "@/api"

export const ChatMessageList = () => {
  const channel = useChatStore(state => state.lastChannel)
  const state = useChatStore(s => s.state)
  const queryClient = useQueryClient()
  const scrollRef = useRef<ComponentRef<typeof JknInfiniteArea>>(null)
  const update = useUpdate()
  const messages = useQuery({
    queryKey: ['syncMessages', channel?.channelID],
    queryFn: async () => {
      return WKSDK.shared().chatManager.syncMessages(channel!, {
        startMessageSeq: 0,
        endMessageSeq: 0,
        limit: 40,
        pullMode: PullMode.Down,
      })
    },
    enabled: !!channel && state === ConnectStatus.Connected,
  })

  useEffect(() => {
    if (!messages.isLoading) {
      setTimeout(() => {
        scrollRef.current?.scrollToBottom()
      }, 100)
    }
  }, [messages.isLoading])

  useMessageListener((message) => {
    if (message.channel.channelID !== channel?.channelID) return

    const isOnBottom = scrollRef.current?.isOnLimit()

    queryClient.setQueryData<typeof messages.data>(['syncMessages', channel?.channelID], (oldData) => {
      if (!oldData) return
      return [
        ...oldData,
        message
      ]
    })

    if (isOnBottom) {
      setTimeout(() => {
        scrollRef.current?.scrollToBottom()
      }, 100)
    }
  })

  useMessageRevokeListener((cmd) => {
    const message = messages.data?.find(msg => msg.messageID === cmd.content.param.message_id)
    if (!message) return

    queryClient.setQueryData<typeof messages.data>(['syncMessages', channel?.channelID], (oldData) => {
      if (!oldData) return
      return oldData.map(msg => {
        if (msg.messageID === message.messageID) {
          return cmd
        }
        return msg
      })
    })

    update()
  })

  return (
    <JknInfiniteArea className="w-full h-full chat-message-scroll-list" ref={scrollRef}>
      {messages.data?.map((msg) => (
        <ChatMessageRow key={msg.messageID} message={msg}>
          {{
            [ChatMessageType.Text]: <TextRecord message={msg} />,
            [ChatMessageType.RevokeMessage]: <RevokeRecord onReEdit={() => { }} />,
            [ChatMessageType.Image]: <ImageRecord message={msg} />,
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

  const isSelfMessage = message.fromUID === uid

  if (message.contentType === ChatMessageType.RevokeMessage) {
    return (
      <div className="py-1.5 text-xs text-tertiary text-center">
        {children}
      </div>
    )
  }

  if (isSelfMessage) {
    return (
    <div className="py-3 px-4 flex justify-end items-start box-border">
      <ChatMessageRowMenu message={message}>
        <div className="mr-2.5 flex flex-col items-end overflow-hidden" style={{ maxWidth: '50%' }}>
          <div>
            <span className="text-tertiary text-xs">&nbsp;{getTimeFormatStr(message.timestamp * 1000)}</span>
          </div>
          <div className="bg-[#586EAC] rounded p-2.5 text-sm min-h-8 box-border w-full overflow-hidden whitespace-normal break-words leading-tight">
            {children}
          </div>
        </div>
        </ChatMessageRowMenu>
        <ChatAvatar data={{ name: fromName, avatar: fromAvatar, uid: message.fromUID }} radius="4" />
      </div>
    )
  }

  return (
    <div className="py-3 px-4 flex items-start box-border" style={{ maxWidth: '50%' }}>
      <ChatAvatar data={{ name: fromName, avatar: fromAvatar, uid: message.fromUID }} />
      <ChatMessageRowMenu message={message}>
        <div className="ml-2.5 flex flex-col items-start" style={{ maxWidth: '50%' }}>
          <div>
            <span className="text-sm">{fromName}</span>
            <span className="text-tertiary text-xs">&nbsp;{getTimeFormatStr(message.timestamp * 1000)}</span>
          </div>
          <div className="bg-[#2C2C2C] rounded p-2.5 text-sm min-h-8 box-border w-full overflow-hidden whitespace-normal break-words leading-tight">
            {children}
          </div>
        </div>
      </ChatMessageRowMenu>
    </div>
  )
}

interface ChatMessageRowMenuProps {
  message: Message
}

const ChatMessageRowMenu = (props: PropsWithChildren<ChatMessageRowMenuProps>) => {
  const { message, children } = props

  const subscriber = WKSDK.shared().channelManager.getSubscribeOfMe(message.channel) as ChatSubscriber

  const onCopyMessage = () => {
    chatEvent.emit('copyMessage', {channelId: message.channel.channelID, message})
  }

  const onRevokeMessage = () => {
    revokeMessage({ msg_id: message.messageID })
  }

  const onReplyMessage = () => {
    chatEvent.emit('replyMessage', {channelId: message.channel.channelID, message})
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
       {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onCopyMessage}>
          <span>复制</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onReplyMessage}>
          <span>回复</span>
        </ContextMenuItem>
        {
          subscriber.isChannelManager || subscriber.isChannelOwner || subscriber.uid === message.fromUID ? (
            <ContextMenuItem onClick={onRevokeMessage}>
              <span>撤回</span>
            </ContextMenuItem>
          ): null
        }
        
      </ContextMenuContent>
    </ContextMenu>
  )
}