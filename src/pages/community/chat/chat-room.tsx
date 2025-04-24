import { useCallback, useEffect, useMemo, useState } from "react"
import { type ChatChannel, ChatChannelState, ChatConnectStatus, type ChatMessage, type ChatSubscriber } from "../lib/types"
import { useChatStore } from "../lib/store"
import WKSDK, { Channel, Mention, MessageImage, MessageStatus, MessageText, PullMode, type Reply } from "wukongimjssdk"
import { ChannelTransform, MessageTransform, SubscriberTransform } from "../lib/transform"
import { channelCache, messageCache, subscriberCache } from "../cache"
import { useLatestRef } from "@/hooks"
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, JknAlert, JknIcon, ScrollArea, useModal } from "@/components"
import { UserAvatar } from "../components/user-avatar"
import to from "await-to-js"
import { readChannelNotice, revokeMessage, setChannelManager, setMemberForbidden } from "@/api"
import { useImmer } from "use-immer"
import { MessageList } from "./message-list"
import { ChatInput } from "../components/chat-input"
import { Resizable } from "re-resizable"
import { chatEvent, useChatEvent } from "../lib/event"
import { useUser } from "@/store"
import type { JSONContent } from "@tiptap/react"
import { useMessageStatusListener } from "../lib/hooks"
import { syncChannelInfo } from "../lib/datasource"
import { useCountDown } from "ahooks"
import { nanoid } from "nanoid"

