import { Button, Input, JknSearchInput, useModal } from '@/components'
import { useChatNoticeStore, useGroupChatShortStore, useGroupChatStoreNew } from '@/store/group-chat-new'
import { cn } from '@/utils/style'
import { useLatest } from 'ahooks'
import { memo, type ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import WKSDK, {
  ConnectStatus,
  ConversationAction,
  type Conversation,
  Channel,
  ChannelInfo,
  ChannelTypeGroup,
  CMDContent,
  ChannelTypePerson
} from 'wukongimjssdk'
import { useShallow } from 'zustand/react/shallow'
import { ConversationWrap } from '../ConversationWrap'
import APIClient from '../Service/APIClient'

import { getGroupChannels } from '@/api'
// import { useQuery } from "@tanstack/react-query";
import ChatAvatar from '../components/chat-avatar'

import { JknIcon, Skeleton } from '@/components'
import { useQuery } from '@tanstack/react-query'
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
import { useChatStore } from "@/store"

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
  onSelectChannel: (c: Channel, con: ConversationWrap) => void
  onInitChannel: (conversations: ConversationWrap[]) => void
}) => {
  const { conversationWraps, setConversationWraps, setReadyToJoinGroup, readyToJoinGroup, getGroupDetailData } =
    useGroupChatShortStore(
      useShallow(state => ({
        conversationWraps: state.conversationWraps,
        setConversationWraps: state.setConversationWraps,
        setReadyToJoinGroup: state.setReadyToJoinGroup,
        readyToJoinGroup: state.readyToJoinGroup,
        getGroupDetailData: state.getGroupDetailData
      }))
    )
  const { updateForceUpdateAvatarId } = useChatNoticeStore()
  // const update = useUpdate();
  const latestConversation = useLatest(conversationWraps)
  const { onSelectChannel } = props
  const { setSelectedChannel, selectedChannel, setToChannel } = useGroupChatStoreNew()
  const latestChannel = useLatest(selectedChannel)
  const [channelSearchKeyword, setChannelSearchKeyword] = useState<string>()
  // 排序最近会话列表
  const sortConversations = (conversations?: Array<ConversationWrap>) => {
    let newConversations = conversations
    if (!newConversations) {
      newConversations = [...(latestConversation.current || [])]
    }
    if (!newConversations || newConversations.length <= 0) {
      return []
    }
    const sortAfter = newConversations.sort((a, b) => {
      let aScore = a.timestamp
      let bScore = b.timestamp
      if (a.extra?.top === 1) {
        aScore += 1000000000000
      }
      if (b.extra?.top === 1) {
        bScore += 1000000000000
      }
      return bScore - aScore
    })
    return sortAfter
  }

  const batchUpdateConversation = (list: ConversationWrap[]) => {
    if (Array.isArray(list) && list.length > 0) {
      list.forEach(item => {
        fetchChannelInfoIfNeed(item.channel)
      })
    }
  }
  const fetchData = async () => {
    if (Array.isArray(data) && data.length > 0) {
      return
    }
    const res = await getGroupChannels({ type: '1', keywords: channelSearchKeyword })
    if (Array.isArray(res)) {
      res.forEach(channel => {
        const cacheData = { name: channel.name, avatar: channel.avatar }
        WKSDK.shared().channelManager.setChannleInfoForCache(groupToChannelInfo(cacheData, channel.account))
      })
    }
    return res
  }
  const options = {
    queryFn: fetchData,
    queryKey: ['channel:fetchData', channelSearchKeyword]
  }

  const { data } = useQuery(options)
  const [editChannel, setEditChannel] = useState<ConversationWrap>()
  // 修改社群
  const updateGroupInfoModal = useModal({
    content: (
      <>
        {editChannel && (
          <UpdateGroupInfo
            group={editChannel.channel}
            onSuccess={params => {
              // refetch();
              const target = data?.find(item => item.account === params.account)
              if (target) {
                if (params.avatar) {
                  target.avatar = params.avatar
                }
                if (params.name) {
                  target.name = params.name
                }
                WKSDK.shared().channelManager.setChannleInfoForCache(toChannelInfo({ ...target }))
              }
            }}
            total={Number(editChannel.total_user)}
          />
        )}
      </>
    ),
    title: '社群信息',
    footer: null,
    className: 'w-[700px]',
    closeIcon: true
  })

  /**
   * 新逻辑
   */
  const chatState = useChatStore(s => s.state)

  const channel = useQuery({
    queryKey: ['conversation-sync'],
    queryFn: WKSDK.shared().conversationManager.sync,
    enabled: chatState === ConnectStatus.Connected,
    select: r => {
      return r.sort((a, b) => a.timestamp - b.timestamp)
    }
  })



  // 监听连接状态
  const firstInitFlag = useRef(true)
  const [fetchingConversation, setFetchingConversation] = useState(false)
  const connectStatusListener = async (status: ConnectStatus) => {
    if (status === ConnectStatus.Connected) {
      setFetchingConversation(true)
      try {
        const remoteConversations = await WKSDK.shared().conversationManager.sync() // 同步最近会话列表
        setFetchingConversation(false)
        if (remoteConversations && remoteConversations.length > 0) {
          const temp = sortConversations(remoteConversations.map(conversation => new ConversationWrap(conversation)))
          batchUpdateConversation(temp)
          setConversationWraps(temp)
          if (firstInitFlag.current === true) {
            firstInitFlag.current = false
            typeof props.onInitChannel === 'function' && props.onInitChannel(temp)
          }
        } else {
          setConversationWraps([])
        }
      } catch (er) {
        setFetchingConversation(false)
      }
    }
  }

  // 监听最近会话列表的变化
  const conversationListener = (conversation: Conversation, action: ConversationAction) => {
    // 监听最近会话列表的变化

    if (action === ConversationAction.add) {
      const temp = [new ConversationWrap(conversation), ...(latestConversation.current || [])]
      batchUpdateConversation(temp)
      setConversationWraps(temp)
      handleSelectChannel(conversation.channel, new ConversationWrap(conversation))
    } else if (action === ConversationAction.update) {
      // 过期了，不更新这个channel
      if (judgeIsExpireGroupCache(conversation.channel.channelID)) {
        return
      }
      if (conversation.channel.channelID === latestChannel.current?.channelID) {
        // 避免未读消息在选中时还展示
        conversation.unread = 0
        conversation.isMentionMe = false
      }
      const index = latestConversation.current?.findIndex(
        item =>
          item.channel.channelID === conversation.channel.channelID &&
          item.channel.channelType === conversation.channel.channelType
      )
      if (index !== undefined && index >= 0) {
        // conversation.reloadIsMentionMe();

        latestConversation.current![index] = new ConversationWrap(conversation)
        const temp = sortConversations()
        batchUpdateConversation(temp)
        setConversationWraps(temp)
      }
    } else if (action === ConversationAction.remove) {
      const index = latestConversation.current?.findIndex(
        item =>
          item.channel.channelID === conversation.channel.channelID &&
          item.channel.channelType === conversation.channel.channelType
      )
      const temp = [...(latestConversation.current || [])]
      if (index && index >= 0) {
        temp.splice(index, 1)
      }
      batchUpdateConversation(temp)
      setConversationWraps(temp)
    }
  }

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
      const channelInfo = WKSDK.shared().channelManager.getChannelInfo(message.channel)
      console.log(channelInfo)
      if (channelInfo) {
        head = `${channelInfo.title}：`
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
      <span>
        {mention}
        {head}
        {content}
      </span>
    )
  }

  useEffect(() => {
    WKSDK.shared().connectManager.addConnectStatusListener(connectStatusListener) // 监听连接状态
    WKSDK.shared().conversationManager.addConversationListener(conversationListener) // 监听最近会话列表的变化

    WKSDK.shared().channelManager.addListener(channelInfoListener) // 监听频道信息变化

    return () => {
      WKSDK.shared().conversationManager.removeConversationListener(conversationListener)
      WKSDK.shared().connectManager.removeConnectStatusListener(connectStatusListener)
      WKSDK.shared().channelManager.removeListener(channelInfoListener)
    }
  }, [])

  const fetchChannelInfoIfNeed = (channel: Channel) => {
    const channelInfo = WKSDK.shared().channelManager.getChannelInfo(channel)
    if (!channelInfo) {
      WKSDK.shared().channelManager.fetchChannelInfo(channel)
    }
  }

  const clearConversationUnread = (channel: Channel) => {
    const conversation = WKSDK.shared().conversationManager.findConversation(channel)
    if (conversation) {
      conversation.unread = 0
      WKSDK.shared().conversationManager.notifyConversationListeners(conversation, ConversationAction.update)
    }
  }

  const clearConversationMentionMe = (channel: Channel) => {
    const conversation = WKSDK.shared().conversationManager.findConversation(channel)
    if (conversation && conversation.isMentionMe === true) {
      conversation.isMentionMe = false
      WKSDK.shared().conversationManager.notifyConversationListeners(conversation, ConversationAction.update)
    }
  }

  const handleSelectChannel = (channel: Channel, conversation: ConversationWrap) => {
    //  优化一下，有未读消息才clear unread
    if (conversation && conversation.unread > 0) {
      APIClient.shared.clearUnread(channel)
      clearConversationUnread(channel)
    }

    clearConversationMentionMe(channel)
    if (channel.channelID === selectedChannel?.channelID) {
      return
    }
    getGroupDetailData(channel.channelID)
    setSelectedChannel(channel)
    setToChannel(channel)
    if (typeof onSelectChannel === 'function') {
      onSelectChannel(channel, conversation)
    }
  }
  // console.log(conversationWraps, "conversationWraps");

  const toChannelInfo = useCallback((data: GroupData) => {
    const channelInfo = new ChannelInfo()
    channelInfo.channel = new Channel(data.account, ChannelTypeGroup)
    channelInfo.title = data.name
    channelInfo.mute = false
    channelInfo.top = false
    channelInfo.online = false

    channelInfo.logo = data.avatar

    return channelInfo
  }, [])



  const [goodConversations, setGoodConversations] = useState<ConversationWrap[]>([])

  useEffect(() => {
    const filterConversations: ConversationWrap[] = []

    if (Array.isArray(data) && Array.isArray(conversationWraps)) {
      data.forEach(item => {
        WKSDK.shared().channelManager.setChannleInfoForCache(toChannelInfo(item))

        const joinedChannel = conversationWraps.find(con => con.channel.channelID === item.account)
        if (joinedChannel) {
          joinedChannel.total_user = item.total_user
          if (joinedChannel.timestamp === 0) {
            setExpireGroupInCache(joinedChannel.channel.channelID, true)
          }

          filterConversations.push(joinedChannel)
        }
      })
    }

    setGoodConversations(filterConversations)
  }, [data, conversationWraps, toChannelInfo])

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
          channel.isLoading ? (
            <ChannelSkeleton />
          ) : (
            channel.data?.map(c => (
              <div key={c.channel.channelID}
                className={cn(
                  'flex conversation-card',
                  c.channel.channelID === selectedChannel?.channelID && !readyToJoinGroup && 'actived'
                )}
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
                <div className="group-data flex-1">
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
      {updateGroupInfoModal.context}
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
