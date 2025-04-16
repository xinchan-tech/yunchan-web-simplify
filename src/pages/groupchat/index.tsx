import GroupChannel from './group-channel'
import GroupChatLeftBar from './left-bar'

import { chatConstants, chatManager, useToken, useUser } from '@/store'
import { createContext, useEffect, useRef, useState } from 'react'
import WKSDK, { type Channel, type Message } from 'wukongimjssdk'

import { useGroupChatStoreNew } from '@/store/group-chat-new'

import { loginImService } from '@/api'

import { Toaster } from '@/components'

import { useMount } from 'ahooks'
import { ChatRoom } from './chat-room'
import ChatInfoDrawer from './components/chat-info-drawer'
import { initImDataSource } from './lib/datasource'
import { connectStatusListener } from './lib/event'
import TextImgLive from './text-img-live'
import { appEvent } from '@/utils/event'

export type ReplyFn = (option: {
  message?: Message
  isQuote?: boolean
  quickReplyUserId?: string
}) => void
export const GroupChatContext = createContext<{
  handleReply: ReplyFn
  handleRevoke: (message: Message) => void
  syncSubscriber: (channel: Channel) => Promise<void>
}>({
  handleReply: () => {},
  handleRevoke: () => {},
  syncSubscriber: async () => {}
})

window.WKSDK = WKSDK

const COUNT_DOWN_NUM = 10

