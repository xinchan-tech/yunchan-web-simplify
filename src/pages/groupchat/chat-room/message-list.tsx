import { revokeMessage } from '@/api'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, JknVirtualInfinite } from '@/components'
import { useLatestRef } from '@/hooks'
import { ChatCmdType, ChatMessageType, chatConstants, useChatStore } from '@/store'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useUpdate, useUpdateEffect } from 'ahooks'
import { type ComponentRef, type PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react'
import WKSDK, {
  type CMDContent,
  type Message,
  MessageStatus,
  PullMode,
  type Reply,
  type Subscriber
} from 'wukongimjssdk'
import { messageCache } from '../cache'
import { getTimeFormatStr } from '../chat-utils'
import ChatAvatar from '../components/chat-avatar'
import { UsernameSpan } from '../components/username-span'
import { chatEvent } from '../lib/event'
import { useCMDListener, useMessageListener, useMessageStatusListener, useSubscribesListener } from '../lib/hooks'
import { isChannelManager, isChannelOwner, isRevokeMessage } from '../lib/utils'
import { ImageRecord } from './components/image-record'
import { RevokeRecord } from './components/revoke-record'
import { SystemRecord } from './components/system-record'
import { TextRecord } from './components/text-record'

const mergePrevMessages = (oldData: Message[], newData: Message[]) => {
  const oldDataFirst = oldData[0]
  if (!oldDataFirst) return [...newData]
  const prev = newData.filter(msg => msg.messageSeq < oldDataFirst.messageSeq)
  return [...prev, ...oldData]
}

const useMessages = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const channel = useChatStore(state => state.lastChannel)

  useEffect(() => {
    if (!channel) return

    messageCache.getMessages(channel).then(r => {
      setMessages(r)
      chatEvent.emit('messageInit', null)
    })
  }, [channel])

  const messagesQuery = useInfiniteQuery({
    queryKey: ['syncMessages', channel?.channelID],
    queryFn: async ({ pageParam }) => {
      const r = await WKSDK.shared().chatManager.syncMessages(channel!, {
        startMessageSeq: pageParam || 0,
        endMessageSeq: 0,
        limit: 40,
        pullMode: PullMode.Down
      })
      return r
    },

    initialPageParam: 0,
    getNextPageParam: () => undefined,
    getPreviousPageParam: firstPage => {
      const last = firstPage[0]

      if (!last) return undefined

      if (last.messageSeq >= 1) {
        return last.messageSeq - 1
      }
      return undefined
    },
    select: res => {
      const data = res.pages.flat()

      const revokeMessage: Message[] = []
      const normalMessage: Message[] = []

      data.forEach(msg => {
        if (msg.contentType === ChatMessageType.Cmd && msg.content.cmd === ChatCmdType.MessageRevoke) {
          revokeMessage.push(msg)
        } else {
          normalMessage.push(msg)
        }
      })
      revokeMessage.forEach(item => {
        const index = normalMessage.findIndex(msg => msg.messageID === item.content.param.message_id)
        if (index !== -1) {
          normalMessage[index].remoteExtra.revoke = true
          normalMessage[index].remoteExtra.revoker = item.fromUID
        }
      })

      return {
        messages: normalMessage,
        page: res.pageParams
      }
    },
    enabled: !!channel
  })

  useUpdateEffect(() => {
    const data = messagesQuery.data?.messages ?? []
    const pageParam = messagesQuery.data?.page ?? []

    setMessages(s => {
      if (pageParam.length <= 1) {
        setTimeout(() => {
          chatEvent.emit('messageInit', null)
        })
        messageCache.updateBatch(data.slice(-40), channel)
        return data
      }

      setTimeout(() => {
        chatEvent.emit('messageFetchMoreDone', null)
      })

      const r = mergePrevMessages(s, messagesQuery.data?.messages ?? [])
      messageCache.updateBatch(r.slice(-40), channel)
      return r
    })
  }, [messagesQuery.data, channel])

  const appendMessage = (msg: Message) => {
    setMessages(s => {
      const r = [...s, msg]
      if (!msg.messageID) {
        messageCache.updateBatch(r.slice(-40), channel)
      }

      return r
    })
  }

  const revokeMessage = (cmd: Message) => {
    const content = cmd.content as CMDContent
    if (content.cmd !== ChatCmdType.MessageRevoke) return
    const message = messages.find(msg => msg.messageID === cmd.content.param.message_id)
    if (!message) return

    message.remoteExtra.revoke = true
    message.remoteExtra.revoker = cmd.fromUID
    const r = [...messages]

    setMessages(r)
    messageCache.updateBatch(r.slice(-40), channel)
  }

  const fetchPreviousPage = () => {
    messagesQuery.fetchPreviousPage()
    chatEvent.emit('messageFetchMore', null)
  }

  return {
    messages,
    fetchPreviousPage: fetchPreviousPage,
    hasMore: messagesQuery.hasPreviousPage,
    appendMessage,
    revokeMessage
  }
}

