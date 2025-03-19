import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, JknInfiniteArea } from "@/components"
import { ChatCmdType, chatConstants, ChatMessageType, useChatStore } from "@/store"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import WKSDK, { type CMDContent, ConnectStatus, type Message, MessageStatus, PullMode, type Reply, Subscriber } from "wukongimjssdk"
import { TextRecord } from "./components/text-record"
import ChatAvatar from "../components/chat-avatar"
import { useCallback, useEffect, useRef, useState, type ComponentRef, type PropsWithChildren } from "react"
import { getTimeFormatStr } from "../chat-utils"
import { useCMDListener, useMessageListener, useMessageStatusListener, useSubscribesListener } from "../lib/hooks"
import { useUpdate } from "ahooks"
import { RevokeRecord } from "./components/revoke-record"
import { ImageRecord } from "./components/image-record"
import type { ChatSubscriber } from "../lib/model"
import { chatEvent } from "../lib/event"
import { revokeMessage } from "@/api"
import { fetchUserInChannel, isChannelManager, isChannelOwner } from "../lib/utils"

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
        limit: 400,
        pullMode: PullMode.Down,
      })
    },
    select: (data) => {
      const revokeMessage: Message[] = []
      const normalMessage: Message[] = []

      data.forEach((msg) => {
        if (msg.contentType === ChatMessageType.Cmd && msg.content.cmd === ChatCmdType.MessageRevoke) {
          revokeMessage.push(msg)
        } else {
          normalMessage.push(msg)
        }
      })

      revokeMessage.forEach(item => {
        const index = normalMessage.findIndex(msg => msg.messageID === item.content.param.message_id)
        if (index !== -1) {
          normalMessage.splice(index, 1, item)
        }
      })

      return normalMessage
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
    console.log(message, message.status)
    fetchUserInChannel(message.channel, message.fromUID).then(r => {
      queryClient.setQueryData<typeof messages.data>(['syncMessages', channel?.channelID], (oldData) => {
        if (!oldData) return
        message.remoteExtra.extra.fromName = r.name
        message.remoteExtra.extra.fromAvatar = r.avatar
        return [
          ...oldData,
          message
        ]
      })
    })


    if (isOnBottom) {
      setTimeout(() => {
        scrollRef.current?.scrollToBottom()
      }, 100)
    }
  })

  useCMDListener((cmd) => {
    const content = cmd.content as CMDContent
    if (content.cmd !== ChatCmdType.MessageRevoke) return
    const message = messages.data?.find(msg => msg.messageID === cmd.content.param.message_id)
    if (!message) return

    queryClient.setQueryData<typeof messages.data>(['syncMessages', channel?.channelID], (oldData) => {
      if (!oldData) return
      return [
        ...oldData,
        cmd
      ]
    })

    update()
  })

  useEffect(() => {
    const node = document.querySelector('.chat-message-scroll-list')
    const stockSpanClick = (e: any) => {
      const target = e.target as HTMLSpanElement
      if (target.tagName === 'SPAN' && target.getAttribute('data-stock-code')) {
        const channel = new BroadcastChannel(chatConstants.broadcastChannelId)
        channel.postMessage({ type: 'chat_stock_jump', payload: target.getAttribute('data-stock-code') })
      }
    }

    node?.addEventListener('click', stockSpanClick)

    return () => {
      node?.removeEventListener('click', stockSpanClick)
    }
  }, [])


  return (
    <JknInfiniteArea className="w-full h-full chat-message-scroll-list" ref={scrollRef}>
      
      {messages.data?.map((msg) => (
        <ChatMessageRow key={msg.messageID} message={msg}>
          {{
            [ChatMessageType.Text]: <TextRecord message={msg} />,
            [ChatMessageType.Cmd]: <RevokeRecord onReEdit={() => { }} />,
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
  const update = useUpdate()

  const { fromName, fromAvatar } = message.remoteExtra.extra || {}

  useMessageStatusListener(message, (msg) => {
    if(message.clientSeq === msg.clientSeq){
      message.status = msg.reasonCode === 1 ? MessageStatus.Normal : MessageStatus.Fail
      message.messageID = msg.messageID.toString()
      update()
    }
  })

  if (message.remoteExtra.revoke) {
    return (
      <div>
        {children}
      </div>
    )
  }

  const isSelfMessage = message.fromUID === uid

  if (message.contentType === ChatMessageType.Cmd) {
    return (
      <div className="py-1.5 text-xs text-tertiary text-center">
        {children}
      </div>
    )
  }

  if (isSelfMessage) {
    return (
      <div className="py-3 px-4 flex justify-end items-start box-border">
        <div className="mr-2.5 flex flex-col items-end overflow-hidden" style={{ maxWidth: '50%' }}>
          <div className="flex items-start mb-1.5">
            <span className="text-tertiary text-xs">&nbsp;{getTimeFormatStr(message.timestamp * 1000)}</span>
          </div>
          <ChatMessageRowMenu message={message} fromName={fromName}>
            <div className="bg-[#586EAC] rounded p-2.5 text-sm min-h-8 box-border max-w-full overflow-hidden whitespace-normal break-words leading-tight">
              {children}
            </div>
          </ChatMessageRowMenu>
          {
            message.content.reply as Reply ? <ReplyMessage reply={message.content.reply as Reply} /> : null
          }
        </div>

        <ChatAvatar.User shape="square" src={fromAvatar} uid={message.fromUID} />
      </div>
    )
  }

  return (
    <div className="py-3 px-4 flex items-start box-border">
      <ChatAvatar.User shape="square" src={fromAvatar} uid={message.fromUID} />
      <div className="ml-2.5 flex flex-col items-start" style={{ maxWidth: '50%' }}>
        <div className="text-sm leading-[14px] flex items-start mb-1.5">
          <span >{fromName}</span>
          <span className="text-tertiary text-xs">&nbsp;{getTimeFormatStr(message.timestamp * 1000)}</span>
        </div>
        <ChatMessageRowMenu message={message} fromName={fromName}>
          <div className="bg-[#2C2C2C] rounded p-2.5 text-sm min-h-8 box-border max-w-full overflow-hidden whitespace-normal break-words leading-tight">
            {children}
          </div>
        </ChatMessageRowMenu>
        {

        }
        {
          message.content.reply as Reply ? <ReplyMessage reply={message.content.reply as Reply} /> : null
        }
      </div>

    </div>
  )
}

interface ChatMessageRowMenuProps {
  message: Message
  fromName: string
  subscriber?: Subscriber
}

const ChatMessageRowMenu = (props: PropsWithChildren<ChatMessageRowMenuProps>) => {
  const { message, children } = props
  const [subscriber, setSubscriber] = useState<Nullable<Subscriber>>(WKSDK.shared().channelManager.getSubscribeOfMe(message.channel))

  useSubscribesListener(message.channel, useCallback(() => {
    const s = WKSDK.shared().channelManager.getSubscribeOfMe(message.channel)
    setSubscriber(s)
  }, [message.channel]))
  // const onCopyMessage = () => {
  //   chatEvent.emit('copyMessage', { channelId: message.channel.channelID, message })
  // }

  const onRevokeMessage = () => {
    revokeMessage({ msg_id: message.messageID })
  }

  const onReplyMessage = () => {
    chatEvent.emit('replyMessage', { channelId: message.channel.channelID, message, fromName: props.fromName })
  }

  const onMentions = () => {
    chatEvent.emit('mentionUser', {
      userInfo: {
        uid: message.fromUID,
        name: props.fromName
      },
      channelId: message.channel.channelID
    })
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        {children}
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onMentions} >
          <span>回复</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onReplyMessage}>
          <span>引用</span>
        </ContextMenuItem>
        {
          isChannelManager(subscriber!) || isChannelOwner(subscriber!) || subscriber?.uid === message.fromUID ? (
            <ContextMenuItem onClick={onRevokeMessage}>
              <span>撤回</span>
            </ContextMenuItem>
          ) : null
        }
      </ContextMenuContent>
    </ContextMenu>
  )
}

interface ReplyMessageProps {
  reply?: Reply
}

const ReplyMessage = ({ reply }: ReplyMessageProps) => {
  return (
    <div className="bg-[#1c1d1f] p-1 box-border mt-1 rounded text-xs flex items-start max-w-full">
      <div>{reply?.fromName}: &nbsp;</div>
      {reply?.content?.contentType ? {
        [ChatMessageType.Text]: <div className="max-w-48">{(reply?.content as any).text}</div>,
        [ChatMessageType.Image]: <div className="w-48 h-48"><img className="w-full h-full" src={(reply?.content as any).remoteUrl} alt="" /></div>,
      }[reply?.content?.contentType] ?? null : null
      }
    </div>
  )
}