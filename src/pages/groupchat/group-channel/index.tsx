import { Button, Input, JknSearchInput, useModal } from '@/components'
import { useChatNoticeStore, useGroupChatShortStore, useGroupChatStoreNew } from '@/store/group-chat-new'
import { cn } from '@/utils/style'
import { useLatest, useUpdate } from 'ahooks'
import { memo, type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import WKSDK, {
  ConnectStatus,
  ConversationAction,
  type Conversation,
  type Channel,
  type ChannelInfo,
  ChannelTypeGroup,
  CMDContent,
  ChannelTypePerson
} from 'wukongimjssdk'
import { useShallow } from 'zustand/react/shallow'
import APIClient from '../Service/APIClient'

import { cleanUnreadConversation, getChatNameAndAvatar, getChatChannels } from '@/api'
// import { useQuery } from "@tanstack/react-query";
import ChatAvatar from '../components/chat-avatar'

import { JknIcon, Skeleton } from '@/components'
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  groupToChannelInfo,
  judgeIsExpireGroupCache,
  judgeIsUserInSyncChannelCache,
  setExpireGroupInCache,
  setPersonChannelCache,
  setUserInSyncChannelCache
} from '../chat-utils'
import CreateGroup from '../components/create-and-join-group'
import UpdateGroupInfo from './updateGroupInfo'
import { JoinGroupContentModal } from "../components/create-and-join-group/join-group-content"
import { chatManager, useChatStore } from "@/store"
import { useLatestRef } from "@/hooks"

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

const GroupChannel = (props: {
  onSelectChannel: (c: Channel) => void
}) => {


  

  // const [editChannel, setEditChannel] = useState<ConversationWrap>()
  // 修改社群
  // const updateGroupInfoModal = useModal({
  //   content: (
  //     <>
  //       {editChannel && (
  //         <UpdateGroupInfo
  //           group={editChannel.channel}
  //           onSuccess={params => {
  //             // refetch();
  //             const target = data?.find(item => item.account === params.account)
  //             if (target) {
  //               if (params.avatar) {
  //                 target.avatar = params.avatar
  //               }
  //               if (params.name) {
  //                 target.name = params.name
  //               }
  //               WKSDK.shared().channelManager.setChannleInfoForCache(toChannelInfo({ ...target }))
  //             }
  //           }}
  //           total={Number(editChannel.total_user)}
  //         />
  //       )}
  //     </>
  //   ),
  //   title: '社群信息',
  //   footer: null,
  //   className: 'w-[700px]',
  //   closeIcon: true
  // })
  
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

  const conversations = useQuery({
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

  const messageUserFrom = useMemo(() => {
    const userIds = new Set<string>()
    conversations.data?.forEach(conversation => {
      userIds.add(conversation.lastMessage?.fromUID || '')
    })

    return Array.from(userIds).filter(Boolean)
  }, [conversations.data])

  const userInfos = useQueries({
    queries: messageUserFrom.map(uid => ({
      queryKey: [getChatNameAndAvatar.cacheKey, uid],
      queryFn: () => getChatNameAndAvatar({ type: '1', id: uid }).then(r => ({ ...r, uid })),
      enabled: chatState === ConnectStatus.Connected,
    })),
    combine: (results) => {
      return results.map(r => r.data)
    }
  })

  // 监听最近会话列表的变化
  const conversationListener = useCallback((conversation: Conversation, action: ConversationAction) => {
    // 监听最近会话列表的变化
    const _channelQueryKey = ['conversation-sync', channelSearchKeyword]

    if (action === ConversationAction.add || action === ConversationAction.update) {
      const _channels = queryClient.getQueryData<NonNullable<typeof conversations.data>>(_channelQueryKey)
      console.log('updateRender', _channels, ['conversation-sync', channelSearchKeyword])
      if (_channels) {

        const _channel = _channels.find(c => c.channel.channelID === conversation.channel.channelID)
        if (_channel) {
          if (_channel === conversation) {
            updateRender()

          } else {
            queryClient.setQueryData<NonNullable<typeof conversations.data>>(_channelQueryKey, oldData => {
              return oldData?.map(item => {
                return item.channel.channelID === conversation.channel.channelID ? conversation : item
              })
            })
          }
        } else {
          queryClient.setQueryData<NonNullable<typeof conversations.data>>(_channelQueryKey, c => ([
            conversation,
            ...(c ?? [])
          ]))
        }
      }
    } else if (action === ConversationAction.remove) {
      queryClient.setQueryData<NonNullable<typeof conversations.data>>(_channelQueryKey, oldData => {
        return oldData?.filter(item => item.channel.channelID !== conversation.channel.channelID)
      })
    }
  }, [queryClient, updateRender, channelSearchKeyword])

  // 强制刷新会话
  const channelInfoListener = (channelInfo: ChannelInfo) => {
    // if (latestConversation.current.length > 0) {
    //   const temp = [...latestConversation.current]
    //   const idx = latestConversation.current.findIndex(c => c.channel.channelID === channelInfo.channel.channelID);
    //   if(idx >= 0) {
    //     temp[idx].reloadIsMentionMe()
    //     setConversationWraps(temp);
    //   }
    // }
  }

  const parseLastMessage = (message: Conversation) => {
    if (!message) {
      return ''
    }

    const userMap = new Map<string, ArrayItem<typeof userInfos>>()

    userInfos.forEach(info => {
      if (info) {
        userMap.set(info.uid, info)
      }
    })

    let mention: ReactNode | string = ''
    let head: ReactNode | string
    let content: ReactNode | string
    // const draft = message.remoteExtra.draft
    // if (draft && draft !== '') {
    //   head = draft
    // }

    if (message.isMentionMe === true) {
      mention = <span style={{ color: 'red' }}>[有人@我]</span>
    }
    if (message.lastMessage) {
      const userInfo = userMap.get(message.lastMessage.fromUID)

      if (userInfo) {
        head = `${userInfo.name}: `
      }

      content = message.lastMessage.content.conversationDigest || ''
      if (message.lastMessage.content instanceof CMDContent) {
        if (message.lastMessage.content.cmd === 'messageRevoke') {
          content = '撤回了一条消息'
        } else {
          content = '[系统消息]'
        }
      }
    }

    return (
      <span className="inline-block whitespace-nowrap w-full overflow-hidden text-ellipsis">
        {mention}
        {head}
        {content}
      </span>
    )
  }

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

  return (
    <div className="w-[180px] h-full border-0 border-x border-solid border-border bg-[#161616]">
      <div className="group-filter flex items-center justify-between px-1 pb-3 pt-5">
        <JknSearchInput size="mini" onSearch={setChannelSearchKeyword} rootClassName="bg-accent px-2 py-0.5 w-full text-tertiary" className="text-secondary placeholder:text-tertiary" placeholder="搜索" />
        <CreateGroup />
      </div>
      <div className="group-list">
        {
          conversations.isLoading ? (
            <ChannelSkeleton />
          ) : (
            conversations.data?.map(c => (
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
                  <div className="group-last-msg flex justify-between">
                    <div className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis w-full text-xs text-tertiary">
                      {
                        parseLastMessage(c)
                      }
                    </div>
                  </div>
                </div>
              </div>
            ))
          )
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
