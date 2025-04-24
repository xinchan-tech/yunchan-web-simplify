import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, JknVirtualInfinite } from "@/components"
import { getTimeFormatStr } from "@/pages/groupchat/chat-utils"
import { type ComponentRef, useCallback, useRef, useState, type PropsWithChildren, useEffect } from "react"
import { useImmer } from "use-immer"
import WKSDK, { MessageStatus } from "wukongimjssdk"
import { UserAvatar } from "../components/user-avatar"
import { chatEvent } from "../lib/event"
import { type ChatMessage, ChatMessageType, type ChatMessageTypes, type ChatReplyContent, type ChatSubscriber } from "../lib/types"
import { TextRecord } from "../components/text-record"
import { ImageRecord } from "../components/image-record"
import { SystemRecord } from "../components/system-record"

interface MessageListProps {
  messages: ChatMessage[]
  onFetchMore: () => void
  hasMore: boolean
}
export const MessageList = ({ messages, onFetchMore, hasMore }: MessageListProps) => {
  // const [innerMessages, setInnerMessages] = useImmer<ChatMessage[]>(messages)
  const scrollRef = useRef<ComponentRef<typeof JknVirtualInfinite>>(null)
  const lastMessages = useRef<ChatMessage[]>(messages)

  useEffect(() => {
    const lastMessageLast = lastMessages.current[lastMessages.current.length - 1]
    const messageLast = messages[messages.length - 1]

    if (!messageLast && !lastMessageLast) {
      lastMessages.current = messages
      return
    }

    if (lastMessageLast?.id === messageLast?.id) {
      const offsetLen = messages.length - lastMessages.current.length

      if (offsetLen > 0) {
        const virtual = scrollRef.current?.getVirtualizer()
        if (virtual) {
          virtual.scrollToIndex(offsetLen, { align: 'start' })
        }
      }

    } else {
      const virtual = scrollRef.current?.getVirtualizer()
      if (virtual) {
        if(lastMessages.current.length === 0 && messages.length > 0) {
          virtual.scrollToIndex(messages.length, { align: 'end' })
        }

        const items = virtual.getVirtualItems()

        const currentLastItems = items[items.length - 1]?.index
   
        if (currentLastItems >= messages.length - 1) {     
          virtual.scrollToIndex(messages.length - 1, { align: 'end' })
        }
      }
    }

    lastMessages.current = messages
  }, [messages])


  return (
    <>
      <JknVirtualInfinite
            className="w-full flex-1 chat-message-scroll-list"
            itemHeight={44}
            ref={scrollRef}
            rowKey="messageID"
            data={messages ?? []}
            hasMore={hasMore}
            direction="up"
            fetchMore={onFetchMore}
            renderItem={(msg: ChatMessage) => (
              <ChatMessageRow key={msg.id} message={msg} isRevokeMessage={false} />
            )}
          />
    </>
  )
}

interface ChatMessageRowProps {
  message: ChatMessage
  isRevokeMessage: boolean
}

const ChatMessageRow = ({ message, children, isRevokeMessage }: PropsWithChildren<ChatMessageRowProps>) => {
  const uid = WKSDK.shared().config.uid

  const isSelfMessage = message.senderId === uid

  if (message.type === ChatMessageType.Cmd || message.type === ChatMessageType.System) {
    return <div className="py-1.5 text-xs text-tertiary text-center">{children}</div>
  }

  const renderMessage = () => {

    return (
      <>
        {isRevokeMessage ? (
          <div />
        ) : (
          ({
            [ChatMessageType.Text]: <TextRecord message={message as ChatMessageTypes<ChatMessageType.Text>} />,
            // [ChatMessageType.Cmd]: <CmdRecord message={msg} />,
            [ChatMessageType.Image]: <ImageRecord message={message as ChatMessageTypes<ChatMessageType.Image>} />,
            [ChatMessageType.System]: <SystemRecord message={message as ChatMessageTypes<ChatMessageType.System>} />
          }[message.type] ?? null)
        )}
      </>
    )
  }

  if (isSelfMessage) {
    return (
      <div className="py-3 px-4 flex justify-end items-start box-border">
        <div className="mr-2.5 flex flex-col items-end overflow-hidden" style={{ maxWidth: '50%' }}>
          <div className="flex items-start mb-1">
            <span className="text-tertiary text-xs">&nbsp;{getTimeFormatStr(message.timestamp * 1000)}</span>
          </div>
          <ChatMessageRowMenu message={message}>
            <div className="bg-[#586EAC] rounded p-2.5 text-sm min-h-8 box-border max-w-full overflow-hidden whitespace-normal break-words leading-tight">
              {
                renderMessage()
              }
            </div>
          </ChatMessageRowMenu>
          <div className="flex items-center space-x-1">
            {(message.reply) ? <ReplyMessage reply={message.reply} /> : null}
            <span className="text-xs text-tertiary scale-90 mt-1">
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
          <span className="text-tertiary text-xs">&nbsp;{getTimeFormatStr(message.timestamp * 1000)}</span>
        </div>
        <ChatMessageRowMenu message={message}>
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
}

const ChatMessageRowMenu = (props: PropsWithChildren<ChatMessageRowMenuProps>) => {
  const { message, children } = props
  const [self, setSelf] = useState<Nullable<ChatSubscriber>>()

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
        {self?.isManager || self?.isOwner || message.senderId === self?.id ? (
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
          [ChatMessageType.Text]: <div className="max-w-48">{(reply.replyMessageContent as any).text}</div>,
          [ChatMessageType.Image]: (
            <div className="w-48 h-48">
              <img className="w-full h-full" src={(reply.replyMessageContent as any).remoteUrl} alt="" />
            </div>
          )
        }[reply.replyMessageType] ?? null)
        : null}
    </div>
  )
}
