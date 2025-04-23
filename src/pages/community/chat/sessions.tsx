import { JknIcon, JknSearchInput } from "@/components"
import { chatManager, useChatStore } from "../lib/store"
import { ChatConnectStatus, ChatMessageType, type ChatSession } from "../lib/types"
import { useChatEvent } from "../lib/event"
import { useCallback, useEffect, useMemo } from "react"
import { useImmer } from "use-immer"
import { UserAvatar } from "../components/user-avatar"

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

  const onSearch = (e?: string) => {
    setSearch(e)
  }

  useChatEvent('syncSession', useCallback((e) => {
    setSessions(e)
  }, [setSessions]))

  const sessionList = useMemo(() => {
    if (!sessions) return []
    if (!search) return sessions
    return sessions.filter(s => s.channel.name.includes(search))
  }, [search, sessions])

  return (
    <div>
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
      {
        sessionList.map(s => (
          <div
            key={s.channel.id}
            className="flex conversation-card overflow-hidden cursor-pointer data-[checked=true]:bg-accent"
            data-checked={s.channel.id === channel?.id}
            onClick={() => chatManager.setChannel(s.channel)}
            onKeyDown={() => { }}
          >
            <div className="group-avatar rounded-md flex items-center text-ellipsis justify-center relative">
              <UserAvatar type="2" src={s.channel.avatar} shape="square" uid={s.channel.id} name={s.channel.name} className="w-[30px] h-[30px]" />
              {s.unRead > 0 ? (
                <div className="absolute h-[14px] box-border unread min-w-5 text-xs">
                  {s.unRead > 99 ? '99+' : s.unRead}
                </div>
              ) : null}
            </div>
            <div className="group-data flex-1 overflow-hidden">
              <div className="group-title flex  justify-between">
                <div className="flex items-baseline">
                  <div
                    title={s.channel.name}
                    className="overflow-hidden whitespace-nowrap text-ellipsis w-full text-sm"
                  >
                    {s.channel.name || ''}
                  </div>
                </div>
              </div>
              <div className="group-last-msg flex justify-between items-center">
                <div className="flex-1 text-xs text-tertiary line-clamp-1">
                  {s.isMentionMe ? <span className="text-destructive">[有人@我]</span> : null}
                  {
                    s.message?.type === ChatMessageType.Image || s.message?.type === ChatMessageType.Text ? (
                      <span>{s.message?.senderName}: &nbsp;</span>
                    ): null
                  }
                  {s.message?.type ? {
                    [ChatMessageType.Cmd]: '[系统消息]',
                    [ChatMessageType.Text]: s.message?.content,
                    [ChatMessageType.Image]: '[图片]',
                    [ChatMessageType.System]: '加入群聊',
                  }[s.message?.type] : ''}
                  {/* {c.lastMessage?.contentType === ChatMessageType.Cmd
                    ? c.lastMessage.content.cmd === ChatCmdType.MessageRevoke
                      ? '撤回了一条消息'
                      : '[系统消息]'
                    : c.lastMessage?.contentType === ChatMessageType.Image
                      ? '[图片]'
                      : +c.lastMessage!.contentType === +ChatMessageType.System
                        ? '加入群聊'
                        : c.lastMessage?.content.text || ''} */}
                </div>
                {/* <div className="text-xs text-tertiary">
                  {c.lastMessage?.timestamp ? dateUtils.dateAgo(dayjs(c.lastMessage.timestamp * 1000)) : null}
                </div> */}
              </div>
            </div>
          </div>
        ))
      }
      {/* <div className="group-list">
        {conversations.map(c => (
          <div
            key={c.channel.channelID}
            className={cn(
              'flex conversation-card overflow-hidden cursor-pointer',
              c.channel.channelID === lastChannel?.channelID && 'actived'
            )}
            onClick={() => onChannelSelect(c)}
            onKeyDown={() => { }}
          >
            <div className="group-avatar rounded-md flex items-center text-ellipsis justify-center relative">
              <ChatAvatar
                radius="4px"
                className="w-[30px] h-[30px]"
                data={{
                  name: c.channelInfo?.title || '',
                  uid: c.channel.channelID,
                  avatar: c.channelInfo?.logo || ''
                }}
              />
              {c.unread > 0 ? (
                <div className="absolute h-[14px] box-border unread min-w-5 text-xs">
                  {c.unread > 99 ? '99+' : c.unread}
                </div>
              ) : null}
            </div>
            <div className="group-data flex-1 overflow-hidden">
              <div className="group-title flex  justify-between">
                <div className="flex items-baseline">
                  <div
                    title={c.channelInfo?.title || ''}
                    className="overflow-hidden whitespace-nowrap text-ellipsis w-full text-sm"
                  >
                    {c.channelInfo?.title || ''}
                  </div>
                </div>
                {lastChannel?.channelID === c.channel.channelID ? (
                  <div
                    onClick={e => {
                      e.stopPropagation()
                      updateGroupInfoModal.modal.open()
                    }}
                    onKeyDown={() => {
                      updateGroupInfoModal.modal.open()
                    }}
                    className="oper-icons ml-auto"
                  >
                    <JknIcon name="settings_shallow" className="rounded-none size-4" />
                  </div>
                ) : null}
              </div>
              <div className="group-last-msg flex justify-between items-center">
                <div className="flex-1 text-xs text-tertiary line-clamp-1">
                  {c.isMentionMe ? <span style={{ color: 'red' }}>[有人@我]</span> : null}
                  <UsernameSpan uid={c.lastMessage?.fromUID!} channel={c.channel!} colon />
                  {c.lastMessage?.contentType === ChatMessageType.Cmd
                    ? c.lastMessage.content.cmd === ChatCmdType.MessageRevoke
                      ? '撤回了一条消息'
                      : '[系统消息]'
                    : c.lastMessage?.contentType === ChatMessageType.Image
                      ? '[图片]'
                      : +c.lastMessage!.contentType === +ChatMessageType.System
                        ? '加入群聊'
                        : c.lastMessage?.content.text || ''}
                </div>
                <div className="text-xs text-tertiary">
                  {c.lastMessage?.timestamp ? dateUtils.dateAgo(dayjs(c.lastMessage.timestamp * 1000)) : null}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div> */}
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