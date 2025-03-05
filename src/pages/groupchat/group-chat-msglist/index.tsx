import { useGroupChatStoreNew, useGroupChatShortStore } from '@/store/group-chat-new'
import { useEffect, useRef, useMemo, useState, type MutableRefObject } from 'react'
import WKSDK, {
  type Message,
  MessageText,
  MessageImage,
  PullMode,
  type Channel,
  ConversationAction,
  type SendackPacket,
  MessageStatus,
  type MessageListener,
  type MessageStatusListener
} from 'wukongimjssdk'
import { animateScroll, scroller, Events } from 'react-scroll'
import { useImperativeHandle, forwardRef, type ReactNode } from 'react'
import ImageCell from '../Messages/Image'
// import SystemCell from "../Messages/system";
import TextCell from '../Messages/text'

import ReplyMsg from '../components/reply-msg'
import { cn } from '@/utils/style'
import { judgeIsExitNoticeMessage, judgeIsExpireGroupCache, setExpireGroupInCache, sortMessages } from '../chat-utils'

import MsgFilter, { type FilterKey } from './msg-filterbar'
import { useUser } from '@/store'
import { useLatest, useThrottleFn } from 'ahooks'
import { useShallow } from 'zustand/react/shallow'
import SystemCell from '../Messages/system'
// import { useScrollToBottomOnArrowClick } from "../hooks";
import { MessagePerPageLimit } from '../Service/constant'
import FullScreenLoading from '@/components/loading'

let scrollStart: () => void
let scrollEnd: () => void
let messageListener!: MessageListener
let messageStatusListener!: MessageStatusListener

