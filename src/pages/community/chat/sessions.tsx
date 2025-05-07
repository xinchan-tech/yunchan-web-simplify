import { JknSearchInput, ScrollArea } from "@/components"
import { chatManager, useChatStore } from "../lib/store"
import { ChatCmdType, ChatConnectStatus, ChatMessageType, type ChatSession } from "../lib/types"
import { useChatEvent } from "../lib/event"
import { useCallback, useMemo, useState } from "react"
import { useImmer } from "use-immer"
import { UserAvatar } from "../components/user-avatar"
import { ChannelInfo } from "../components/channel-info"
import { cleanUnreadConversation } from "@/api"
import { Channel } from "wukongimjssdk"
import { sessionCache } from "../cache"
import { formatTimeStr } from "../lib/utils"

const statusInfo: Record<ChatConnectStatus, { color: string; text: string }> = {
  [ChatConnectStatus.Disconnect]: {
    color: 'red',
    text: '未连接'
  },
  [ChatConnectStatus.Connecting]: {
    color: 'yellow',
    text: '连接中'
  },
  [ChatConnectStatus.Connected]: {
    color: 'green',
    text: '已连接'
  },
  [ChatConnectStatus.ConnectFail]: {
    color: 'red',
    text: '连接失败'
  },
  [ChatConnectStatus.ConnectKick]: {
    color: 'red',
    text: '被踢'
  },
  [ChatConnectStatus.Syncing]: {
    color: 'blue',
    text: '同步中'
  },
  [ChatConnectStatus.SyncingFail]: {
    color: 'red',
    text: '同步失败'
  }
}

