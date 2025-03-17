import GroupChannel from './group-channel'
import GroupChatLeftBar from './left-bar'

import { chatConstants, useChatStore, useToken, useUser } from '@/store'
import { createContext, useEffect, useRef, useState } from 'react'
import WKSDK, {
  type ConnectStatusListener,
  type Message,
  Channel,
  type Subscriber,
  ChannelTypePerson,
  type CMDContent,
  ConversationAction,
  ChannelTypeGroup
} from 'wukongimjssdk'
import GroupChatInput from './group-chat-input'
import GroupChatMsgList from './group-chat-msglist'

import { useGroupChatShortStore, useGroupChatStoreNew } from '@/store/group-chat-new'
import { useShallow } from 'zustand/react/shallow'

import GroupMembers from './group-members'

import { loginImService, revokeMessageService } from '@/api'

import { Button, JknIcon, Toaster } from '@/components'
import type { ConversationWrap } from './ConversationWrap'

import { useLatest, useMount } from 'ahooks'
import { ChevronRight } from 'lucide-react'
import APIClient from './Service/APIClient'
import { judgeHasReadGroupNotice, setAgreedGroupInCache } from './chat-utils'
import ChatInfoDrawer from './components/chat-info-drawer'
import TextImgLive from './text-img-live'
import { connectStatusListener } from "./lib/event"
import { initImDataSource } from "./lib/datasource"
import { ChatRoom } from "./chat-room"

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
  handleReply: () => { },
  handleRevoke: () => { },
  syncSubscriber: async () => { }
})

