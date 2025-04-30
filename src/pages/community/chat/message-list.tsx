import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, JknIcon, JknVirtualInfinite } from "@/components"
import { type ComponentRef, useCallback, useRef, type PropsWithChildren, useMemo, useLayoutEffect, useState } from "react"
import WKSDK, { MessageStatus } from "wukongimjssdk"
import { UserAvatar } from "../components/user-avatar"
import { chatEvent } from "../lib/event"
import { type ChatCmdMessage, ChatCmdType, type ChatMessage, ChatMessageType, type ChatMessageTypes, type ChatReplyContent, type ChatSubscriber } from "../lib/types"
import { TextRecord } from "../components/text-record"
import { ImageRecord } from "../components/image-record"
import { SystemRecord } from "../components/system-record"
import { useChatStore } from "../lib/store"
import { VoteRecord } from "../components/vote-record"
import { formatTimeStr } from "../lib/utils"
import { RevokeRecord } from "../components/revoke-record"

interface MessageListProps {
  messages: ChatMessage[]
  onFetchMore: () => void
  hasMore: boolean
  me: Nullable<ChatSubscriber>
}
export const MessageList = ({ messages, onFetchMore, hasMore, me }: MessageListProps) => {
  // const [innerMessages, setInnerMessages] = useImmer<ChatMessage[]>(messages)
  const scrollRef = useRef<ComponentRef<typeof JknVirtualInfinite>>(null)
  const lastMessageRange = useRef<Nullable<{ index: number, data: ChatMessage }>>()
  const [showToBottom, setShowToBottom] = useState(false)


  useLayoutEffect(() => {
    const virtual = scrollRef.current?.getVirtualizer()
    if (!virtual) return
    if (!messages.length) {
      lastMessageRange.current = null
      virtual.scrollToOffset(Number.MAX_SAFE_INTEGER, { align: 'start' })
      return
    }

    if (lastMessageRange.current === null) {
      virtual.scrollToIndex(messages.length, { align: 'end' })
      lastMessageRange.current = { index: messages.length, data: messages[messages.length - 1] }
      return
    }

    if (lastMessageRange.current?.index === 0) {
      const idx = messages.findIndex(v => v.id === lastMessageRange.current?.data.id)

      if (idx === -1) return

      if(idx === 0) return

      virtual.scrollToIndex(idx, { align: 'start' })
      lastMessageRange.current = { index: idx, data: messages[idx] }
      return
    }

    const virtualLast = virtual.getVirtualItems()[virtual.getVirtualItems().length - 1]?.index

    if (!virtualLast) return

    if (virtualLast >= messages.length - 1) {
      virtual.scrollToIndex(messages.length - 1, { align: 'end' })
      lastMessageRange.current = { index: messages.length - 1, data: messages[messages.length - 1] }
    } else {
      setShowToBottom(true)
    }

  }, [messages])

  const toBottomMessage = useCallback(() => {
    const virtual = scrollRef.current?.getVirtualizer()
    if (!virtual) return

    if (messages.length > 0) {
      virtual.scrollToIndex(messages.length - 1, { align: 'end' })
      lastMessageRange.current = { index: messages.length - 1, data: messages[messages.length - 1] }
      setShowToBottom(false)
    }
  }, [messages])

  const revokeMessage = useMemo(() => {
    const revoke = messages.filter((msg) => msg.type === ChatMessageType.Cmd && msg.cmdType === ChatCmdType.MessageRevoke) as ChatCmdMessage[]

    const r: Record<string, ChatCmdMessage> = {}

    revoke.forEach((msg: ChatCmdMessage) => {
      if (msg.cmdType !== ChatCmdType.MessageRevoke) return
      r[msg.messageId] = msg as ChatCmdMessage
    })

    return r

  }, [messages])

  const onScrollToTop = useCallback((e: { startIndex?: number, endIndex?: number }) => {
    lastMessageRange.current = {
      index: e.startIndex ?? 0,
      data: messages[e.startIndex ?? 0]
    }
  }, [messages])

  return (
    <div className="flex-1 w-full relative overflow-hidden">
      <JknVirtualInfinite
        className="size-full chat-message-scroll-list"
        itemHeight={44}
        ref={scrollRef}
        rowKey="id"
        data={messages ?? []}
        hasMore={hasMore}
        direction="up"
        onScrollToTop={onScrollToTop}
        onScrollToBottom={() => setShowToBottom(false)}
        key="id"
        autoBottom
        fetchMore={onFetchMore}
        renderItem={(msg: ChatMessage) => (
          <ChatMessageRow key={msg.id} message={msg} isRevokeMessage={revokeMessage[msg.id]} me={me} />
        )}
      />
      {
        showToBottom ? (
          <div className="absolute bottom-3 right-3 flex justify-center items-center rounded-[300px] cursor-pointer bg-[#586eac]  text-xs px-3 py-1" onClick={toBottomMessage} onKeyDown={() => { }}>
            <span>新消息</span>
            &nbsp;
            <JknIcon.Svg name="arrow-down" size={12} />
          </div>
        ) : null
      }
    </div>
  )
}

interface ChatMessageRowProps {
  message: ChatMessage
  isRevokeMessage: Nullable<ChatCmdMessage>
  me: Nullable<ChatSubscriber>
}