const GroupChatPage = () => {
  const token = useToken(s => s.token)
  const { user } = useUser()
  const loginStatus = useRef(false)

  const [indexTab, setIndexTab] = useState<'chat' | 'live'>('chat')
  const { selectedChannel } = useGroupChatStoreNew()

  const msgListRef = useRef<any>(null)

  useMount(() => {
    if (!loginStatus.current) {
      loginImService().then(() => {
        loginStatus.current = true
      })
    }
  })

  useEffect(() => {
    const handler = () => {
      useToken.getState().removeToken()
      useUser.getState().reset()
    }
    appEvent.on('logout', handler)

    return () => {
      appEvent.off('logout', handler)
    }
  }, [])

  // const {
  //   setSubscribers,
  //   setFetchingSubscribers,
  //   setReplyMessage,
  //   setInputValue,
  //   setLocatedMessageId,
  //   setMessages,
  //   getGroupDetailData,
  //   groupDetailData,
  //   setMentions
  // } = useGroupChatShortStore(
  //   useShallow(state => {
  //     return {
  //       conversationWraps: state.conversationWraps,
  //       subscribers: state.subscribers,
  //       setSubscribers: state.setSubscribers,
  //       setFetchingSubscribers: state.setFetchingSubscribers,
  //       setReplyMessage: state.setReplyMessage,
  //       setInputValue: state.setInputValue,
  //       setLocatedMessageId: state.setLocatedMessageId,
  //       setMessages: state.setMessages,
  //       getGroupDetailData: state.getGroupDetailData,
  //       groupDetailData: state.groupDetailData,

  //       setMentions: state.setMentions
  //     }
  //   })
  // )

  // 输入框实例
  // const messageInputRef = useRef()
  //

  // // 监听cmd消息
  // cmdListener = (msg: Message) => {
  //   console.log('收到CMD：', msg)
  //   const cmdContent = msg.content as CMDContent
  //   if (msgListRef.current) {
  //     const temp = [...msgListRef.current.getMessagesRef()]
  //     temp.push(msg)
  //     setMessages(temp)
  //   }
  //   if (cmdContent.cmd === 'messageRevoke') {
  //     // WKSDK.shared()
  //     //   .config.provider.syncConversationsCallback()
  //     //   .then((newConversations) => {
  //     //     const newWarps = newConversations.map(
  //     //       (item) => new ConversationWrap(item)
  //     //     );
  //     //     setConversationWraps(newWarps);
  //     //   });
  //   } else if (cmdContent.cmd === 'channelUpdate') {
  //     // 编辑群时也调用这个方法更新
  //     WKSDK.shared().channelManager.fetchChannelInfo(new Channel(msg.channel.channelID, ChannelTypeGroup))
  //     // 修改了群公告，群权限后触发
  //     getGroupDetailData(msg.channel.channelID)
  //     // 有人加群后也触发updatechannel
  //     syncSubscriber(msg.channel)
  //   } else if (cmdContent.cmd === 'forbidden') {
  //     // 修改了禁言后重新同步群成员
  //     syncSubscriber(msg.channel)
  //   }
  //   const channel = msg.channel
  //   const conversation = WKSDK.shared().conversationManager.findConversation(channel)

  //   if (conversation) {
  //     WKSDK.shared().conversationManager.notifyConversationListeners(conversation, ConversationAction.update)
  //   }
  // }

  // 阅读公告倒计时
  const [countdown, setCountdown] = useState(COUNT_DOWN_NUM)

  useEffect(() => {
    if (!token || !user?.username) {
      return
    }

    const localConfig = chatManager.getWsConfig()
    const channel = new BroadcastChannel(chatConstants.broadcastChannelId)

    if (!user?.username || !token) {
      return
    }

    WKSDK.shared().config.uid = user.username
    WKSDK.shared().config.token = token
    WKSDK.shared().config.addr = localConfig.addr
    WKSDK.shared().config.deviceFlag = localConfig.deviceFlag

    /**
     * 监听事件
     */
    WKSDK.shared().connectManager.addConnectStatusListener(connectStatusListener)
    // WKSDK.shared().chatManager.addCMDListener(cmdListener)

    channel.onmessage = event => {
      if (event.data.type === 'logout') {
        window.close()
      }
    }
    initImDataSource()
    WKSDK.shared().connectManager.connect()
    return () => {
      channel.close()
      WKSDK.shared().connectManager.removeConnectStatusListener(connectStatusListener)
      // WKSDK.shared().chatManager.removeCMDListener(cmdListener)
      WKSDK.shared().disconnect()
    }
  }, [token, user?.username])

  // const syncSubscriber = async (channel: Channel) => {
  //   setFetchingSubscribers(true)
  //   try {
  //     await WKSDK.shared().channelManager.syncSubscribes(channel) // 同步订阅者
  //     setFetchingSubscribers(false)
  //   } catch (err) {
  //     setFetchingSubscribers(false)
  //   }
  //   const members: Subscriber[] = WKSDK.shared().channelManager.getSubscribes(channel)
  //   subscriberCache.set(channel.channelID, members)
  //   setSubscribers(members)
  // }

  // // 群成员

  const handleChannelSelect = (channel: Channel) => {
    // setLocatedMessageId('')
    // if (subscriberCache.has(channel.channelID)) {
    //   const members = subscriberCache.get(channel.channelID) || []
    //   setSubscribers(members)
    //   if (msgListRef.current) {
    //     msgListRef.current.pullLast(channel, true)
    //   }
    // } else {
    //   syncSubscriber(channel).finally(() => {
    //     // 查完群员之后缓存了人员头像昵称再拉消息，优化性能
    //     if (msgListRef.current) {
    //       msgListRef.current.pullLast(channel, true)
    //     }
    //   })
    // }
  }

  // // 初始化群聊列表和消息
  // const onInitChannel = (list: ConversationWrap[]) => {
  //   const firstChannel = list.find(item => item.channel.channelID === selectedChannel?.channelID)?.channel
  //   if (firstChannel) {
  //     handleChannelSelect(firstChannel)
  //     getGroupDetailData(firstChannel.channelID)
  //     // 进来自动清理未读
  //     const conversation = WKSDK.shared().conversationManager.findConversation(firstChannel)
  //     if (conversation && conversation.unread > 0) {
  //       APIClient.shared.clearUnread(firstChannel)
  //       conversation.unread = 0
  //       WKSDK.shared().conversationManager.notifyConversationListeners(conversation, ConversationAction.update)
  //     }
  //   }
  // }

  useEffect(() => {
    window.document.title = '讨论社群'
  }, [])

  const [openDrawer, setOpenDrawer] = useState(false)

  if (!token) {
    return (
      <div style={{ height: '100vh' }} className="w-full flex items-center justify-center">
        您已退出登录，请关闭窗口并重新登录
      </div>
    )
  }

  return (
    <div className="group-chat-container flex">
      <Toaster />

      <GroupChatLeftBar
        indexTab={indexTab}
        onTabChange={val => {
          setIndexTab(val)
        }}
      />
      {indexTab === 'live' ? (
        <TextImgLive />
      ) : (
        <>
          <ChatInfoDrawer
            isOpen={openDrawer}
            position="right"
            onClose={() => {
              setOpenDrawer(false)
            }}
            channelID={selectedChannel?.channelID || ''}
            title="聊天信息"
          />

          <GroupChannel
            onSelectChannel={(channel: Channel) => {
              handleChannelSelect(channel)
            }}
          />

          <div className="group-chat-right relative flex-1 overflow-hidden">
            <ChatRoom />

            {/* <div className="group-chat-header justify-between flex h-10">
              <div className="group-title items-center pt-2 h-full">
                <p className="m-0 text-sm">{groupDetailData?.name}</p>
              </div>
              <div className="h-full flex items-center mr-2">
                <JknIcon
                  name="ic_more"
                  className="rounded-none"
                  onClick={() => {
                    setOpenDrawer(true)
                  }}
                />
              </div>
            </div> */}
            {/* <div className="flex" style={{ height: 'calc(100% - 58px)' }}>
              <div className="group-msg-panel">
                <GroupChatMsgList ref={msgListRef} />
                <GroupChatInput
                  onMsgSend={() => {
                    if (msgListRef.current) {
                      msgListRef.current.resetJumpIdRef()
                    }
                  }}
                  ref={messageInputRef}
                />
              </div>
              <div className="w-[220px] group-member-panel">
                <GroupMembers total={total} />
              </div>
            </div> */}
          </div>
        </>
      )}

      <style jsx>
        {`
          .agree-notice-content {
            background: var(--chart-background);
            z-index: 9999;
          }
          .group-chat-container {
            height: 100vh;
            min-width: 1000px;
            background-color: var(--chart-background);
          }
          .group-chat-container div {
            box-sizing: border-box;
          }
          .group-chat-right {
            height: 100%;
            flex: 1;
          }
          .group-title {
            padding-left: 20px;
          }
          .group-title p {
            line-height: 22px;
          }
          .group-member-panel {
            border-left: 1px solid rgb(50, 50, 50);
          }
          .group-chat-header {
            border-bottom: 1px solid rgb(50, 50, 50);
          }
          .group-msg-panel {
            flex: 1;
            height: 100%;
          }
        `}
      </style>
    </div>
  )
}

export default GroupChatPage
