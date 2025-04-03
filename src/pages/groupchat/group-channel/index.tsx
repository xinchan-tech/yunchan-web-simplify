import { Button, Input, JknSearchInput, useModal } from '@/components'
import { cn } from '@/utils/style'
import { useUpdate, useUpdateEffect } from 'ahooks'
import { memo, useCallback, useEffect, useState } from 'react'
import WKSDK, {
  type Channel,
  type ChannelInfo,
  type CMDContent,
  ConnectStatus,
  type Conversation,
  ConversationAction
} from 'wukongimjssdk'

import { cleanUnreadConversation } from '@/api'
// import { useQuery } from "@tanstack/react-query";
import ChatAvatar from '../components/chat-avatar'

import { Skeleton } from '@/components'
import { useLatestRef } from "@/hooks"
import { ChatCmdType, ChatMessageType, chatManager, useChatStore } from "@/store"
import { dateUtils } from "@/utils/date"
import { useQuery, useQueryClient } from '@tanstack/react-query'
import dayjs from "dayjs"
import { useImmer } from "use-immer"
import { conversationCache } from "../cache"
import { getTimeFormatStr } from "../chat-utils"
import CreateGroup from '../components/create-and-join-group'
import { UsernameSpan } from "../components/username-span"
import { useCMDListener } from "../lib/hooks"

export type GroupData = {
  id: string
  account: string
  avatar: string
  name: string
  price: string
  brief: string
  tags: string
  total_user: string
  in_channel: number
  products?: {
    channel_id: string
    type: string
    product_sn: string
    price: string
    unit: string
  }[]
}

const useConversationWithCache = () => {
  const [conversations, setConversations] = useImmer<Conversation[]>([])

  useEffect(() => {
    conversationCache.getConversations().then(convs => {
      convs?.sort((a, b) => b.timestamp - a.timestamp)
      setConversations(convs ?? [])
    })
  }, [setConversations])

  return [conversations, setConversations] as const
}


