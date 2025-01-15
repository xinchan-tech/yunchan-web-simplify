import GroupChannel from "./group-channel";
import GroupChatLeftBar from "./left-bar";

import GroupChatMsgList from "./group-chat-msglist";
import GroupChatInput from "./group-chat-input";
import WKSDK, {
  ConnectStatusListener,
  MessageListener,
  MessageStatusListener,
  Message,
  SendackPacket,
  MessageStatus,
  Channel,
  PullMode,
  Subscriber,
  ChannelTypePerson,
  CMDContent,
  ConversationAction,
  ChannelTypeGroup,
} from "wukongimjssdk";
import { useEffect, useRef, useState, createContext } from "react";
import { useUser, useToken } from "@/store";
import { animateScroll, scroller, Events } from "react-scroll";
import {
  useGroupChatShortStore,
  useGroupChatStoreNew,
} from "@/store/group-chat-new";
import { useLatest, useThrottleFn } from "ahooks";

import GroupMembers from "./group-members";
import { MessagePerPageLimit } from "./Service/constant";
import { revokeMessageService } from "@/api";
import { sortMessages } from "./chat-utils";
import { Toaster } from "@/components";
import JoinGroup from "./components/join-group";
export type ReplyFn = (option: {
  message?: Message;
  isQuote?: boolean;
  quickReplyUserId?: string;
}) => void;
export const GroupChatContext = createContext<{
  handleReply: ReplyFn;
  handleRevoke: (message: Message) => void;
  syncSubscriber: (channel: Channel) => Promise<void>;
}>({
  handleReply: () => {},
  handleRevoke: () => {},
  syncSubscriber: async () => {},
});

const Threshold = 200;

const subscriberCache: Map<string, Subscriber[]> = new Map();

let connectStatusListener!: ConnectStatusListener;
let messageListener!: MessageListener;
let messageStatusListener!: MessageStatusListener;
let cmdListener!: (message: Message) => void;
let scrollStart: () => void;
let scrollEnd: () => void;

