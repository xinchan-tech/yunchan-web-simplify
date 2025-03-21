import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, JknVirtualInfinite } from "@/components"
import { ChatCmdType, chatConstants, ChatMessageType, useChatStore } from "@/store"
import { useInfiniteQuery } from "@tanstack/react-query"
import WKSDK, { type CMDContent, type Message, MessageStatus, PullMode, type Reply, type Subscriber } from "wukongimjssdk"
import { TextRecord } from "./components/text-record"
import ChatAvatar from "../components/chat-avatar"
import { useCallback, useEffect, useState, type PropsWithChildren } from "react"
import { getTimeFormatStr } from "../chat-utils"
import { useCMDListener, useMessageListener, useMessageStatusListener, useSubscribesListener } from "../lib/hooks"
import { useUpdate, useUpdateEffect } from "ahooks"
import { RevokeRecord } from "./components/revoke-record"
import { ImageRecord } from "./components/image-record"
import { chatEvent } from "../lib/event"
import { revokeMessage } from "@/api"
import { isChannelManager, isChannelOwner } from "../lib/utils"
import { messageCache } from "../cache"

const mergePrevMessages = (oldData: Message[], newData: Message[]) => {
  const oldDataFirst = oldData[0]
  if(!oldDataFirst) return [...newData]
  const prev = newData.filter(msg => msg.messageSeq < oldDataFirst.messageSeq)

  return [...prev, ...oldData]
}

const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const channel = useChatStore(state => state.lastChannel)

  useEffect(() => {
    if (!channel) return

    messageCache.getMessages(channel).then(r => {
      console.log(r)
      setMessages(r)
    })
  }, [channel])

  const messagesQuery = useInfiniteQuery({
    queryKey: ['syncMessages', channel?.channelID],
    queryFn: async ({pageParam}) => {
      return WKSDK.shared().chatManager.syncMessages(channel!, {
        startMessageSeq: pageParam || 0,
        endMessageSeq: 0,
        limit: 40,
        pullMode: PullMode.Down,
      })
    },
    initialPageParam: 0,
    getNextPageParam: () => undefined,
    getPreviousPageParam: (firstPage) => {
      const last = firstPage[0]

      if(!last) return undefined

      if(last.messageSeq >= 1){
        return last.messageSeq - 1
      }
      return undefined
    },
    select: (res) => {
      const data = res.pages.flat()

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
    enabled: !!channel,
  })

  useUpdateEffect(() => {
    setMessages(s => {
      const r = mergePrevMessages(s, messagesQuery.data ?? [])

      messageCache.updateBatch(r.slice(-40), channel)

      return r
    })
  }, [messagesQuery.data, channel])
  
  const appendMessage = (msg: Message) => {
    setMessages(s => {
      const r = [...s, msg]
      messageCache.updateBatch(r.slice(-40), channel)
      return r
    })
  }

  const revokeMessage = (cmd: Message) => {
    const content = cmd.content as CMDContent
    if (content.cmd !== ChatCmdType.MessageRevoke) return
    const message = messages.find(msg => msg.messageID === cmd.content.param.message_id)
    if (!message) return

    message.content = content
    const r = [...messages]
    setMessages(r)
    messageCache.updateBatch(r.slice(-40), channel)
  }

  return {
    messages,
    fetchPreviousPage: messagesQuery.fetchPreviousPage,
    hasMore: messagesQuery.hasPreviousPage,
    appendMessage,
    revokeMessage
  }
}

export const ChatMessageList = () => {
  const channel = useChatStore(state => state.lastChannel)
  
  const { messages, fetchPreviousPage, hasMore, appendMessage, revokeMessage } = useMessages()

  useMessageListener((message) => {
    if (message.channel.channelID !== channel?.channelID) return

    appendMessage(message)
  })

  useCMDListener((cmd) => {
    revokeMessage(cmd)
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
    <JknVirtualInfinite className="w-full h-full chat-message-scroll-list"
      itemHeight={44}
      rowKey="messageID"
      data={messages ?? []}
      autoBottom
      hasMore={hasMore}
      direction="up"
      fetchMore={fetchPreviousPage}
      renderItem={msg => (
        <ChatMessageRow key={msg.messageID} message={msg}>
        {{
          [ChatMessageType.Text]: <TextRecord message={msg} />,
          [ChatMessageType.Cmd]: <RevokeRecord onReEdit={() => { }} revoker={msg.fromUID} channel={msg.channel} />,
          [ChatMessageType.Image]: <ImageRecord message={msg} />,
        }[msg.contentType] ?? null}
      </ChatMessageRow>
      )}
    >
    </JknVirtualInfinite>
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
    if (message.clientSeq === msg.clientSeq) {
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