const ChatMessageRow = ({ message, isRevokeMessage, me }: PropsWithChildren<ChatMessageRowProps>) => {
  const uid = WKSDK.shared().config.uid
  const timeZone = useChatStore(s => s.config.timezone)
  const timeFormat = useChatStore(s => s.config.timeFormat)
  const isSelfMessage = message.senderId === uid

  if(message.type === ChatMessageType.Cmd){
    return null
  }

  if (message.type === ChatMessageType.System) {
    if (message.content) {
      return (
        <div className="text-center py-2.5 text-sm text-tertiary">
          {message.content}
        </div>
      )
    }

    return null
  }

  if (message.type === ChatMessageType.ChannelUpdate) {
    return (
      <div className="text-center py-2.5 text-sm text-tertiary">{message.content}</div>
    )
  }

  if (message.type === ChatMessageType.Vote) {
    return (
      <div className="text-center py-2.5 text-sm text-tertiary"><VoteRecord message={message} /></div>
    )
  }

  if (isRevokeMessage) {
    return (
      // <div className="text-center my-2.5 text-sm text-tertiary">
      //   {isRevokeMessage.senderName} 撤回了一条消息
      // </div>
      <RevokeRecord
        message={message}
        revokeMessage={isRevokeMessage}
      />
    )
  }


  const renderMessage = () => {

    return ({
      [ChatMessageType.Text]: <TextRecord message={message as ChatMessageTypes<ChatMessageType.Text>} />,
      // [ChatMessageType.Cmd]: <CmdRecord message={msg} />,
      [ChatMessageType.Image]: <ImageRecord message={message as ChatMessageTypes<ChatMessageType.Image>} />,
      [ChatMessageType.System]: <SystemRecord message={message as ChatMessageTypes<ChatMessageType.System>} />
    }[message.type] ?? null)
  }

  if (isSelfMessage) {
    return (
      <div className="py-3 px-4 flex justify-end items-start box-border">
        <div className="mr-2.5 flex flex-col items-end overflow-hidden" style={{ maxWidth: '50%' }}>
          <div className="flex items-start mb-1">
            <span className="text-tertiary text-xs">&nbsp;{formatTimeStr(message.timestamp * 1000, { timezone: timeZone, format: timeFormat })}</span>
          </div>
          <ChatMessageRowMenu message={message} me={me}>
            <div className="bg-[#586EAC] rounded p-2.5 text-sm min-h-8 box-border max-w-full overflow-hidden whitespace-normal break-words leading-tight">
              {
                renderMessage()
              }
            </div>
          </ChatMessageRowMenu>
          <div className="flex items-start space-x-1">
            {(message.reply) ? <ReplyMessage reply={message.reply} /> : null}
            <span className="text-xs text-tertiary scale-90 mt-1 flex-shrink-0">
              {message.status === MessageStatus.Fail
                ? '发送失败'
                : message.status === MessageStatus.Wait
                  ? '发送中...'
                  : message.status === MessageStatus.Normal
                    ? '已发送'
                    : null}
            </span>
          </div>
        </div>

        <UserAvatar shape="square" src={message.senderAvatar} name={message.senderId} uid={message.senderId} type="1" />
      </div>
    )
  }



  return (
    <div className="py-3 px-4 flex items-start box-border">
      <UserAvatar shape="square" src={message.senderAvatar} name={message.senderId} uid={message.senderId} type="1" />
      <div className="ml-2.5 flex flex-col items-start" style={{ maxWidth: '50%' }}>
        <div className="text-sm leading-[14px] flex items-start mb">
          {message.senderName}
          <span className="text-tertiary text-xs">&nbsp;{formatTimeStr(message.timestamp * 1000, { timezone: timeZone, format: timeFormat })}</span>
        </div>
        <ChatMessageRowMenu message={message} me={me}>
          <div className="bg-[#2C2C2C] rounded p-2.5 text-sm min-h-8 box-border max-w-full overflow-hidden whitespace-normal break-words leading-tight">
            {
              renderMessage()
            }
          </div>
        </ChatMessageRowMenu>
        {(message.reply) ? <ReplyMessage reply={message.reply} /> : null}
      </div>
    </div>
  )
}

interface ChatMessageRowMenuProps {
  message: ChatMessage
  me: Nullable<ChatSubscriber>
}

const ChatMessageRowMenu = (props: PropsWithChildren<ChatMessageRowMenuProps>) => {
  const { message, children, me } = props

  const onMentions = useCallback(() => {
    chatEvent.emit('mention', {
      id: message.senderId,
      name: message.senderName,
      avatar: ''
    })
  }, [message])

  const onReplyMessage = useCallback(() => {
    chatEvent.emit('reply', message)
  }, [message])

  const onRevokeMessage = useCallback(() => {
    chatEvent.emit('revoke', message)
  }, [message])

  const onCopy = useCallback(() => {
    chatEvent.emit('copy', message)
  }, [message])

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onMentions}>
          <span>回复</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onReplyMessage}>
          <span>引用</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onCopy}>
          <span>复制</span>
        </ContextMenuItem>
        {me?.isManager || me?.isOwner || message.senderId === me?.id ? (
          <ContextMenuItem onClick={onRevokeMessage}>
            <span>撤回</span>
          </ContextMenuItem>
        ) : null}
      </ContextMenuContent>
    </ContextMenu>
  )
}

interface ReplyMessageProps {
  reply: ChatReplyContent
}

const ReplyMessage = ({ reply }: ReplyMessageProps) => {
  return (
    <div className="bg-[#1c1d1f] p-1 box-border mt-1 rounded text-xs flex items-start max-w-full">
      <div>{reply.replySenderName}: &nbsp;</div>
      {reply.replyMessageType
        ? ({
          [ChatMessageType.Text]: <div className="max-w-48">{(reply.replyMessageContent)}</div>,
          [ChatMessageType.Image]: (
            <div>
              <img className="w-full h-full" src={(reply.replyMessageContent)} alt="" />
            </div>
          )
        }[reply.replyMessageType] ?? null)
        : null}
    </div>
  )
}