const GroupChatPage = () => {
  const { token } = useToken();
  const { user } = useUser();

  const { toChannel, selectedChannel } = useGroupChatStoreNew();
  const latestToChannel = useLatest(toChannel);
  const msgListRef = useRef<any>(null);

  const messagesRef = useRef<Message[]>([]);

  const conversationWraps = useGroupChatShortStore(
    (state) => state.conversationWraps
  );
  const subscribers = useGroupChatShortStore((state) => state.subscribers);
  const setSubscribers = useGroupChatShortStore(
    (state) => state.setSubscribers
  );
  const setReplyMessage = useGroupChatShortStore(
    (state) => state.setReplyMessage
  );
  const setInputValue = useGroupChatShortStore((state) => state.setInputValue);
  const setLocatedMessageId = useGroupChatShortStore(
    (state) => state.setLocatedMessageId
  );
  const locatedMessageId = useGroupChatShortStore(
    (state) => state.locatedMessageId
  );
  const readyToJoinGroup = useGroupChatShortStore(
    (state) => state.readyToJoinGroup
  );

  const messages = useGroupChatShortStore((state) => state.messages);
  const setMessages = useGroupChatShortStore((state) => state.setMessages);
  const getGroupDetailData = useGroupChatShortStore(
    (state) => state.getGroupDetailData
  );
  const groupDetailData = useGroupChatShortStore(
    (state) => state.groupDetailData
  );
  // 输入框实例
  const messageInputRef = useRef();

  // 消息列表滚动到底部
  const scrollBottom = () => {
    pulldowning.current = true;
    animateScroll.scrollToBottom({
      containerId: "group-chat-msglist",
      duration: 0,
    });
  };

  // 监听消息
  messageListener = (msg) => {
    if (latestToChannel.current?.channelID !== msg.channel.channelID) {
      return;
    }
    console.log('messagesRef.current')
    const temp = [...messagesRef.current];

    temp.push(msg);
    messagesRef.current.push(msg);
    setMessages(temp);

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
      setMessages([...messagesRef.current]);
    }
  };

  const jumpScrolling = useRef(false);
  const [jumpMsgId, setJumpMsgId] = useState("");

  scrollStart = () => {
    pulldowning.current = true;
  };

  scrollEnd = () => {
    pulldowning.current = false;
  };

  // 查看前面的消息 不是往下拉，是消息序号down
  const pullDown = async (isAutoExpand?: boolean) => {
    if (messagesRef.current.length == 0 || pulldownFinished.current === true) {
      return;
    }
    const goodMsgs = sortMessages(messagesRef.current);
    const firstMsg = goodMsgs[0];
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

      setJumpMsgId(firstMsgId);
    }
  };

  // 定位到之前消息位置
  const handleFindPrevMsg = async (initMessageSeq: number) => {
    const existedMessage = messagesRef.current.find(
      (item) => item.messageSeq === initMessageSeq
    );
    if (existedMessage) {
      if (
        msgListRef.current &&
        typeof msgListRef.current.scrollTo === "function"
      ) {
        jumpToLocatedId.current = true;
        if (locatedMessageId === existedMessage.clientMsgNo) {
          gotoLocatedMessagePosition();
        } else {
          setLocatedMessageId(existedMessage.clientMsgNo);
        }
      }

      return;
    }
    const lastRemoteMessageSeq =
      messagesRef.current[messagesRef.current.length - 1].messageSeq; // 服务器最新的一条消息的序号
    const firstMessageSeq = messagesRef.current[0].messageSeq;
    const opts: any = {
      pullMode: PullMode.Down,
      endMessageSeq: 0,
      startMessageSeq: firstMessageSeq - 1,
    };
    if (initMessageSeq && initMessageSeq > 0) {
      if (initMessageSeq > lastRemoteMessageSeq) {
        opts.startMessageSeq = lastRemoteMessageSeq + 6;
        opts.endMessageSeq = 0;
        opts.limit = initMessageSeq - lastRemoteMessageSeq + 5;
        opts.pullMode = PullMode.Up;
      } else if (initMessageSeq < firstMessageSeq) {
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
          return a.messageSeq * 10000 - b.messageSeq * 10000;
        });
        setMessages(allMessages);
        messagesRef.current = allMessages;
        const targetMessage = allMessages.find(
          (item) => item.messageSeq === initMessageSeq
        );

        if (targetMessage) {
          // 等待dom更新后修改滚动位置

          if (
            msgListRef.current &&
            typeof msgListRef.current.scrollTo === "function"
          ) {
            jumpScrolling.current = true;
            jumpToLocatedId.current = true;
            if (locatedMessageId === targetMessage.clientMsgNo) {
              gotoLocatedMessagePosition();
            } else {
              setLocatedMessageId(targetMessage.clientMsgNo);
            }
          }

          pulldowning.current = false;
        }
      }
    }
  };

  const pulldowning = useRef(false);
  const pulldownFinished = useRef(false);
  const handleMsgScroll = useThrottleFn(
    (e: any) => {
      if (jumpScrolling.current === true) {
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
      if (!m.messageID) {
        m.messageID = ack.messageID.toString();
      }
      if(!m.messageSeq) {

        m.messageSeq = ack.messageSeq;
      }
      // m.reasonCode = ack.reasonCode
      if (m.clientSeq == ack.clientSeq) {
        m.status =
          ack.reasonCode == 1 ? MessageStatus.Normal : MessageStatus.Fail;
        return;
      }
    });
    setMessages([...messagesRef.current]);
  };

  // 监听cmd消息
  cmdListener = (msg: Message) => {
    console.log("收到CMD：", msg);
    const cmdContent = msg.content as CMDContent;
    if (cmdContent.cmd === "messageRevoke") {
      const channel = msg.channel;
      const temp = [...messagesRef.current];
      temp.push(msg);
      setMessages(temp);
      let conversation =
        WKSDK.shared().conversationManager.findConversation(channel);

      if (conversation) {
        WKSDK.shared().conversationManager.notifyConversationListeners(
          conversation,
          ConversationAction.update
        );
      }
    } else if (cmdContent.cmd === "channelUpdate") {
      // 编辑群时也调用这个方法更新
      WKSDK.shared().channelManager.fetchChannelInfo(
        new Channel(msg.channel.channelID, ChannelTypeGroup)
      );
    } else if (cmdContent.cmd === "forbidden") {
      // 修改了禁言后重新同步群成员
      syncSubscriber(msg.channel);
    }
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
    Events.scrollEvent.register("start", scrollStart);

    Events.scrollEvent.register("end", scrollEnd);

    WKSDK.shared().chatManager.addMessageListener(messageListener);

    WKSDK.shared().chatManager.addMessageStatusListener(messageStatusListener);

    WKSDK.shared().chatManager.addCMDListener(cmdListener);

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
      WKSDK.shared().chatManager.removeCMDListener(cmdListener);
      WKSDK.shared().disconnect();
      Events.scrollEvent.remove("start");
      Events.scrollEvent.remove("end");
    };
  }, []);

  const syncSubscriber = async (channel: Channel) => {
    await WKSDK.shared().channelManager.syncSubscribes(channel); // 同步订阅者
    const members: Subscriber[] =
      WKSDK.shared().channelManager.getSubscribes(channel);
    subscriberCache.set(channel.channelID, members);
    setSubscribers(members);
  };

  // 群成员

  const handleChannelSelect = (channel: Channel) => {
    messagesRef.current = [];
    setJumpMsgId("");
    setLocatedMessageId("");
    if (subscriberCache.has(channel.channelID)) {
      const members = subscriberCache.get(channel.channelID) || [];
      setSubscribers(members);
    } else {
      syncSubscriber(channel);
    }

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
        getGroupDetailData(firstChannel.channelID);
        handleChannelSelect(firstChannel);
      }
      initChannelFlag.current = false;
    }
  }, [conversationWraps]);


  // 引用
  // 回复
  const handleReply: ReplyFn = (option) => {
    // @ 人
    const doMention = (id: string) => {
      const channelInfo = WKSDK.shared().channelManager.getChannelInfo(
        new Channel(id, ChannelTypePerson)
      );
      let name = "";
      if (channelInfo) {
        name = channelInfo.title;
      }
      try {
        if (messageInputRef.current) {
          messageInputRef.current.addMention(option.quickReplyUserId, name);
        }
      } catch (err) {
        console.error(err);
      }
    };

    if (option && option.message) {
      if (option.message?.fromUID !== user?.username) {
      }

      // 回复的情况加一下@的人
      if (option.isQuote !== true) {
        doMention(option.message.fromUID);
      }
      setReplyMessage(option.message);
    } else if (option.quickReplyUserId) {
      doMention(option.quickReplyUserId);
    }
  };

  // 撤回
  const handleRevoke: (message: Message) => void = async (message: Message) => {
    await revokeMessageService({ msg_id: message.messageID });
  };

  const initOverFlag = useRef(true);

  useEffect(() => {
    if (jumpMsgId) {
      scroller.scrollTo(jumpMsgId, {
        containerId: "group-chat-msglist",
        duration: 0,
      });
    } else if (messages instanceof Array && messages.length > 0) {
      // 第一屏不够高时，再查一遍前面的信息
   
        initOverFlag.current = false;
        if (
          msgListRef.current &&
          typeof msgListRef.current.judgeNotOver === "function"
        ) {
          const notOver = msgListRef.current.judgeNotOver();
          if (notOver) {
            console.log("auto,auto");
            pullDown();
          }
        }
      
      scrollBottom();
    }
  }, [messages, jumpMsgId]);


  let jumpToLocatedId = useRef(true);
  const gotoLocatedMessagePosition = () => {
    jumpToLocatedId.current = false;
    const dom = document.getElementById(locatedMessageId);
    if (dom) {
      // 要差个300px  不然又触发pullDown
      msgListRef.current.scrollTo(dom.offsetTop - 300);
    }
  };
  useEffect(() => {
    if (
      messages instanceof Array &&
      messages.length > 0 &&
      locatedMessageId &&
      jumpToLocatedId.current === true
    ) {
      if (messages.findIndex((m) => m.clientMsgNo === locatedMessageId) >= 0) {
        gotoLocatedMessagePosition();
      }
    }
  }, [locatedMessageId, messages]);

  useEffect(() => {
    window.document.title = '讨论社群'
  }, [])

  return (
    <div className="group-chat-container flex">
      <Toaster></Toaster>
      <GroupChatContext.Provider
        value={{ handleReply, handleRevoke, syncSubscriber }}
      >
        <GroupChatLeftBar />
        <GroupChannel
          onSelectChannel={(channel: Channel) => {
            handleChannelSelect(channel);
          }}
        />

        <div className="group-chat-right">
          {readyToJoinGroup ? (
            <JoinGroup data={readyToJoinGroup} />
          ) : (
            <>
              <div className="group-chat-header justify-between h-[58px]">
                <div className="group-title flex items-center h-full">
                  {groupDetailData?.name}
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
                    onMsgSend={() => {
                      setJumpMsgId("");
                    }}
                    subscribers={subscribers}
                    ref={messageInputRef}
                  />
                </div>
                <div className="w-[220px] group-member-panel">
                  <GroupMembers subscribers={subscribers} />
                </div>
              </div>
            </>
          )}
        </div>
      </GroupChatContext.Provider>

      <style jsx>
        {`
          .group-chat-container {
            height: 100vh;
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
