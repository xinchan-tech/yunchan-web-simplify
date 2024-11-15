import { getChatContacts, getChatRecords, getNoticeList, getNoticeTypes } from "@/api"
import { JknAvatar } from "@/components"
import { useUser } from "@/store"
import { dateToWeek } from "@/utils/date"
import { cn } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useMemo, useState } from "react"
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
  const types = useQuery({
    queryKey: [getNoticeTypes.cacheKey],
    queryFn: () => getNoticeTypes()
  })

  const chats = useQuery({
    queryKey: [getChatContacts.cacheKey],
    queryFn: () => getChatContacts()
  })

  return (
    <div className="bg-muted h-full flex items-stretch-around">
      <div className="w-[300px] border-0 border-r border-solid border-border flex-shrink-0">
        {
          chats.data?.map(item => (
            <div key={item.uid} onClick={() => { setActive(item.uid); setType('chat') }} onKeyDown={() => { }}
              className={cn(
                'flex py-4 hover:bg-[#3a3a3a] cursor-pointer transition-all px-2 items-center border-0 border-b border-solid border-border',
                item.uid === active && 'bg-[#3a3a3a]'
              )}>
              <JknAvatar className="w-8 h-8" src={item.avatar ?? undefined} />
              <div className="text-sm ml-2 flex-1 overflow-hidden">
                <div className="flex items-center w-full">
                  <div>{item.username}</div>
                  {
                    +item.unread > 0 && (
                      <span className="text-xs ml-2 h-4 w-4 bg-stock-down text-white rounded-full text-center leading-4">{item.unread}</span>
                    )
                  }
                  <span className="ml-auto text-sm">{formatTime(item.create_time)}</span>
                </div>
                <div className="mt-1 w-full text-ellipsis overflow-hidden">
                  {item.message}
                </div>
              </div>
            </div>
          ))
        }
        {
          types.data?.map(item => (
            <div key={item.id} onClick={() => { setActive(item.id); setType('notice') }} onKeyDown={() => { }}
              className={cn(
                'flex py-4 hover:bg-[#3a3a3a] cursor-pointer transition-all px-2 items-center border-0 border-b border-solid border-border',
                item.id === active && 'bg-[#3a3a3a]'
              )}>
              <JknAvatar className="w-8 h-8" src={item.avatar ?? undefined} />
              <div className="text-sm ml-2 flex-1 overflow-hidden">
                <div className="flex items-center w-full">
                  <div>{item.name}</div>
                  {
                    +item.unread > 0 && (
                      <span className="text-xs ml-2 h-4 w-4 bg-stock-down text-white rounded-full text-center leading-4">{item.unread}</span>
                    )
                  }
                  <span className="ml-auto text-sm">{item.create_time ? formatTime(item.create_time) : '--'}</span>
                </div>
                <div className="mt-1 w-full text-ellipsis overflow-hidden">
                  {item.describe || '--'}
                </div>
              </div>
            </div>
          ))
        }
      </div>
      <div className="flex-1 box-border p-4">
        <MessageContent msgKey={active} type={type} />
      </div>
    </div>
  )
}

interface MessageContentProps {
  msgKey?: string
  type: string
}

type MessageType = Awaited<ReturnType<typeof getChatRecords>>['items']

const MessageContent = (props: MessageContentProps) => {
  const user = useUser()
  const notices = useQuery({
    queryKey: [getNoticeTypes.cacheKey, props.msgKey],
    queryFn: () => getNoticeList(props.msgKey!),
    enabled: props.type === 'notice' && !!props.msgKey
  })

  const chats = useQuery({
    queryKey: [getChatContacts.cacheKey, props.msgKey],
    queryFn: () => getChatRecords({
      uid: props.msgKey!,
      limit: 30,
      page: 1
    }),
    enabled: props.type === 'chat' && !!props.msgKey
  })

  const data = useMemo<MessageType[]>(() => {
    if (props.type === 'notice') {
      return notices.data ?? []
    }
    const r = [...chats.data?.items ?? []]
    const res = []
    r.sort((a, b) => +a.create_time - +b.create_time)


    for (const msg of r) {
      if (res.length === 0) {
        res.push([msg])
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
  }, [notices.data, chats.data, props.type])

  return (
    <div>
      <div>
        {
          data.map(group => (
            <div key={group[0].create_time} className="space-y-4">
              <div className="text-center">
                美东时间&nbsp;
                {dayjs(+group[0].create_time * 1000).tz('America/New_York').format('MM-DD')}&nbsp;
                {dateToWeek(dayjs(+group[0].create_time * 1000).tz('America/New_York'))}&nbsp;
                {dayjs(+group[0].create_time * 1000).tz('America/New_York').format('HH:mm')}
              </div>
              {
                group.map(msg => (
                  <div key={msg.id} className="flex items-center w-full">
                    {
                      msg.from_user.id === user.user?.id ? (
                        <div className="ml-auto flex items-center">
                          <div className="bg-[#1e8bf1] rounded py-2 px-2 relative max-w-1/2 message-content">
                            {msg.message}
                          </div>
                          <JknAvatar className="ml-3" src={msg.from_user.avatar ?? undefined} />
                        </div>
                      ) : (
                        <div className="justify-self-start">123</div>
                      )
                    }
                  </div>

                ))
              }
            </div>
          ))
        }
      </div>
      <style jsx>{`
        .message-content::after {
          {/* 向右的小箭头 */}
          content: '';
          position: absolute;
          width: 0;
          height: 0;
          border-top: 10px solid transparent;
          border-right: 10px solid #1e8bf1;
          border-top: 10px solid transparent;
          top: 20px;
          right: -5px;
        }
      `}</style>
    </div>
  )
}

export default MessageCenter