const GroupChannel = (props: {
  onSelectChannel: (c: Channel) => void
}) => {

  /**
   * 新逻辑
   */
  const [channelSearchKeyword, setChannelSearchKeyword] = useState<string>()
  const chatState = useChatStore(s => s.state)
  const channelQueryKey = ['conversation-sync', channelSearchKeyword]
  const queryClient = useQueryClient()
  const updateRender = useUpdate()
  const lastChannel = useChatStore(s => s.lastChannel)
  const selectionChannel = useLatestRef<Channel>(lastChannel!)
  const [conversations, setConversations] = useConversationWithCache()

  const conversationsQuery = useQuery({
    queryKey: channelQueryKey,
    queryFn: () => WKSDK.shared().conversationManager.sync({}),
    enabled: chatState === ConnectStatus.Connected,
    select: r => {
      r.sort((a, b) => b.timestamp - a.timestamp)
      if (channelSearchKeyword) {
        return r.filter(c => c.channelInfo?.title?.includes(channelSearchKeyword))
      }
      return r
    }
  })

  useUpdateEffect(() => {
    setConversations(conversationsQuery.data ?? [])
    conversationCache.updateBatch(conversationsQuery.data ?? [])
  }, [conversationsQuery.data])

  // 监听最近会话列表的变化
  const conversationListener = useCallback((conversation: Conversation, action: ConversationAction) => {
    // 监听最近会话列表的变化
    const _channelQueryKey = ['conversation-sync', channelSearchKeyword]

    if (action === ConversationAction.add || action === ConversationAction.update) {
      const _channels = queryClient.getQueryData<NonNullable<typeof conversations>>(_channelQueryKey)
      if (_channels) {
        const _channel = _channels.find(c => c.channel.channelID === conversation.channel.channelID)
        if (_channel) {
          if (useChatStore.getState().lastChannel?.isEqual(conversation.channel)) {
            conversation.unread = 0
          }
          conversation.reloadIsMentionMe()

          queryClient.setQueryData<NonNullable<typeof conversations>>(_channelQueryKey, oldData => {
            const r = oldData?.map(item => {
              return item.channel.channelID === conversation.channel.channelID ? conversation : item
            })
            conversationCache.updateBatch(r ?? [])
            return r
          })
          updateRender()
        } else {
          queryClient.setQueryData<NonNullable<typeof conversations>>(_channelQueryKey, c => ([
            conversation,
            ...(c ?? [])
          ]))
        }
      }
    } else if (action === ConversationAction.remove) {
      queryClient.setQueryData<NonNullable<typeof conversations>>(_channelQueryKey, oldData => {
        return oldData?.filter(item => item.channel.channelID !== conversation.channel.channelID)
      })
    }
  }, [queryClient, updateRender, channelSearchKeyword])

  useCMDListener((cmd) => {
    const content = cmd.content as CMDContent
    if (content.cmd === ChatCmdType.MessageRevoke) {
      const conversation = conversations.find(c => c.channel.channelID === cmd.channel.channelID)
      if (conversation) {
        conversation.lastMessage = cmd
        conversation.reloadIsMentionMe()
        conversationCache.updateOrSave(conversation)
        updateRender()
      }
    }
  })

  useEffect(() => {
    // WKSDK.shared().connectManager.addConnectStatusListener(connectStatusListener) // 监听连接状态
    WKSDK.shared().conversationManager.addConversationListener(conversationListener) // 监听最近会话列表的变化

    // WKSDK.shared().channelManager.addListener(channelInfoListener) // 监听频道信息变化

    return () => {
      WKSDK.shared().conversationManager.removeConversationListener(conversationListener)
      // WKSDK.shared().connectManager.removeConnectStatusListener(connectStatusListener)
      // WKSDK.shared().channelManager.removeListener(channelInfoListener)
    }
  }, [conversationListener])


  const onChannelSelect = (conversation: Conversation) => {
    chatManager.setLastChannelId(conversation.channel)
    props.onSelectChannel(conversation.channel)

    if (conversation.unread || conversation.isMentionMe) {
      if (conversation.unread) {
        conversation.unread = 0
      }

      if (conversation.isMentionMe) {
        conversation.isMentionMe = false
      }

      WKSDK.shared().conversationManager.notifyConversationListeners(conversation, ConversationAction.update)
      cleanUnreadConversation(conversation.channel)
    }
  }

  const [inviteCode, setInviteCode] = useState('')

  const inviteToGroupModal = useModal({
    content: (
      <div className="flex items-center justify-center pl-2 pr-2 flex-col pt-5 pb-5">
        <div className={'border-dialog-border rounded-sm  bg-accent inline-block'}>
          <Input
            className="border-none placeholder:text-tertiary flex-1"
            value={inviteCode}
            onChange={e => {
              setInviteCode(e.target.value)
            }}
            style={{ marginTop: '0' }}
            placeholder="请输入邀请码"
          />
        </div>
        <Button
          className="mt-5"
          onClick={() => {
            handleInviteToGroup()
          }}
        >
          确定
        </Button>
      </div>
    ),
    footer: false,
    title: '输入邀请码加群',
    className: 'w-[400px]',
    closeIcon: false
  })

  const handleInviteToGroup = () => {
    inviteToGroupModal.modal.close()
  }

  const statusInfo: Record<ConnectStatus, { color: string, text: string }> = {
    [ConnectStatus.Disconnect]: {
      color: 'red',
      text: '未连接'
    },
    [ConnectStatus.Connecting]: {
      color: 'yellow',
      text: '连接中'
    },
    [ConnectStatus.Connected]: {
      color: 'green',
      text: '已连接'
    },
    [ConnectStatus.ConnectFail]: {
      color: 'red',
      text: '连接失败'
    },
    [ConnectStatus.ConnectKick]: {
      color: 'red',
      text: '被踢'
    }
  }

  return (
    <div className="w-[180px] h-full border-0 border-x border-solid border-border bg-[#161616]">
      <div className="flex items-center text-xs text-tertiary px-2 py-1">
        <span className="size-2 rounded-full mr-2" style={{ background: statusInfo[chatState].color }} />
        <span>
          {statusInfo[chatState].text}
        </span>
      </div>
      <div className="group-filter flex items-center justify-between px-1 pb-3">
        <JknSearchInput size="mini" onSearch={setChannelSearchKeyword} rootClassName="bg-accent px-2 py-0.5 w-full text-tertiary" className="text-secondary placeholder:text-tertiary" placeholder="搜索" />
        {/* <CreateGroup /> */}
      </div>
      <div className="group-list">
        {
          conversations.map(c => (
            <div key={c.channel.channelID}
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
                </div>
                <div className="group-last-msg flex justify-between items-center">
                  <div className="flex-1 text-xs text-tertiary line-clamp-1">
                    {
                      c.isMentionMe ? (
                        <span style={{ color: 'red' }}>[有人@我]</span>
                      ) : null
                    }
                    <UsernameSpan uid={c.lastMessage?.fromUID!} channel={c.channel!} colon />
                    {
                      c.lastMessage?.contentType === ChatMessageType.Cmd ?
                        c.lastMessage.content.cmd === ChatCmdType.MessageRevoke ?
                          '撤回了一条消息' : '[系统消息]' : c.lastMessage?.contentType === ChatMessageType.Image ?
                          '[图片]' : +c.lastMessage!.contentType === +ChatMessageType.System ? '加入群聊' : c.lastMessage?.content.text || ''
                    }
                  </div>
                  <div className="text-xs text-tertiary">
                    {
                      c.lastMessage?.timestamp ? dateUtils.dateAgo(dayjs(c.lastMessage.timestamp * 1000)) : null
                    }
                  </div>
                </div>
              </div>
            </div>
          ))
        }
      </div>
      {/* {updateGroupInfoModal.context} */}
      {inviteToGroupModal.context}
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

const ChannelSkeleton = memo(() => Array.from({
  length: 10
}).map((_, i) => (
  // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
  <Skeleton style={{ background: '#555' }} key={`${i}channel`} className="h-[76px] mb-2" />
)))
export default GroupChannel