export const Sessions = () => {
  const state = useChatStore(s => s.state)
  const [sessions, setSessions] = useImmer<ChatSession[]>([])
  const [search, setSearch] = useImmer<Nullable<string>>(undefined)
  const channel = useChatStore(s => s.channel)
  const [hoverChannel, setHoverChannel] = useState<string>()

  const onSearch = (e?: string) => {
    setSearch(e)
  }

  useChatEvent('syncSession', useCallback((e) => {
    setSessions(e)
  }, [setSessions]))

  useChatEvent('updateSession', useCallback((e) => {
    setSessions(draft => {
      const index = draft.findIndex(s => s.channel.id === e.channel.id)
      const lastChannel = chatManager.getChannel()
      if (index !== -1) {
        const ord = draft[index]
        const n = { ...e }
        if (lastChannel?.id === e.channel.id) {
          n.unRead = 0
          cleanUnreadConversation(chatManager.toChannel(lastChannel!))
        } else {
          n.unRead = ord.unRead + 1
          n.isMentionMe = ord.isMentionMe || e.isMentionMe
        }

        sessionCache.updateOrSave({ ...n })
        draft.splice(index, 1, n)
      }
    })
  }, [setSessions]))

  useChatEvent('updateMessage', useCallback((e) => {
    if (e.type === ChatMessageType.Cmd) {
      const lastChannel = chatManager.getChannel()
      setSessions(draft => {
        const index = draft.findIndex(s => s.channel.id === e.channel.id)
        if (index !== -1) {
          const n = { ...draft[index] }
          n.message = e
          n.isMentionMe = false
          if (lastChannel?.id === e.channel.id) {
            n.unRead = 0
          } else {
            n.unRead = n.unRead + 1
          }

          draft.splice(index, 1, n)
        }
      })
    }
  }, [setSessions]))

  useChatEvent('updateChannel', useCallback((e) => {
    setSessions(draft => {
      const index = draft.findIndex(s => s.channel.id === e.id)
      if (index !== -1) {
        const n = { ...draft[index] }
        n.channel = e
        draft.splice(index, 1, n)
        sessionCache.updateOrSave(n)
      }
    })
  }, [setSessions]))

  const sessionList = useMemo(() => {
    if (!sessions) return []
    if (!search) return [...sessions].sort((a, b) => (b.message?.timestamp ?? 0) - (a.message?.timestamp ?? 0))
    return sessions.filter(s => s.channel.name.includes(search))
  }, [search, sessions])

  const onSelectChannel = (s: ChatSession) => {
    chatManager.setChannel(s.channel)
    cleanUnreadConversation(new Channel(s.channel.id, s.channel.type))
    setSessions(draft => {
      const se = draft.find(se => se.channel.id === s.channel.id)
      if (se) {
        se.unRead = 0
        se.isMentionMe = false
      }
    })
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
      <div className="flex items-center text-xs text-tertiary px-2 py-1">
        <span className="size-2 rounded-full mr-2" style={{ background: statusInfo[state].color }} />
        <span>{statusInfo[state].text}</span>
      </div>
      <div className="group-filter flex items-center justify-between px-1 pb-3">
        <JknSearchInput
          size="mini"
          onSearch={onSearch}
          rootClassName="bg-accent px-2 py-0.5 w-full text-tertiary"
          className="text-secondary placeholder:text-tertiary"
          placeholder="搜索"
        />
      </div>
      <ScrollArea className="flex-1">
        {
          sessionList.map(s => (
            <div
              key={s.channel.id}
              onMouseEnter={() => {
                setHoverChannel(s.channel.id)
              }}
              className="flex conversation-card overflow-hidden cursor-pointer data-[checked=true]:bg-accent w-[240px] box-border"
              data-checked={s.channel.id === channel?.id}
              onClick={() => onSelectChannel(s)}
              onKeyDown={() => { }}
            >
              <div className="group-avatar rounded-md flex items-center text-ellipsis justify-center relative">
                <UserAvatar type="2" src={s.channel.avatar} shape="square" uid={s.channel.id} name={s.channel.name} className="!size-10" />
                {s.unRead > 0 ? (
                  <div className="absolute h-[14px] box-border unread min-w-5 text-xs">
                    {s.unRead > 99 ? '99+' : s.unRead}
                  </div>
                ) : null}
              </div>
              <div className="group-data flex-1 overflow-hidden">
                <div className="group-title flex  justify-between relative">
                  <div className="flex items-baseline">
                    <div
                      title={s.channel.name}
                      className="overflow-hidden whitespace-nowrap text-ellipsis w-full text-sm"
                    >
                      {s.channel.name || ''}
                    </div>
                  </div>
                  {
                    hoverChannel === s.channel.id ? (
                      <div
                        onClick={e => { e.stopPropagation() }}
                        onKeyDown={() => { }}
                        className="absolute right-0 top-0"
                      >
                        <ChannelInfo channel={s.channel} />
                      </div>
                    ) : null
                  }
                </div>
                <div className="group-last-msg flex justify-between items-center">
                  <div className="flex-1 text-xs text-tertiary text-ellipsis overflow-hidden whitespace-nowrap w-full flex items-center">
                    <span className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                      {s.isMentionMe ? <span className="text-destructive">[有人@我]</span> : null}
                      {
                        s.message?.type === ChatMessageType.Image || s.message?.type === ChatMessageType.Text ? (
                          <>{s.message?.senderName}: &nbsp;</>
                        ) : null
                      }
                      {s.message?.type ? {
                        [ChatMessageType.Cmd]: (s.message as any).cmdType === ChatCmdType.MessageRevoke ? `${s.message?.senderName}撤回了一条消息` : '[系统消息]',
                        [ChatMessageType.Text]: s.message?.content,
                        [ChatMessageType.Image]: '[图片]',
                        [ChatMessageType.System]: s.message?.content,
                        [ChatMessageType.ChannelUpdate]: s.message?.content,
                        [ChatMessageType.Vote]: `${s.message.senderName ?? ''}发起了投票：${s.message?.content}`
                      }[s.message?.type] : ''}
                    </span>
                    <span className="ml-auto flex-shrink-0">
                      &nbsp;
                      {
                        formatTimeStr((s.message?.timestamp ?? 0) * 1000, {
                          timezone: 'local',
                          format: 'ago'
                        })
                      }
                    </span>

                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </ScrollArea>

      <style jsx>
        {`
        .group-list {
          overflow-y: auto;
          height: calc(100% - 58px);
        }
        .unread {
          background-color: rgb(218, 50, 50);
          border-radius: 8px;
          border: 1px solid #fff;
          font-size: 12px;
          line-height: 14px;
          text-align: center;
          padding: 0 4px;
          top: 0;
          right: 0;
          transform: translate(50%, -50%);
        }
        .group-title .oper-icons {
          display: none;
        }
        .group-title:hover .oper-icons {
          display: block;
        }
        .group-avatar {
          color: #fff;
          font-size: 13px;
        }
        .group-avatar img {
          border-radius: 8px;
        }
        .group-data {
          margin-left: 8px;
        }
        .conversation-card {
          padding: 12px 10px;
        }
        .group-last-msg {
          color: rgb(112, 116, 124);
          margin-top: 4px;
          font-size: 14px;
        }
        .conversation-card.actived .group-last-msg {
          color: #fff;
        }
        .conversation-card.actived {
          background-color: hsl(var(--accent))
        }
      `}
      </style>
    </div>
  )
}