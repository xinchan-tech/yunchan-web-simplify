import GroupChannel from "./group-channel";
import GroupChatLeftBar from "./left-bar";

import GroupChatMsgList from "./group-chat-msglist";
import GroupChatInput from "./group-chat-input";
import WKSDK, {
  ConnectStatusListener,
  MessageListener,
  MessageStatusListener,
  ConnectStatus,
  Message,
  SendackPacket,
  MessageStatus,
  Channel,
  ChannelTypeGroup,
  PullMode,
  Subscriber,
  ChannelTypePerson,
} from "wukongimjssdk";
import { useEffect, useRef, useState, createContext } from "react";
import { useUser, useToken } from "@/store";

import {
  useGroupChatShortStore,
  useGroupChatStoreNew,
} from "@/store/group-chat-new";
import { useLatest, useThrottleFn } from "ahooks";

import GroupMembers from "./group-members";
import { MessagePerPageLimit } from "./Service/constant";
export type ReplyFn = (message: Message, isQuote?: boolean) => void;
export const GroupChatContext = createContext<{
  handleReply: ReplyFn;
}>({
  handleReply: () => {},
});

const Threshold = 200;

let connectStatusListener!: ConnectStatusListener;
let messageListener!: MessageListener;
let messageStatusListener!: MessageStatusListener;