export const ChatMessageList = () => {
  const channel = useChatStore(state => state.lastChannel)
  const fetchMoreIndex = useRef<string>()
  const { messages, fetchPreviousPage, hasMore, appendMessage, revokeMessage } = useMessages()
  const messagesLast = useLatestRef(messages)
  const scrollRef = useRef<ComponentRef<typeof JknVirtualInfinite>>(null)
  useMessageListener(message => {
    if (message.channel.channelID !== channel?.channelID) return
    chatEvent.emit('messageUpdate', null)
    appendMessage(message)
  })

  useCMDListener(cmd => {
    revokeMessage(cmd)
    chatEvent.emit('messageUpdate', null)
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

  const _onMessageSend = (message: Message) => {
    if (message.status === MessageStatus.Normal) {
      messageCache.updateBatch(messages.slice(-40), channel)
    }
  }

  useEffect(() => {
    const fetchMoreHandler = () => {
      const items = scrollRef.current?.getVirtualItems()
      if (items?.length) {
        fetchMoreIndex.current = messages[items[0].index]?.messageID
      }
    }

    const fetchMoreDoneHandler = () => {
      setTimeout(() => {
        const index = messagesLast.current.findIndex(msg => msg.messageID === fetchMoreIndex.current)
        if (index !== -1) {
          scrollRef.current?.scrollToIndex(index)
        }
      })
    }

    chatEvent.on('messageFetchMore', fetchMoreHandler)

    chatEvent.on('messageFetchMoreDone', fetchMoreDoneHandler)

    const updateHandler = () => {
      if (messagesLast.current.length) {
        setTimeout(() => {
          const items = scrollRef.current?.getVirtualItems()

          if (items?.length) {
            scrollRef.current?.scrollToIndex(items[items.length - 1].index + 1)
          }
        })
      }
    }

    chatEvent.on('messageUpdate', updateHandler)

    const initHandler = () => {
      if (messagesLast.current.length) {
        setTimeout(() => {
          scrollRef.current?.scrollToIndex(messagesLast.current.length)
        })
      }
    }
    chatEvent.on('messageInit', initHandler)

    return () => {
      chatEvent.off('messageFetchMore', fetchMoreHandler)
      chatEvent.off('messageFetchMoreDone', fetchMoreDoneHandler)
      chatEvent.off('messageUpdate', updateHandler)
      chatEvent.off('messageInit', initHandler)
    }
  }, [messages, messagesLast])
  return (
    <JknVirtualInfinite
      className="w-full h-full chat-message-scroll-list"
      itemHeight={44}
      ref={scrollRef}
      rowKey="messageID"
      data={messages ?? []}
      hasMore={hasMore}
      direction="up"
      fetchMore={fetchPreviousPage}
      renderItem={(msg: Message) => (
        <ChatMessageRow key={msg.messageID} message={msg} onMessageSend={_onMessageSend}>
          {isRevokeMessage(msg) ? (
            <RevokeRecord onReEdit={() => {}} revoker={msg.remoteExtra.revoker} channel={msg.channel} />
          ) : (
            ({
              [ChatMessageType.Text]: <TextRecord message={msg} />,
              // [ChatMessageType.Cmd]: <CmdRecord message={msg} />,
              [ChatMessageType.Image]: <ImageRecord message={msg} />,
              [ChatMessageType.System]: <SystemRecord message={msg} />
            }[msg.contentType] ?? null)
          )}
        </ChatMessageRow>
      )}
    />
  )
}

interface ChatMessageRowProps {
  message: Message
  onMessageSend: (message: Message) => void
}

const ChatMessageRow = ({ message, children, onMessageSend }: PropsWithChildren<ChatMessageRowProps>) => {
  const uid = WKSDK.shared().config.uid
  const update = useUpdate()

  const { fromName, fromAvatar } = message.remoteExtra.extra || {}

  useMessageStatusListener(message, msg => {
    console.log(message, msg)
    if (message.clientSeq === msg.clientSeq) {
      message.status = msg.reasonCode === 1 ? MessageStatus.Normal : MessageStatus.Fail
      message.messageID = msg.messageID.toString()
      if (message.status === MessageStatus.Normal) {
        onMessageSend(message)
      }
      update()
    }
  })

  if (message.remoteExtra.revoke || +message.contentType === +ChatMessageType.System) {
    return <div>{children}</div>
  }

  const isSelfMessage = message.fromUID === uid

  if (message.contentType === ChatMessageType.Cmd) {
    return <div className="py-1.5 text-xs text-tertiary text-center">{children}</div>
  }

  if (isSelfMessage) {
    return (
      <div className="py-3 px-4 flex justify-end items-start box-border">
        <div className="mr-2.5 flex flex-col items-end overflow-hidden" style={{ maxWidth: '50%' }}>
          <div className="flex items-start mb-1">
            <span className="text-tertiary text-xs">&nbsp;{getTimeFormatStr(message.timestamp * 1000)}</span>
          </div>
          <ChatMessageRowMenu message={message} fromName={fromName}>
            <div className="bg-[#586EAC] rounded p-2.5 text-sm min-h-8 box-border max-w-full overflow-hidden whitespace-normal break-words leading-tight">
              {children}
            </div>
          </ChatMessageRowMenu>
          <div className="flex items-center space-x-1">
            {(message.content.reply as Reply) ? <ReplyMessage reply={message.content.reply as Reply} /> : null}
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

        <ChatAvatar.User shape="square" src={fromAvatar} uid={message.fromUID} />
      </div>
    )
  }

  return (
    <div className="py-3 px-4 flex items-start box-border">
      <ChatAvatar.User shape="square" src={fromAvatar} uid={message.fromUID} />
      <div className="ml-2.5 flex flex-col items-start" style={{ maxWidth: '50%' }}>
        <div className="text-sm leading-[14px] flex items-start mb">
          <UsernameSpan uid={message.fromUID} name={fromName} channel={message.channel} />
          <span className="text-tertiary text-xs">&nbsp;{getTimeFormatStr(message.timestamp * 1000)}</span>
        </div>
        <ChatMessageRowMenu message={message} fromName={fromName}>
          <div className="bg-[#2C2C2C] rounded p-2.5 text-sm min-h-8 box-border max-w-full overflow-hidden whitespace-normal break-words leading-tight">
            {children}
          </div>
        </ChatMessageRowMenu>
        {(message.content.reply as Reply) ? <ReplyMessage reply={message.content.reply as Reply} /> : null}
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
  const [subscriber, setSubscriber] = useState<Nullable<Subscriber>>(
    WKSDK.shared().channelManager.getSubscribeOfMe(message.channel)
  )

  useSubscribesListener(
    message.channel,
    useCallback(() => {
      const s = WKSDK.shared().channelManager.getSubscribeOfMe(message.channel)
      setSubscriber(s)
    }, [message.channel])
  )
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
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={onMentions}>
          <span>回复</span>
        </ContextMenuItem>
        <ContextMenuItem onClick={onReplyMessage}>
          <span>引用</span>
        </ContextMenuItem>
        {isChannelManager(subscriber!) || isChannelOwner(subscriber!) || subscriber?.uid === message.fromUID ? (
          <ContextMenuItem onClick={onRevokeMessage}>
            <span>撤回</span>
          </ContextMenuItem>
        ) : null}
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
      {reply?.content?.contentType
        ? ({
            [ChatMessageType.Text]: <div className="max-w-48">{(reply?.content as any).text}</div>,
            [ChatMessageType.Image]: (
              <div className="w-48 h-48">
                <img className="w-full h-full" src={(reply?.content as any).remoteUrl} alt="" />
              </div>
            )
          }[reply?.content?.contentType] ?? null)
        : null}
    </div>
  )
}