export const ChatRoom = () => {
  const [channelStatus, setChannelStatus] = useState<ChatChannelState>(ChatChannelState.NotConnect)
  const [channelInfo, setChannelInfo] = useState<Nullable<ChatChannel>>(null)
  const [subscribes, setSubscribes] = useState<Nullable<ChatSubscriber[]>>([])
  const [message, setMessage] = useImmer<ChatMessage[]>([])
  const chatStatus = useChatStore(s => s.state)
  const channel = useChatStore(s => s.channel)
  const channelLast = useLatestRef(channel)
  const user = useUser(s => s.user)

  const me = useMemo(() => {
    if (!user) return null

    return subscribes?.find(s => s.id === user.username)
  }, [subscribes, user])

  /**
   * 刷新群成员
   */
  const refreshSubscriber = useCallback(() => {
    const _channel = new Channel(channel!.id, channel!.type)
    const subscriberQuery = WKSDK.shared().channelManager.syncSubscribes(_channel).then(() => {
      if (channelLast.current?.id !== _channel?.channelID) {
        return
      }

      const subscribes = WKSDK.shared().channelManager.getSubscribes(_channel)

      setSubscribes(subscribes.map(s => SubscriberTransform.toChatSubscriber(s)))
    })

    return subscriberQuery
  }, [channel, channelLast])

  /**
   * 刷新消息列表
   */
  const refreshMessage = useCallback(() => {
    const _channel = new Channel(channel!.id, channel!.type)
    return WKSDK.shared().chatManager.syncMessages(_channel, {
      startMessageSeq: 0,
      endMessageSeq: 0,
      limit: 60,
      pullMode: PullMode.Down
    }).then(r => {
      if (channelLast.current?.id !== _channel?.channelID) {
        return
      }

      return Promise.all(r.map(MessageTransform.toChatMessage))
    }).then(res => {
      if (!res) return
      messageCache.updateBatch(res, channel)

      setMessage(res)
    })
  }, [channel, setMessage, channelLast])


  const fetchMoreMessage = useCallback(() => {
    const _channel = new Channel(channel!.id, channel!.type)
    const firstMessage = message[0]

    if (!firstMessage) return

    return WKSDK.shared().chatManager.syncMessages(_channel, {
      startMessageSeq: firstMessage.messageSeq - 1,
      endMessageSeq: 0,
      limit: 60,
      pullMode: PullMode.Down
    }).then(r => {
      if (channelLast.current?.id !== _channel?.channelID) {
        return
      }

      return Promise.all(r.map(MessageTransform.toChatMessage))
    }).then(res => {
      if (!res) return
      setMessage(draft => {
        draft.unshift(...res)
      })
    })
  }, [channel, setMessage, channelLast, message])

  useEffect(() => {
    setChannelInfo(null)
    setSubscribes(null)
    setMessage([])

    if (chatStatus === ChatConnectStatus.Connected && channel) {

      setChannelStatus(ChatChannelState.Fetching)
      const _channel = new Channel(channel.id, channel.type)

      channelCache.get(channel.id).then(res => {

        if (res) {

          setChannelInfo(res)
        }

        subscriberCache.getSubscribesByChannel(channel.id).then(subs => {
          setSubscribes(subs)
        })

        messageCache.getMessages(channel).then(msgs => {
          setMessage(msgs)
        })

        const channelQuery = syncChannelInfo(channel).then(() => {
          if (channelLast.current?.id !== _channel?.channelID) {
            return
          }
          const channel = WKSDK.shared().channelManager.getChannelInfo(_channel)
          if (!channel) {
            throw new Error('channel is null')
          }

          const c = ChannelTransform.toChatChannel(channel)
          setChannelInfo(c)
          channelCache.updateOrSave(c)
        })

        const messageQuery = refreshMessage()

        const subscriberQuery = refreshSubscriber()

        Promise.all([channelQuery, subscriberQuery, messageQuery]).then(() => setChannelStatus(ChatChannelState.Fetched)).catch((e) => {
          console.error(e)
          setChannelStatus(ChatChannelState.FetchError)
        })
      })
    }
  }, [chatStatus, channel, channelLast, refreshSubscriber, refreshMessage, setMessage])


  const onReplayUser = (member: { name: string; id: string }) => {
    chatEvent.emit('mention', {
      name: member.name,
      id: member.id,
      avatar: ''
    })
  }

  const hasManageAuth = (member: ChatSubscriber) => {
    if (member.isOwner) return false

    if (member.isManager) {
      if (!me?.isOwner) return false
    }

    if (!me?.isManager && !me?.isOwner) return false

    return true

  }

  const hasForbiddenAuth = (member: ChatSubscriber) => {
    if (member.isOwner) return false

    const _self = WKSDK.shared().channelManager.getSubscribeOfMe(new Channel(channel!.id, channel!.type))

    if (!_self) return false

    const self = SubscriberTransform.toChatSubscriber(_self)

    if (!self.isManager && !self.isOwner) return false

    return true
  }

  const onChangeMemberManageAuth = async (member: ChatSubscriber) => {
    const params = {
      channelId: channel!.id,
      username: member.id,
      type: member.isManager ? '0' : ('1' as '0' | '1')
    }

    const [err] = await to(setChannelManager(params))

    if (err) {
      JknAlert.error(err.message)
      return
    }

    JknAlert.success(params.type === '1' ? '设置管理员操作成功' : '取消管理员操作成功')

    refreshSubscriber()

  }

  const onChangeMemberForbiddenAuth = async (member: ChatSubscriber) => {
    const params = {
      channelId: channel!.id,
      uids: [member.id],
      forbidden: !member.hasForbidden ? '1' : ('0' as '0' | '1')
    }

    if (member.isManager) {
      // toast({
      //   description: '请先取消对方管理员权限再拉黑'
      // })
      JknAlert.error('请先取消对方管理员权限再拉黑')
      return
    }

    const [err] = await to(setMemberForbidden(params))

    if (err) {
      JknAlert.error(err.message)
      return
    }

    JknAlert.success(params.forbidden === '1' ? '禁言操作成功' : '取消禁言操作成功')

    refreshSubscriber()
  }

  const onSubmit = (content?: JSONContent, extra?: { mentions?: string[]; reply?: Reply }) => {
    if (!content?.content?.length) return
    let _mentions = extra?.mentions
    let reply = extra?.reply as Reply | null
    content.content.forEach(item => {
      if (item.type === 'paragraph') {
        if (!item.content?.length) return
        const message = new MessageText(item.content?.map(i => (i.type === 'hardBreak' ? '\n' : i.text)).join(''))
        if (_mentions?.length) {
          message.mention = new Mention()
          message.mention.uids = _mentions

          _mentions = []
        }

        if (reply) {
          message.reply = reply
          reply = null
        }

        if (reply) {
          message.reply = reply
          reply = null
        }

        WKSDK.shared().chatManager.send(message, new Channel(channel!.id, channel!.type))
      } else if (item.type === 'image') {
        const message = new MessageImage()
        fetch(item.attrs!.src)
          .then(res => res.blob())
          .then(blob => {
            const type = blob.type
            const name = `image.${type.split('/')[1]}`
            const file = new File([blob], name, { type })
            message.file = file
            const image = new window.Image()
            image.src = item.attrs!.src
            image.onload = () => {
              message.width = image.width
              message.height = image.height
              WKSDK.shared().chatManager.send(message, new Channel(channel!.id, channel!.type))
            }
          })
      }
    })
  }

  useEffect(() => {
    const cancelMessage = chatEvent.on('updateMessage', (message) => {
      if (message.channel.id !== channel?.id) return
      setMessage(draft => {
        draft.push(message)
      })

      if (message.status === 1) {
        messageCache.updateOrSave(message)
      }
    })

    const cancelImageUpload = chatEvent.on('imageUploadSuccess', (message) => {
      setMessage(draft => {
        const m = draft.find(m => m.clientSeq === message.clientSeq)
        if (!m) return
        m.content = message.url
      })
    })
    return () => {
      cancelMessage()
      cancelImageUpload()
    }
  }, [channel, setMessage])

  useMessageStatusListener(useCallback((msg) => {
    const m = message.find(m => m.clientSeq === msg.clientSeq)
    if (!m) return
    if (msg.reasonCode === 1) {
      messageCache.updateOrSave({
        ...m,
        status: msg.reasonCode === 1 ? MessageStatus.Normal : MessageStatus.Fail,
        id: msg.messageID.toString()
      })
    }

    setMessage(draft => {
      const m = draft.find(m => m.clientSeq === msg.clientSeq)!
      m.status = msg.reasonCode === 1 ? MessageStatus.Normal : MessageStatus.Fail
      m.id = msg.messageID.toString()
    })
  }, [message, setMessage]))

  useChatEvent('updateChannel', useCallback((c) => {
    if (c.id !== channelLast.current?.id) return

    setChannelInfo(c)
    channelCache.updateOrSave(c)
  }, [channelLast]))

  useChatEvent('revoke', useCallback((e) => {
    revokeMessage({ msg_id: e.id })
  }, []))


  const noticeModal = useModal({
    content: (
      <ChatRoomNotice
        notice={channelInfo?.notice ?? ''}
        onConfirm={() => {
          readChannelNotice(channelInfo!.id).then(() => {
            WKSDK.shared().channelManager.fetchChannelInfo(new Channel(channelInfo!.id, channelInfo!.type))
          })

          noticeModal.modal.close()
        }}
      />
    ),
    className: 'w-[476px]',
    footer: null,
    closeOnMaskClick: false
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (channelInfo) {
      if (!channelInfo.isReadNotice) {
        noticeModal.modal.open()
      }
    }
  }, [channelInfo])




  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      {
        noticeModal.context
      }
      <div className="chat-room-title h-10">
        <div className="group-chat-header justify-between flex h-10">
          <div className="leading-10 border h-full bg-[#141414] border-b-primary w-full text-sm px-4">
            {channelInfo?.name}&nbsp;
            {
              {
                [ChatChannelState.NotConnect]: '',
                [ChatChannelState.Fetching]: <span className="text-green-500 text-xs">同步中</span>,
                [ChatChannelState.Fetched]: '',
                [ChatChannelState.FetchError]: <span className="text-destructive">同步失败</span>
              }[channelStatus]
            }
          </div>
        </div>
      </div>
      <div className="flex-1 flex h-full">
        <div className="flex-1 h-full flex flex-col overflow-hidden">
          {
            channelInfo?.inChannel ? (
              <MessageList messages={message} onFetchMore={fetchMoreMessage} hasMore={message[0] && message[0]?.messageSeq > 0} me={me} />
            ) : <div className="flex-1 flex items-center justify-center text-sm text-secondary" />
          }
          <Resizable
            minHeight={240}
            maxHeight={480}
            defaultSize={{
              height: 240
            }}
            className="w-full border-0 border-t border-solid border-accent"
          >
            <ChatInput hasForbidden={me?.hasForbidden ?? false} inChannel={(channelInfo?.inChannel ?? false)} channelReady={ChatChannelState.Fetched === channelStatus} onSubmit={onSubmit} />
          </Resizable>
        </div>
        <div className="flex-shrink-0 w-[188px] border-l-primary flex flex-col">
          <div className="chat-room-notice p-2 box-border  flex-shrink-0 border-b-primary flex flex-col">
            <div className="chat-room-notice-title text-sm py-1">公告</div>
            <ScrollArea className="h-[164px]">
              <pre className="text-xs text-tertiary leading-5">
                {channelInfo?.notice}
              </pre>
            </ScrollArea>
          </div>
          <div className="chat-room-users h-full flex flex-col overflow-hidden">
            <div className="chat-room-users-title p-2 flex items-center">
              <div className="text">群成员</div>
              <div className="text-xs text-tertiary bg-accent rounded-xl px-1 min-w-4 text-center ml-1">
                {channelInfo?.userNum}
              </div>
            </div>
            <ScrollArea className="chat-room-users-list flex-1">
              {subscribes?.sort((a, b) => +b.type - +a.type).map(member => (
                <ContextMenu key={member.uid}>
                  <ContextMenuTrigger asChild>
                    <div className="chat-room-users-item flex items-center p-2 box-border hover:bg-accent w-full overflow-hidden">
                      <UserAvatar
                        src={member.avatar}
                        name={member.name}
                        uid={member.id}
                        className="h-6 w-6"
                        size="sm" shape="circle" type="1" />
                      <div className="text-xs leading-6 ml-2 mr-1 flex-1 overflow-hidden text-ellipsis whitespace-nowrap">
                        {member.name}
                      </div>
                      <div className="">
                        {member.isOwner && <JknIcon name="owner" />}
                        {member.hasForbidden && <JknIcon name="forbidden" />}
                        {member.isManager && <JknIcon name="manager" />}
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => onReplayUser(member)}>
                      <div className="text-xs text-secondary" onKeyDown={() => { }}>
                        回复用户
                      </div>
                    </ContextMenuItem>
                    {hasManageAuth(member) && (
                      <ContextMenuItem onClick={() => onChangeMemberManageAuth(member)}>
                        <div className="text-xs text-secondary" onKeyDown={() => { }}>
                          {member.isManager ? '取消管理员' : '设为管理员'}
                        </div>
                      </ContextMenuItem>
                    )}
                    {hasForbiddenAuth(member) && (
                      <ContextMenuItem
                        onClick={() => {
                          onChangeMemberForbiddenAuth(member)
                        }}
                      >
                        <div className="text-xs text-secondary" onKeyDown={() => { }}>
                          {!member.hasForbidden ? '添加黑名单' : '解除黑名单'}
                        </div>
                      </ContextMenuItem>
                    )}
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  )
}

const ChatRoomNotice = ({ notice, onConfirm }: { notice: string; onConfirm: () => void }) => {
  const [countDown] = useCountDown({
    leftTime: 1000 * 10
  })
  return (
    <div className="chat-room-notice py-6 px-5">
      <div className="chat-room-notice-title text-xl mb-6">尊敬的各位群友</div>
      <div className="bg">
        <div className="mb-4">👉入群请自觉遵守群规:</div>
        <div className="chat-room-notice-content text-xs text-tertiary leading-5 h-[90px] overflow-y-auto">
          {
            notice.split('\n').filter(s => !!s).map(item => (
              <div key={nanoid()}>{item}</div>
            ))
          }
        </div>
      </div>
      <div className="text-center">
        <div
          className="text-base inline-block w-[120px] h-[38px] leading-[38px] mt-4 rounded-[300px] bg-[#575757]"
          onClick={() => countDown <= 0 && onConfirm()}
          onKeyDown={() => { }}
        >
          <span>确定</span>
          {countDown >= 1 ? <span>({Math.floor(countDown / 1000)}s)</span> : null}
        </div>
      </div>
    </div>
  )
}