const wsUrlPrefix = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`

const subscriberCache: Map<string, Subscriber[]> = new Map()


let cmdListener!: (message: Message) => void

const COUNT_DOWN_NUM = 10

const GroupChatPage = () => {
  const { token } = useToken()
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

  const {
    setSubscribers,
    setFetchingSubscribers,
    setReplyMessage,
    setInputValue,
    setLocatedMessageId,
    setMessages,
    getGroupDetailData,
    groupDetailData,
    setMentions
  } = useGroupChatShortStore(
    useShallow(state => {
      return {
        conversationWraps: state.conversationWraps,
        subscribers: state.subscribers,
        setSubscribers: state.setSubscribers,
        setFetchingSubscribers: state.setFetchingSubscribers,
        setReplyMessage: state.setReplyMessage,
        setInputValue: state.setInputValue,
        setLocatedMessageId: state.setLocatedMessageId,
        setMessages: state.setMessages,
        getGroupDetailData: state.getGroupDetailData,
        groupDetailData: state.groupDetailData,

        setMentions: state.setMentions
      }
    })
  )

  // 输入框实例
  const messageInputRef = useRef()
  //

  // 监听cmd消息
  cmdListener = (msg: Message) => {
    console.log('收到CMD：', msg)
    const cmdContent = msg.content as CMDContent
    if (msgListRef.current) {
      const temp = [...msgListRef.current.getMessagesRef()]
      temp.push(msg)
      setMessages(temp)
    }
    if (cmdContent.cmd === 'messageRevoke') {
      // WKSDK.shared()
      //   .config.provider.syncConversationsCallback()
      //   .then((newConversations) => {
      //     const newWarps = newConversations.map(
      //       (item) => new ConversationWrap(item)
      //     );
      //     setConversationWraps(newWarps);
      //   });
    } else if (cmdContent.cmd === 'channelUpdate') {
      // 编辑群时也调用这个方法更新
      WKSDK.shared().channelManager.fetchChannelInfo(new Channel(msg.channel.channelID, ChannelTypeGroup))
      // 修改了群公告，群权限后触发
      getGroupDetailData(msg.channel.channelID)
      // 有人加群后也触发updatechannel
      syncSubscriber(msg.channel)
    } else if (cmdContent.cmd === 'forbidden') {
      // 修改了禁言后重新同步群成员
      syncSubscriber(msg.channel)
    }
    const channel = msg.channel
    const conversation = WKSDK.shared().conversationManager.findConversation(channel)

    if (conversation) {
      WKSDK.shared().conversationManager.notifyConversationListeners(conversation, ConversationAction.update)
    }
  }


  // 阅读公告倒计时
  const [countdown, setCountdown] = useState(COUNT_DOWN_NUM)

  useEffect(() => {
    if (!token || !user?.username) {
      return
    }

    const localConfig = useChatStore.getState().config
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
    WKSDK.shared().chatManager.addCMDListener(cmdListener)

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
      WKSDK.shared().chatManager.removeCMDListener(cmdListener)
      WKSDK.shared().disconnect()
    }

  }, [token, user?.username])

  const syncSubscriber = async (channel: Channel) => {
    setFetchingSubscribers(true)
    try {
      await WKSDK.shared().channelManager.syncSubscribes(channel) // 同步订阅者
      setFetchingSubscribers(false)
    } catch (err) {
      setFetchingSubscribers(false)
    }
    const members: Subscriber[] = WKSDK.shared().channelManager.getSubscribes(channel)
    subscriberCache.set(channel.channelID, members)
    setSubscribers(members)
  }

  // 群成员

  const handleChannelSelect = (channel: Channel) => {
    setLocatedMessageId('')

    if (subscriberCache.has(channel.channelID)) {
      const members = subscriberCache.get(channel.channelID) || []
      setSubscribers(members)
      if (msgListRef.current) {
        msgListRef.current.pullLast(channel, true)
      }
    } else {
      syncSubscriber(channel).finally(() => {
        // 查完群员之后缓存了人员头像昵称再拉消息，优化性能
        if (msgListRef.current) {
          msgListRef.current.pullLast(channel, true)
        }
      })
    }

    // 输入框和回复内容重置
    setReplyMessage(null)
    setMentions([])
    setInputValue('')
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

  // 引用
  // 回复
  const handleReply: ReplyFn = option => {
    // @ 人
    const doMention = (id: string) => {
      const channelInfo = WKSDK.shared().channelManager.getChannelInfo(new Channel(id, ChannelTypePerson))
      let name = ''
      if (channelInfo) {
        name = channelInfo.title
      }
      // 现在只@一个人
      const curMention = {
        name: channelInfo?.title || '',
        uid: id
      }
      setMentions([curMention])
    }

    if (option?.message) {
      if (option.message?.fromUID !== user?.username) {
      }

      // 回复的情况加一下@的人
      if (option.isQuote !== true) {
        doMention(option.message.fromUID)
      }
      setReplyMessage(option.message)
    } else if (option.quickReplyUserId) {
      doMention(option.quickReplyUserId)
    }
  }

  // 撤回
  const handleRevoke: (message: Message) => void = async (message: Message) => {
    await revokeMessageService({ msg_id: message.messageID })
    // const newConversations =
    //   await WKSDK.shared().config.provider.syncConversationsCallback();
    // const newWarps = newConversations.map((item) => new ConversationWrap(item));

    // setConversationWraps(newWarps);

    // let conversation = WKSDK.shared().conversationManager.findConversation(
    //   message.channel
    // );

    // if (conversation) {

    //   WKSDK.shared().conversationManager.notifyConversationListeners(
    //     conversation,
    //     ConversationAction.update
    //   );
    // }
  }

  const [total, setTotal] = useState<string | number>(0)

  useEffect(() => {
    window.document.title = '讨论社群'
  }, [])

  if (!token) {
    return (
      <div style={{ height: '100vh' }} className="w-full flex items-center justify-center">
        您已退出登录，请关闭窗口并重新登录
      </div>
    )
  }
  const [notAgreeNotice, setnotAgreeNotice] = useState<boolean>(false)
  useEffect(() => {
    if (groupDetailData) {
      const payload = !judgeHasReadGroupNotice(groupDetailData.account)
      setnotAgreeNotice(payload)
    }
  }, [groupDetailData])

  const countDownTimer = useRef<number>()
  useEffect(() => {
    if (notAgreeNotice === true) {
      countDownTimer.current = window.setInterval(() => {
        setCountdown(prev => {
          if (prev === 0) {
            clearInterval(countDownTimer.current)
          }
          return prev - 1
        })
      }, 1000)
    } else {
      clearInterval(countDownTimer.current)
      setCountdown(COUNT_DOWN_NUM)
    }
    return () => {
      clearInterval(countDownTimer.current)
    }
  }, [notAgreeNotice])

  const [openDrawer, setOpenDrawer] = useState(false)

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
        <GroupChatContext.Provider value={{ handleReply, handleRevoke, syncSubscriber }}>
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

          <div className="group-chat-right relative">
            <ChatRoom />
            {/* {notAgreeNotice === true && (
              <div className="flex flex-wrap content-center agree-notice-content absolute left-0 top-0 bottom-0 right-0 w-full h-full">
                <div className="flex mt-10 justify-center w-full">请先阅读群公告</div>
                <div
                  className="p-4 w-full mt-5 mr-10 ml-10 rounded-lg bg-slate-900 text-gray-400 h-[200px] overflow-y-auto "
                  style={{ 'wordWrap': 'break-word' }}
                >
                  {groupDetailData?.notice || ''}
                </div>

                <div className="flex mt-4 justify-center w-full">
                  <Button
                    disabled={countdown > 0}
                    onClick={() => {
                      if (groupDetailData) {
                        setAgreedGroupInCache(groupDetailData.account, true)
                        setnotAgreeNotice(false)
                      }
                    }}
                  >
                    我已阅读{countdown > 0 ? `(${countdown})` : ''}
                  </Button>
                </div>
              </div>
            )} */}
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
        </GroupChatContext.Provider>
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