const GroupChatPage = () => {
  const { token } = useToken();
  const { user } = useUser();

  const { toChannel, selectedChannel } = useGroupChatStoreNew();
  const latestToChannel = useLatest(toChannel);
  const msgListRef = useRef<any>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const {
    conversationWraps,
    subscribers,
    setSubscribers,
    setReplyMessage,
    setInputValue,
    setLocatedMessageId,
    
  } = useGroupChatShortStore();
  // 输入框实例
  const messageInputRef = useRef();

  // 消息列表滚动到底部
  const scrollBottom = () => {
    let timer = setTimeout(() => {
      if (
        msgListRef.current &&
        typeof msgListRef.current.scrollToBottom === "function"
      ) {
        msgListRef.current.scrollToBottom();
      }
      clearTimeout(timer);
      timer = null;
    }, 100);
  };

  // 监听消息
  messageListener = (msg) => {
    if (latestToChannel.current?.channelID !== msg.channel.channelID) {
      return;
    }
    const temp = [...messagesRef.current];

    // if (fromUIDList.indexOf(msg.fromUID) < 0) {
    //   fromUIDList.push(msg.fromUID);
    //   setPersonChannelCache(msg.fromUID);

    //   setMessages(temp);
    // }

    temp.push(msg);
    setMessages(temp);
    messagesRef.current = temp;

    //   scrollBottom();
  };

  // 拉取当前会话最新消息
  const pullLast = async (channel: Channel) => {
    if (channel) {
      pulldowning.current = true;
      pulldownFinished.current = false;
      const msgs = await WKSDK.shared().chatManager.syncMessages(channel, {
        limit: MessagePerPageLimit,
        startMessageSeq: 0,
        endMessageSeq: 0,
        pullMode: PullMode.Up,
      });
      pulldowning.current = false;
      if (msgs && msgs.length > 0) {
        msgs.forEach((m) => {
          messagesRef.current.push(m);
        });
      }
      setMessages(messagesRef.current);
      scrollBottom();
    }
  };

  const jumpScrolling = useRef(false)
  // 查看前面的消息 不是往下拉，是消息序号down
  const pullDown = async () => {
    if (messagesRef.current.length == 0 ||  pulldownFinished.current === true) {
      return;
    }
    const firstMsg = messagesRef.current[0];
    const firstMsgId = firstMsg.clientMsgNo;
    if (firstMsg.messageSeq == 1) {
      pulldownFinished.current = true;
      return;
    }
    if (latestToChannel.current) {
      const limit = MessagePerPageLimit;
      const msgs = await WKSDK.shared().chatManager.syncMessages(
        latestToChannel.current,
        {
          limit: limit,
          startMessageSeq: firstMsg.messageSeq - 1,
          endMessageSeq: 0,
          pullMode: PullMode.Down,
        }
      );
      if (msgs.length < limit) {
        pulldownFinished.current = true;
      }
      if (msgs && msgs.length > 0) {
        msgs.reverse().forEach((m) => {
          messagesRef.current.unshift(m);
        });

        setMessages([...messagesRef.current]);
      }

      // 等待dom更新后修改滚动位置 , 有定位的
      // if(jumpScrolling.current === true) {
      //   jumpScrolling.current = false;
      //   return;
      // }
      let timer = setTimeout(() => {
        if (
          msgListRef.current &&
          typeof msgListRef.current.scrollToBottom === "function"
        ) {
          const firstMsgEl = document.getElementById(firstMsgId);
          if (firstMsgEl) {
            msgListRef.current.scrollTo(firstMsgEl.offsetTop);
          }
        }
        clearTimeout(timer);
        timer = null;
      }, 100);
    }
  };

  // 最近会话显示的最后一条消息的messageSeq
  const conversationLastMessageSeq = () => {
    if (selectedChannel) {
      const conversation =
        WKSDK.shared().conversationManager.findConversation(selectedChannel);
      if (conversation && conversation.lastMessage) {
        return conversation.lastMessage?.messageSeq;
      }
    }
    return 0;
  };

  

  // 定位到之前消息位置
  const handleFindPrevMsg = async (initMessageSeq: number) => {
    const existedMessage = messagesRef.current.find(
      (item) => item.messageSeq === initMessageSeq
    );
    if (existedMessage) {
      if (
        msgListRef.current &&
        typeof msgListRef.current.scrollToBottom === "function"
      ) {
        setLocatedMessageId(existedMessage.clientMsgNo);
        const dom = document.getElementById(existedMessage.clientMsgNo);
        if (dom) {
            // 要差个300px  不然又触发pullDown
          msgListRef.current.scrollTo(dom.offsetTop - 300);
        }
      }

      return;
    }
    const lastRemoteMessageSeq = messagesRef.current[messagesRef.current.length - 1].messageSeq; // 服务器最新的一条消息的序号
    const firstMessageSeq = messagesRef.current[0].messageSeq
    const opts: any = {
      pullMode: PullMode.Down,
      endMessageSeq: 0,
      startMessageSeq: firstMessageSeq - 1
    };
    if (initMessageSeq && initMessageSeq > 0) {
      if (initMessageSeq > lastRemoteMessageSeq) {
        opts.startMessageSeq = lastRemoteMessageSeq + 6;
        opts.endMessageSeq = 0;
        opts.limit = initMessageSeq - lastRemoteMessageSeq + 5;
        opts.pullMode = PullMode.Up;
      } else if (
        initMessageSeq < firstMessageSeq
  
      ) {
        opts.startMessageSeq = firstMessageSeq - 6;
        opts.endMessageSeq = 0;
        opts.limit = firstMessageSeq - initMessageSeq + 5;
        opts.pullMode = PullMode.Down;
      }
      if (selectedChannel) {
        pulldowning.current = true;
        const remoteMessages = await WKSDK.shared().chatManager.syncMessages(
          selectedChannel,
          opts
        );
     
        const newMessages = new Array<Message>();
        if (remoteMessages && remoteMessages.length > 0) {
          remoteMessages.forEach((msg) => {
            if (!msg.isDeleted) {
              newMessages.push(msg);
            }
          });
        }

        if (remoteMessages && remoteMessages.length > 0) {
          if (
            lastRemoteMessageSeq <= 0 &&
            remoteMessages.length >= MessagePerPageLimit
          ) {
            pulldownFinished.current = false;
          } else if (
            lastRemoteMessageSeq >
            remoteMessages[remoteMessages.length - 1].messageSeq
          ) {
            pulldownFinished.current = false;
          } else {
            pulldownFinished.current = true;
          }
        } else {
          pulldownFinished.current = true;
        }
        const allMessages = remoteMessages.concat(messagesRef.current);
          allMessages.sort((a, b) => {
            return a.messageSeq * 10000 - b.messageSeq * 10000
        })
        setMessages(allMessages);
        messagesRef.current = allMessages;
        const targetMessage = allMessages.find(
          (item) => item.messageSeq === initMessageSeq
        );

        if (targetMessage) {
          // 等待dom更新后修改滚动位置

          let timer = setTimeout(() => {
            if (
              msgListRef.current &&
              typeof msgListRef.current.scrollToBottom === "function"
            ) {
              const dom = document.getElementById(targetMessage.clientMsgNo);
              jumpScrolling.current = true;
              setLocatedMessageId(targetMessage.clientMsgNo);
              if (dom) {
                // 要差个300px  不然又触发pullDown
                msgListRef.current.scrollTo(dom.offsetTop - 300);
              }
            }
            clearTimeout(timer);
            timer = null;
            pulldowning.current = false;
          }, 100);
        }
      }
    }
  };

  const pulldowning = useRef(false);
  const pulldownFinished = useRef(false);
  const handleMsgScroll = useThrottleFn(
    (e: any) => {
      if(jumpScrolling.current === true) {
        jumpScrolling.current = false;
        return;
      }
      const targetScrollTop = e?.target?.scrollTop;
      if (targetScrollTop <= Threshold) {
        // 下拉
        if (pulldowning.current || pulldownFinished.current) {
          console.log(
            "不允许下拉",
            "pulldowning",
            pulldowning.current,
            "pulldownFinished",
            pulldownFinished.current
          );
          return;
        }
        console.log("下拉");
        pulldowning.current = true;
        pullDown()
          .then(() => {
            pulldowning.current = false;
          })
          .catch(() => {
            pulldowning.current = false;
          });
      }
    },
    {
      wait: 200,
    }
  );

  messageStatusListener = (ack: SendackPacket) => {
    messagesRef.current.forEach((m) => {
      if (m.clientSeq == ack.clientSeq) {
        m.status =
          ack.reasonCode == 1 ? MessageStatus.Normal : MessageStatus.Fail;
        return;
      }
    });
    setMessages(messagesRef.current);
  };

  // 连接IM
  const connectIM = (addr: string) => {
    const config = WKSDK.shared().config;

    if (!user?.username || !token) {
      return;
    }
    // config.uid = user.username;
    config.uid = "m39ovNFC";
    // config.uid = '753';
    config.token = "m39ovNFC";
    config.addr = addr;
    WKSDK.shared().config = config;

    // 监听连接状态
    connectStatusListener = (status) => {
      console.log(status, "status");
    };

    WKSDK.shared().connectManager.addConnectStatusListener(
      connectStatusListener
    );

    WKSDK.shared().chatManager.addMessageListener(messageListener);

    WKSDK.shared().chatManager.addMessageStatusListener(messageStatusListener);

    WKSDK.shared().connect();
  };

  useEffect(() => {
    connectIM("ws://im.mgjkn.com:5200");
    // connectIM('ws://175.27.245.108:15200')
    return () => {
      WKSDK.shared().connectManager.removeConnectStatusListener(
        connectStatusListener
      );
      WKSDK.shared().chatManager.removeMessageListener(messageListener);
      WKSDK.shared().chatManager.removeMessageStatusListener(
        messageStatusListener
      );
      WKSDK.shared().disconnect();
    };
  }, []);

  // 群成员

  const handleChannelSelect = async (channel: Channel) => {
    messagesRef.current = [];

    await WKSDK.shared().channelManager.syncSubscribes(channel); // 同步订阅者
    const members: Subscriber[] =
      WKSDK.shared().channelManager.getSubscribes(channel);
    setSubscribers(members);
    console.log(members, "subscribers");
    // 输入框和回复内容重置
    setReplyMessage(null);
    setInputValue("");
    pullLast(channel);
  };

  // 初始化群聊列表和消息
  const initChannelFlag = useRef(true);
  useEffect(() => {
    if (conversationWraps.length > 0 && initChannelFlag.current === true) {
      // selectedChannel是缓存了起来的
      const firstChannel = conversationWraps.find(
        (item) => item.channel.channelID === selectedChannel?.channelID
      )?.channel;
      if (firstChannel) {
        handleChannelSelect(firstChannel);
      }
      initChannelFlag.current = false;
    }
  }, [conversationWraps]);
  let currentChannelInfo;
  if (selectedChannel instanceof Channel) {
    currentChannelInfo =
      WKSDK.shared().channelManager.getChannelInfo(selectedChannel);
  }

  // 引用
  // 回复
  const handleReply: ReplyFn = (message: Message, isQuote) => {
    if (message.fromUID !== user?.username) {
      const channelInfo = WKSDK.shared().channelManager.getChannelInfo(
        new Channel(message.fromUID, ChannelTypePerson)
      );
      // 回复的情况加一下@的人
      if (isQuote !== true) {
        let name = "";
        if (channelInfo) {
          name = channelInfo.title;
        }

        try {
          if (messageInputRef.current) {
            messageInputRef.current.addMention(message.fromUID, name);
          }
        } catch (err) {
          console.error(err);
        }
      }
      setReplyMessage(message);
    }
  };
  return (
    <div className="group-chat-container flex">
      <GroupChatContext.Provider value={{ handleReply }}>
        <GroupChatLeftBar />
        <GroupChannel
          onSelectChannel={(channel: Channel) => {
            handleChannelSelect(channel);
          }}
        />
        <div className="group-chat-right">
          <div className="group-chat-header justify-between h-[58px]">
            <div className="group-title flex items-center h-full">
              {currentChannelInfo?.title}
            </div>
          </div>
          <div className="flex" style={{ height: "calc(100% - 58px)" }}>
            <div className="group-msg-panel">
              <GroupChatMsgList
                messages={messages}
                ref={msgListRef}
                handleFindPrevMsg={handleFindPrevMsg}
                handleScroll={handleMsgScroll.run}
              />
              <GroupChatInput
                onMsgSend={scrollBottom}
                subscribers={subscribers}
                ref={messageInputRef}
              />
            </div>
            <div className="w-[220px] group-member-panel">
              <GroupMembers subscribers={subscribers} />
            </div>
          </div>
        </div>
      </GroupChatContext.Provider>

      <style jsx>
        {`
          .group-chat-container {
            height: 100%;
          }
          .group-chat-right {
            background-color: rgb(43, 45, 49);
            height: 100%;
            flex: 1;
          }
          .group-title {
            padding-left: 20px;
            font-weight: bold;
            font-size: 20px;
          }
          .group-member-panel {
            border-left: 1px solid rgb(50, 50, 50);
          }
          .group-chat-header {
            border-bottom: 1px solid hsl(var(--border));
          }
          .group-msg-panel {
            flex: 1;
            height: 100%;
          }
        `}
      </style>
    </div>
  );
};

export default GroupChatPage;
