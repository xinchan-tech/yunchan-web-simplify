import { getChatContacts, getChatRecords, getNoticeList, getNoticeTypes, markAsRead, markSystemAsRead } from '@/api'
import { JknAvatar, JknIcon, JknInfiniteArea, JknVirtualInfinite, ScrollArea } from '@/components'
import { useWsChat } from '@/hooks'
import { useUser } from '@/store'
import { dateToWeek, dateUtils } from '@/utils/date'
import { cn } from '@/utils/style'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from 'dayjs'
import { produce } from 'immer'
import { uid } from 'radash'
import { type ComponentRef, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { MessageInput } from './components/message-input'

const formatTime = (date: string) => {
  const day = dayjs(+date * 1000)
  if (day.isSame(dayjs(), 'day')) {
    return `今天 ${day.format('HH:mm')}`
  }
  return day.format('YYYY-MM-DD HH:mm')
}

const MessageCenter = () => {
  const [active, setActive] = useState<string>()
  const [type, setType] = useState<'notice' | 'chat'>('notice')
  const queryClient = useQueryClient()
  const queryKey = [getNoticeTypes.cacheKey]
  const types = useQuery({
    queryKey: queryKey,
    queryFn: () => getNoticeTypes()
  })
  const [select, setSelect] = useState<Nullable<ArrayItem<typeof types.data>>>(null)

  const chatsQueryKey = [getChatContacts.cacheKey]
  const chats = useQuery({
    queryKey: chatsQueryKey,
    queryFn: () => getChatContacts(),
    select: data => data.filter(contact => contact.uid !== '0')
  })

  const markAsReadMutation = useMutation({
    mutationFn: (uid: string) => {
      return markAsRead(uid)
    },
    onMutate: async uid => {
      queryClient.cancelQueries({ queryKey: chatsQueryKey })

      const previousValue = queryClient.getQueryData(chatsQueryKey)

      queryClient.setQueryData<typeof chats.data>(
        chatsQueryKey,
        produce(draft => {
          draft?.forEach(item => {
            if (item.uid === uid) {
              item.unread = '0'
            }
          })
        })
      )

      return { previousValue }
    },
    onError: (__, _, context: any) => {
      queryClient.setQueryData(chatsQueryKey, context.previousValue)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: chatsQueryKey })
    }
  })

  const markMessageReadMutation = useMutation({
    mutationFn: (id: string) => {
      return markSystemAsRead(id)
    },
    onMutate: async id => {
      queryClient.cancelQueries({ queryKey: queryKey })

      const previousValue = queryClient.getQueryData(queryKey)

      queryClient.setQueryData<typeof types.data>(
        queryKey,
        produce(draft => {
          draft?.forEach(item => {
            if (item.id === id) {
              item.unread = 0
            }
          })
        })
      )

      return { previousValue }
    },
    onError: (__, _, context: any) => {
      queryClient.setQueryData(queryKey, context.previousValue)
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKey })
    }
  })

  useWsChat(msg => {
    const fromUid = msg.data.from_uid

    queryClient.setQueryData<typeof chats.data>(
      chatsQueryKey,
      produce(draft => {
        const item = draft?.find(item => item.uid === fromUid)
        if (item) {
          item.message = msg.data.content
          item.create_time = dateUtils.toUsDay(msg.time).valueOf().toString().slice(0, -3)
          if (active !== fromUid) {
            item.unread = (+item.unread + 1).toString()
          }
        }
      })
    )
  })

  return (
    <div className="bg-muted h-full flex items-stretch-around">
      <div className="w-[300px] border-0 border-r border-solid border-border flex-shrink-0">
        {chats.data?.map(item => (
          <div
            key={item.uid}
            onClick={() => {
              setActive(item.uid)
              setType('chat')
              markAsReadMutation.mutate(item.uid)
              setSelect(null)
            }}
            onKeyDown={() => {}}
            className={cn(
              'flex py-4 hover:bg-[#3a3a3a] cursor-pointer transition-all px-2 items-center border-0 border-b border-solid border-border',
              item.uid === active && type === 'chat' && 'bg-[#3a3a3a]'
            )}
          >
            <JknAvatar className="w-12 h-12" src={item.avatar ?? undefined} />
            <div className="text-sm ml-2 flex-1 overflow-hidden">
              <div className="flex items-center w-full">
                <div>{item.username}</div>
                {+item.unread > 0 && (
                  <span className="text-xs ml-2 h-4 w-4 bg-stock-down text-white rounded-full text-center leading-4">
                    {item.unread}
                  </span>
                )}
                <span className="ml-auto text-tertiary text-xs">
                  {item.create_time ? formatTime(item.create_time) : '-'}
                </span>
              </div>
              <div className="mt-1 w-full text-ellipsis overflow-hidden whitespace-nowrap text-tertiary text-xs">
                {item.message || '-'}
              </div>
            </div>
          </div>
        ))}
        {types.data?.map(item => (
          <div
            key={item.id}
            onClick={() => {
              setActive(item.id)
              setType('notice')
              markMessageReadMutation.mutate(item.id)
              setSelect(item)
            }}
            onKeyDown={() => {}}
            className={cn(
              'flex py-4 hover:bg-[#3a3a3a] cursor-pointer transition-all px-2 items-center border-0 border-b border-solid border-border',
              item.id === active && type === 'notice' && 'bg-[#3a3a3a]'
            )}
          >
            <JknAvatar className="w-12 h-12" src={item.avatar ?? undefined} title={item.name} />
            <div className="text-sm ml-2 flex-1 overflow-hidden">
              <div className="flex items-center w-full">
                <div>{item.name}</div>
                {+item.unread > 0 && (
                  <span className="text-xs ml-2 h-5 w-5 bg-stock-down text-white rounded-full text-center leading-5">
                    {item.unread}
                  </span>
                )}
                <span className="ml-auto text-xs text-tertiary">
                  {item.create_time ? dateUtils.dateAgo(item.create_time) : '--'}
                </span>
              </div>
              <div className="mt-1 w-full text-ellipsis overflow-hidden  whitespace-nowrap text-tertiary text-xs">
                {item.describe || '--'}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 box-border overflow-hidden">
        {type === 'chat' ? (
          <ChatMessageContent msgKey={active === '0' ? '1' : active} />
        ) : (
          <SystemMessageContent
            msgKey={active}
            name={types.data?.find(item => item.id === active)?.name}
            avatar={select ? <JknAvatar className="mr-3" src={select.avatar} title={select.name ?? ''} /> : null}
          />
        )}
      </div>
    </div>
  )
}

interface MessageContentProps {
  msgKey?: string
}

type MessageType = Awaited<ReturnType<typeof getChatRecords>>['items']

const ChatMessageContent = (props: MessageContentProps) => {
  const user = useUser(s => s.user)

  const chats = useQuery({
    queryKey: [getChatRecords.cacheKey, props.msgKey],
    queryFn: () =>
      getChatRecords({
        uid: props.msgKey!,
        limit: 30,
        page: 1
      })
  })
  const queryClient = useQueryClient()

  const ws = useWsChat(msg => {
    const fromUid = msg.data.from_uid

    if (fromUid !== props.msgKey) return

    queryClient.cancelQueries({ queryKey: [getChatRecords.cacheKey, props.msgKey] })

    queryClient.setQueryData<typeof chats.data>(
      [getChatRecords.cacheKey, props.msgKey],
      produce(draft => {
        draft?.items.push({
          from_user: {
            id: msg.data.from_uid,
            username: msg.data.user_id,
            avatar: ''
          },
          id: uid(16),
          group_id: msg.data.group_id.toString(),
          type: msg.data.type.toString() as any,
          message: msg.data.content,
          is_read: '1',
          create_time: dateUtils.toUsDay(msg.time).valueOf().toString().slice(0, -3)
        })
      })
    )
  })

  const data = useMemo<MessageType[]>(() => {
    // console.log(notices.data, chats.data)

    const r = [...(chats.data?.items ?? [])]

    const res = []
    r.sort((a, b) => +a.create_time - +b.create_time)

    for (const msg of r) {
      if (res.length === 0) {
        res.push([msg])
        continue
      }

      const lastMsg = res[res.length - 1]
      //如果在十分钟内，分为一组
      if (lastMsg.length > 0 && +msg.create_time * 1000 - +lastMsg[0].create_time * 1000 <= 2 * 60 * 1000) {
        lastMsg.push(msg)
      } else {
        res.push([msg])
      }
    }

    return res
  }, [chats.data])

  const scrollRef = useRef<ComponentRef<typeof ScrollArea>>(null)

  useEffect(() => {
    if (chats.data) {
      scrollRef.current?.querySelector('div[data-radix-scroll-area-viewport]')?.scrollTo({
        top: 99999
      })
    }
  }, [chats.data])

  const sendMessage = useMutation({
    mutationFn: (params: { msg: string; type: '0' | '1' }) => {
      return ws.send(props.msgKey!, params.msg, params.type)
    },
    onMutate: async params => {
      queryClient.cancelQueries({ queryKey: [getChatRecords.cacheKey, props.msgKey] })

      const previousValue = queryClient.getQueryData([getChatRecords.cacheKey, props.msgKey])

      queryClient.setQueryData<typeof chats.data>(
        [getChatRecords.cacheKey, props.msgKey],
        produce(draft => {
          draft?.items.push({
            from_user: {
              id: user?.id.toString() ?? '',
              username: user?.username ?? '',
              avatar: user?.avatar ?? null
            },
            id: uid(16),
            group_id: props.msgKey!,
            type: params.type,
            message: params.msg,
            is_read: '0',
            create_time: (Date.now() / 1000).toString()
          })
        })
      )

      return { previousValue }
    },
    onError: (__, _, context: any) => {
      queryClient.setQueryData([getChatRecords.cacheKey, props.msgKey], context.previousValue)
    }
  })

  return (
    <div className="h-full overflow-hidden">
      <ScrollArea
        ref={scrollRef}
        className="h-[calc(100%-170px)] border-0 border-b border-solid border-b-border p-4 box-border"
      >
        <div className="">
          {data?.map(group => (
            <div key={group[0].create_time} className="space-y-4">
              <div className="text-center flex items-center justify-center text-tertiary mt-4 text-sm">
                <div className="w-1/5 h-0 border-0 border-b border-solid border-b-border mr-2" />
                <JknIcon name="ic_us" className="w-3 h-3 mr-2" />
                美东时间&nbsp;
                {dayjs(+group[0].create_time * 1000)
                  .tz('America/New_York')
                  .format('MM-DD')}
                &nbsp;
                {dateToWeek(dayjs(+group[0].create_time * 1000).tz('America/New_York'))}&nbsp;
                {dayjs(+group[0].create_time * 1000)
                  .tz('America/New_York')
                  .format('HH:mm')}
                <div className="w-1/5 h-0 border-0 border-b border-solid border-b-border ml-2" />
              </div>
              {group.map(msg => (
                <div key={msg.id} className="flex items-center w-full">
                  {msg.from_user.id === user?.id ? (
                    <div className="ml-auto flex items-start text-black max-w-[60%]">
                      <div className="bg-[#1e8bf1] rounded py-2 px-2 relative  message-content box-border">
                        {msg.type === '1' ? (
                          <img src={msg.message} alt={msg.message} className="w-full h-full" />
                        ) : (
                          <span>{msg.message}</span>
                        )}
                      </div>
                      <JknAvatar className="ml-3" src={msg.from_user.avatar ?? undefined} />
                    </div>
                  ) : (
                    <div className="mr-auto flex items-start text-black max-w-[60%]">
                      <JknAvatar className="mr-3" src={msg.from_user.avatar ?? undefined} />
                      <div className="bg-stock-green rounded py-2 px-2 relative message-content-right box-border">
                        {msg.type === '1' ? (
                          <img src={msg.message} alt={msg.message} className="w-full h-full" />
                        ) : (
                          <span>{msg.message}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </ScrollArea>
      {props.msgKey ? <MessageInput onSend={(msg, type) => sendMessage.mutate({ msg, type: type as any })} /> : null}
      <style jsx>
        {`
        .message-content::after {
          content: '';
          position: absolute;
          width: 0;
          height: 0;
          border-bottom: 6px solid transparent;
          border-left: 6px solid #1e8bf1;
          border-top: 6px solid transparent;
          top: 14px;
          right: -5px;
        }

        .message-content-right::after {
          content: '';
          position: absolute;
          width: 0;
          height: 0;
          border-bottom: 6px solid transparent;
          border-right: 6px solid hsl(var(--color-stock-green));
          border-top: 6px solid transparent;
          top: 14px;
          left: -5px;
        }
      `}
      </style>
    </div>
  )
}

interface SystemMessageContentProps {
  msgKey?: string
  name?: string
  avatar: ReactNode
}

const SystemMessageContent = (props: SystemMessageContentProps) => {
  const notices = useQuery({
    queryKey: [getNoticeList.cacheKey, props.msgKey],
    queryFn: () => getNoticeList(props.msgKey!),
    select: data => {
      const r = [...data.items]
      r.reverse()
      return r
    }
  })

  return (
    <div className="h-full overflow-hidden w-full">
      <JknVirtualInfinite
        data={notices.data ?? []}
        rowKey="id"
        itemHeight={120}
        autoBottom
        renderItem={(msg: ArrayItem<typeof notices.data>) => (
          <div key={msg.id} className="space-y-4 mb-2">
            <div className="text-center flex items-center justify-center text-tertiary mt-4 text-sm">
              <div className="w-1/5 h-0 border-0 border-b border-solid border-b-border mr-2" />
              <JknIcon name="ic_us" className="w-3 h-3 mr-2" />
              美东时间&nbsp;
              {dateUtils.toUsDay(+msg.create_time).format('MM-DD W HH:mm')}
              <div className="w-1/5 h-0 border-0 border-b border-solid border-b-border ml-2" />
            </div>
            <div className="flex items-center w-fit max-w-[960px] overflow-hidden">
              <div className="flex items-start text-black w-full box-border pl-4">
                {props.avatar}
                <div className="bg-stock-green rounded py-2 px-2 box-border relative message-content-right text-base w-full overflow-hidden">
                  <div className="font-bold">{msg.title}</div>
                  <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{msg.content}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
        className="w-full h-full"
      />
      <style jsx>
        {`
        .message-content-right::after {
          content: '';
          position: absolute;
          width: 0;
          height: 0;
          border-bottom: 6px solid transparent;
          border-right: 6px solid hsl(var(--color-stock-green));
          border-top: 6px solid transparent;
          top: 14px;
          left: -5px;
        }
      `}
      </style>
    </div>
  )
}

export default MessageCenter