const GroupChatMsgList = forwardRef((props, ref) => {
  const { bottomHeight, selectedChannel, toChannel } = useGroupChatStoreNew()

  const latestToChannel = useLatest(toChannel)
  const { user } = useUser()
  const scrollDomRef = useRef<HTMLElement | null>(null)
  // const { incrementUnreadCount } = useScrollToBottomOnArrowClick(scrollDomRef);
  const jumpScrolling = useRef(false)

  const jumpMsgIdRef = useRef('') // 加载上一页消息后滚动条会自动滚到最前面，要用
  const [messageFetching, setMessageFetching] = useState(false)

  const locatedMessageIdRef = useRef('')
  const { setFilterMode, groupDetailData, setLocatedMessageId, locatedMessageId, messages, setMessages, filterMode } =
    useGroupChatShortStore(
      useShallow(state => {
        return {
          setFilterMode: state.setFilterMode,
          groupDetailData: state.groupDetailData,
          setLocatedMessageId: state.setLocatedMessageId,
          locatedMessageId: state.locatedMessageId,
          messages: state.messages,
          setMessages: state.setMessages,
          filterMode: state.filterMode
        }
      })
    )
  const messagesRef = useRef<Message[]>([])
  const getMessage = (m: Message) => {
    let text: string | ReactNode = ''

    if (m.content instanceof MessageText) {
      text = <TextCell message={m} />
    } else if (m.content instanceof MessageImage) {
      text = <ImageCell message={m} />
    } else if ([1001, 1005].includes(m.contentType)) {
      text = <SystemCell message={m} />
    } else if (judgeIsExitNoticeMessage(m)) {
      text = (
        <div
          style={{
            margin: '20px auto',
            color: 'rgb(90, 90, 90)',
            fontSize: '12px',
            textAlign: 'center'
          }}
        >
          {m.content.contentObj?.content}
        </div>
      )
    }

    return text
  }
  const [filterType, setFilterType] = useState<FilterKey>('live')
  const [filterKeyWord, setFilterKeyWord] = useState('')

  const goodMessages = useMemo(() => {
    let result: Message[] = []
    if (Array.isArray(messages) && messages.length > 0) {
      result = sortMessages(messages)
    }

    switch (filterType) {
      case 'owner':
        result = result.filter(msg => {
          return msg.fromUID === groupDetailData?.owner
        })
        break
      case 'mention':
        result = result.filter(msg => {
          let result = false
          if (
            msg.content?.mention &&
            Array.isArray(msg.content.mention.uids) &&
            msg.content.mention.uids.indexOf(user?.username) >= 0
          ) {
            result = true
          }
          return result
        })
        break
      default:
        break
    }
    if (filterKeyWord) {
      result = result.filter(item => {
        let res = false
        if (item.content instanceof MessageText && item.content.text && item.content.text.indexOf(filterKeyWord) >= 0) {
          res = true
        }
        return res
      })
    }
    // if (result.length !== messages.length) {
    //   setFilterMode(true)
    // } else {
    //   setFilterMode(false)
    // }

    return result
  }, [messages, filterType, filterKeyWord])

  const judgeNotOver = () => {
    if (scrollDomRef.current) {
      return scrollDomRef.current.scrollHeight <= scrollDomRef.current.offsetHeight
    }
    return true
  }
  const scrollTo = (position: number) => {
    if (scrollDomRef.current) {
      scrollDomRef.current.scrollTop = position
    }
  }

  // 消息列表滚动到底部
  const scrollBottom = () => {
    setUnreadCount(0)
    pulldowning.current = true
    animateScroll.scrollToBottom({
      containerId: 'group-chat-msglist',
      duration: 0
    })
  }
  useImperativeHandle(ref, () => ({
    pullLast,
    resetJumpIdRef: () => {
      jumpMsgIdRef.current = ''
    },
    getMessagesRef: () => {
      return messagesRef.current
    }
  }))

  const pulldowning = useRef(false)
  const pulldownFinished = useRef(false)

  // 查看前面的消息 不是往下拉，是消息序号down
  const pullDown = async () => {
    if (messagesRef.current.length === 0 || pulldownFinished.current === true) {
      return
    }
    const goodMsgs = sortMessages(messagesRef.current)
    const firstMsg = goodMsgs[0]
    const firstMsgId = firstMsg.clientMsgNo
    if (firstMsg.messageSeq === 1) {
      pulldownFinished.current = true
      return
    }
    if (latestToChannel.current) {
      const limit = MessagePerPageLimit
      setMessageFetching(true)
      try {
        const msgs = await WKSDK.shared().chatManager.syncMessages(latestToChannel.current, {
          limit: limit,
          startMessageSeq: firstMsg.messageSeq - 1,
          endMessageSeq: 0,
          pullMode: PullMode.Down
        })
        setMessageFetching(false)
        if (msgs.length === 0) {
          pulldownFinished.current = true
        }
        if (msgs && msgs.length > 0) {
          msgs.reverse().forEach(m => {
            messagesRef.current.unshift(m)
          })

          setMessages([...messagesRef.current])
        }

        jumpMsgIdRef.current = firstMsgId
      } catch (er) {
        setMessageFetching(false)
      }
    }
  }

  const handleMsgScrollToTop = (e: any) => {
    if (jumpScrolling.current === true) {
      jumpScrolling.current = false
      return
    }

    if (pulldowning.current || pulldownFinished.current) {
      return
    }

    pulldowning.current = true
    pullDown()
      .then(() => {
        pulldowning.current = false
      })
      .catch(() => {
        pulldowning.current = false
      })
  }
  const [showNewMsgTip, setShowNewMsgTip] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const unreadCountRef = useLatest(unreadCount)

  // 滚动事件，距离顶部小于minHeight 时通知外面加载前面的消息
  const handleScroll = useThrottleFn(
    (e: any) => {
      const targetScrollTop = e?.target?.scrollTop
      if (targetScrollTop <= 30) {
        // 下拉
        typeof handleMsgScrollToTop === 'function' && handleMsgScrollToTop(e)
      }

      const { scrollTop, scrollHeight, clientHeight } = e.target
      const distanceToBottom = scrollHeight - scrollTop - clientHeight
      if (unreadCountRef.current > 0 && distanceToBottom >= 200 && pulldowning.current !== true) {
        setShowNewMsgTip(true)
      } else {
        setShowNewMsgTip(false)
        setUnreadCount(0)
      }
    },
    { wait: 200 }
  )

  // 定位到引用消息位置
  const locateMessage = async (initMessageSeq: number) => {
    // 筛选模式下不跳转
    if (filterMode === true) {
      return
    }
    const existedMessage = messagesRef.current.find(item => item.messageSeq === initMessageSeq)
    if (existedMessage) {
      // 消息列表里有要跳转的消息了
      locatedMessageIdRef.current = existedMessage.clientMsgNo

      jumpToLocatedId.current = true
      gotoLocatedMessagePosition()
      setLocatedMessageId(existedMessage.clientMsgNo)

      return
    }
    const lastRemoteMessageSeq = messagesRef.current[messagesRef.current.length - 1].messageSeq // 消息列表最后一条
    const firstMessageSeq = messagesRef.current[0].messageSeq
    const opts: any = {
      pullMode: PullMode.Down,
      endMessageSeq: 0,
      startMessageSeq: firstMessageSeq,
      remoteJump: true
    }
    if (initMessageSeq && initMessageSeq > 0) {
      opts.startMessageSeq = firstMessageSeq - 1
      opts.endMessageSeq = initMessageSeq - 5 // 加多几条
      opts.limit = Math.abs(firstMessageSeq - initMessageSeq) + 5
      opts.pullMode = PullMode.Down

      if (selectedChannel) {
        pulldowning.current = true
        setMessageFetching(true)
        let remoteMessages: Message[] = []
        try {
          remoteMessages = await WKSDK.shared().chatManager.syncMessages(selectedChannel, opts)
          setMessageFetching(false)
        } catch (er) {
          setMessageFetching(false)
        }
        const newMessages = new Array<Message>()
        if (remoteMessages && remoteMessages.length > 0) {
          remoteMessages.forEach(msg => {
            if (!msg.isDeleted) {
              newMessages.push(msg)
            }
          })
        }

        if (remoteMessages && remoteMessages.length > 0) {
          if (lastRemoteMessageSeq <= 0 && remoteMessages.length >= MessagePerPageLimit) {
            pulldownFinished.current = false
          } else if (lastRemoteMessageSeq > remoteMessages[remoteMessages.length - 1].messageSeq) {
            pulldownFinished.current = false
          } else {
            pulldownFinished.current = true
          }
        } else {
          pulldownFinished.current = true
        }
        const allMessages = remoteMessages.concat(messagesRef.current)
        allMessages.sort((a, b) => {
          return a.messageSeq * 10000 - b.messageSeq * 10000
        })
        setMessages(allMessages)
        messagesRef.current = allMessages
        const targetMessage = allMessages.find(item => item.messageSeq === initMessageSeq)

        if (targetMessage) {
          // 等待dom更新后修改滚动位置
          jumpMsgIdRef.current = ''
          locatedMessageIdRef.current = targetMessage.clientMsgNo

          jumpScrolling.current = true
          jumpToLocatedId.current = true

          setLocatedMessageId(targetMessage.clientMsgNo)

          pulldowning.current = false
        }
      }
    }
  }
  let jumpToLocatedId = useRef(true)
  const gotoLocatedMessagePosition = () => {
    jumpToLocatedId.current = false
    const dom = document.getElementById(locatedMessageIdRef.current)
    if (dom) {
      // 要差个100px  不然又触发pullDown
      scrollTo(dom.offsetTop - 100)
    }
  }

  // 拉取当前会话最新消息
  const pullLast = async (channel: Channel, resetMode?: boolean) => {
    if (channel) {
      pulldowning.current = true
      pulldownFinished.current = false
      try {
        setMessageFetching(true)
        const msgs = await WKSDK.shared().chatManager.syncMessages(channel, {
          limit: MessagePerPageLimit,
          startMessageSeq: 0,
          endMessageSeq: 0,
          pullMode: PullMode.Up
        })
        if (resetMode === true) {
          messagesRef.current = []
        }
        setMessageFetching(false)
        pulldowning.current = false
        if (msgs && msgs.length > 0) {
          messagesRef.current = [...msgs]
        }
        setMessages([...messagesRef.current])
      } catch (err) {
        setMessageFetching(false)
      }
    }
  }

  const initToBottomRef = useRef(true)
  scrollStart = () => {
    pulldowning.current = true
  }

  scrollEnd = () => {
    pulldowning.current = false
  }
  // useEffect(() => {
  //   if (Array.isArray(messages) && messages.length > 0) {
  //     // 第一屏不够高时，再查一遍前面的信息
  //     const notOver = judgeNotOver()

  //     if (notOver) {
  //       pullDown()
  //     }

  //     // message 更新完成，并且dom也渲染结束，如果有要定位过去的消息，就自动scroll过去
  //     if (jumpMsgIdRef.current) {
  //       scroller.scrollTo(jumpMsgIdRef.current, {
  //         containerId: 'group-chat-msglist',
  //         duration: 0
  //       })
  //     } else if (locatedMessageIdRef.current && jumpToLocatedId.current === true) {
  //       // 点击了引用信息后，要跳转并高亮引用的原信息
  //       if (messages.findIndex(m => m.clientMsgNo === locatedMessageIdRef.current) >= 0) {
  //         gotoLocatedMessagePosition()
  //       }
  //     } else {
  //       if (initToBottomRef.current === true) {
  //         scrollBottom()
  //         initToBottomRef.current = false
  //       } else {
  //         // 自己发的信息要滚到最下面
  //         let lastMsg = messages[messages.length - 1]
  //         if (lastMsg.fromUID === WKSDK.shared().config.uid && lastMsg.content.cmd !== 'messageRevoke') {
  //           scrollBottom()
  //         } else {
  //           const distanceToBottom = calcOffset(scrollDomRef) || 0
  //           if (distanceToBottom < 200) {
  //             scrollBottom()
  //           }
  //         }
  //       }
  //     }
  //   }
  // }, [messages])

  const calcOffset = (ref: MutableRefObject<HTMLElement | null>) => {
    if (ref.current) {
      const { scrollTop, scrollHeight, clientHeight } = ref.current
      const distanceToBottom = scrollHeight - scrollTop - clientHeight
      return distanceToBottom
    }
  }

  useEffect(() => {
    if (scrollDomRef.current) {
      const distanceToBottom = calcOffset(scrollDomRef) || 0
      if (unreadCount > 0 && distanceToBottom >= 200 && pulldowning.current !== true) {
        setShowNewMsgTip(true)
      }
    }
  }, [unreadCount])

  useEffect(() => {
    if (selectedChannel) {
      initToBottomRef.current = true
      jumpMsgIdRef.current = ''
    }
  }, [selectedChannel])

  // 监听消息
  messageListener = msg => {
    // 群过期了，不继续渲染message
    if (judgeIsExpireGroupCache(msg.channel.channelID)) {
      return
    }

    if (judgeIsExitNoticeMessage(msg)) {
      setExpireGroupInCache(msg.channel.channelID, true)
    }
    const myId = WKSDK.shared().config.uid

    // 及时更新ismentionme

    if (msg.content?.mention && Array.isArray(msg.content.mention.uids) && msg.content.mention.uids.includes(myId)) {
      // 已打开的对话不提示@
      if (latestToChannel.current?.channelID !== msg.channel.channelID) {
        const conversation = WKSDK.shared().conversationManager.findConversation(msg.channel)
        if (conversation) {
          conversation.isMentionMe = true
          WKSDK.shared().conversationManager.notifyConversationListeners(conversation, ConversationAction.update)
        }
      }
    }
    // 只更新当前channel的message
    if (latestToChannel.current?.channelID !== msg.channel.channelID) {
      return
    }
    if (messagesRef.current.findIndex(m => m.clientMsgNo === msg.clientMsgNo) < 0) {
      messagesRef.current.push(msg)
    }
    const temp = [...messagesRef.current]
    setMessages(temp)

    setUnreadCount(unreadCountRef.current + 1)
    jumpMsgIdRef.current = ''
  }

  messageStatusListener = (ack: SendackPacket) => {
    // 有时一次会发多条消息，要缓存一下已经赋值过id和seq的消息
    let msgIdCache: Record<string, boolean> = {}
    let seqCache: Record<string, boolean> = {}

    for (let i = 0; i < messagesRef.current.length; i++) {
      const m = messagesRef.current[i]
      const newMsgId = ack.messageID.toString()
      if (!m.messageID && !msgIdCache[newMsgId]) {
        m.messageID = newMsgId
        msgIdCache[newMsgId] = true
      }
      if (!m.messageSeq && !seqCache[newMsgId]) {
        m.messageSeq = ack.messageSeq

        // 缓存到indexDB
        // cacheManager.cacheMessage(m).then(() => {
        //   syncManager.syncMessages(m.channel.channelID, [m]);
        // });

        seqCache[newMsgId] = true
      }

      if (m.clientSeq == ack.clientSeq) {
        m.status = ack.reasonCode == 1 ? MessageStatus.Normal : MessageStatus.Fail
      }
    }

    setMessages([...messagesRef.current])
  }

  useEffect(() => {
    Events.scrollEvent.register('start', scrollStart)
    Events.scrollEvent.register('end', scrollEnd)
    WKSDK.shared().chatManager.addMessageStatusListener(messageStatusListener)
    WKSDK.shared().chatManager.addMessageListener(messageListener)
    return () => {
      Events.scrollEvent.remove('start')
      Events.scrollEvent.remove('end')
      WKSDK.shared().chatManager.removeMessageListener(messageListener)
      WKSDK.shared().chatManager.removeMessageStatusListener(messageStatusListener)
    }
  }, [])

  return (
    <div className="group-chat-msglist" style={{ height: `calc(100% - ${bottomHeight}px)` }}>
      {messageFetching === true && <FullScreenLoading />}
      <MsgFilter
        onFilterChange={type => setFilterType(type)}
        onKeywordFilter={word => {
          setFilterKeyWord(word)
        }}
      />
      <div
        style={{ height: 'calc(100% - 40px)' }}
        ref={scrollDomRef}
        className="scroll-content"
        onScroll={handleScroll.run}
        id="group-chat-msglist"
      >
        {showNewMsgTip === true && (
          <div
            onClick={() => {
              setShowNewMsgTip(false)
              scrollBottom()
            }}
            className="new-msg-tip flex h-8 items-center rounded-full pl-4 pr-4 text-white"
            onKeyDown={event => {
              if (event.key === 'Enter' || event.key === ' ') {
                // Enter or Space key
                setShowNewMsgTip(false)
                scrollBottom()
              }
            }}
          >
            您有{unreadCount}条未读消息
          </div>
        )}
        {(goodMessages || []).map((msg: Message) => {
          const key = msg.clientMsgNo + msg.channel.channelID

          return (
            <div
              key={key}
              id={msg.clientMsgNo}
              onMouseLeave={() => {
                if (locatedMessageId === msg.clientMsgNo) {
                  setLocatedMessageId('')
                }
              }}
              className={cn('message-item', locatedMessageId === msg.clientMsgNo && 'located')}
            >
              {getMessage(msg)}
              {msg.content?.reply && msg.remoteExtra?.revoke !== true && (
                <ReplyMsg locateMessage={locateMessage} message={msg} />
              )}
            </div>
          )
        })}
      </div>

      <style jsx>
        {`
           {
            .new-msg-tip {
              position: absolute;
              bottom: 10px;
              right: 10px;
              z-index: 99;
              cursor: pointer;
              background-color: rgba(0, 0, 0, 0.7);
            }
            .message-item {
              transition: background linear 0.4s;
            }
            .message-item.located {
              background-color: rgb(69, 70, 73);
            }
            .group-chat-msglist {
              position: relative;
            }
            .scroll-content {
              padding: 0 12px;
              overflow-y: auto;
              ::-webkit-scrollbar {
                display: block;
                width: 6px;
              }

              ::-webkit-scrollbar-thumb {
                background-color: rgb(88, 88, 88);
              }
              scrollbar-thumb {
                background-color: rgb(88, 88, 88);
              }
            }
          }
        `}
      </style>
    </div>
  )
})

export default GroupChatMsgList
