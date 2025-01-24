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
import { useShallow } from "zustand/react/shallow";
import { useLatest } from "ahooks";

import GroupMembers from "./group-members";
import { MessagePerPageLimit } from "./Service/constant";
import { revokeMessageService } from "@/api";
import { sortMessages } from "./chat-utils";
import { Toaster } from "@/components";
import JoinGroup from "./components/join-group";
import { ConversationWrap } from "./ConversationWrap";
import FullScreenLoading from "@/components/loading";
import APIClient from "./Service/APIClient";
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

const wsUrlPrefix = `${
  window.location.protocol === "https:" ? "wss" : "ws"
}://${window.location.host}`;

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
  const [messageFetching, setMessageFetching] = useState(false);

  const messagesRef = useRef<Message[]>([]);

  const locatedMessageIdRef = useRef("");

  const {
    setSubscribers,
    setFetchingSubscribers,
    setReplyMessage,
    setInputValue,
    setLocatedMessageId,
    readyToJoinGroup,
    messages,
    setMessages,
    getGroupDetailData,
    groupDetailData,
    filterMode,
    // mentions,
    setMentions,
  } = useGroupChatShortStore(
    useShallow((state) => {
      return {
        conversationWraps: state.conversationWraps,
        subscribers: state.subscribers,
        setSubscribers: state.setSubscribers,
        setFetchingSubscribers: state.setFetchingSubscribers,
        setReplyMessage: state.setReplyMessage,
        setInputValue: state.setInputValue,
        setLocatedMessageId: state.setLocatedMessageId,
        readyToJoinGroup: state.readyToJoinGroup,
        setConversationWraps: state.setConversationWraps,
        messages: state.messages,
        setMessages: state.setMessages,
        getGroupDetailData: state.getGroupDetailData,
        groupDetailData: state.groupDetailData,
        filterMode: state.filterMode,
        // mentions: state.mentions,
        setMentions: state.setMentions,
      };
    })
  );

  // 输入框实例
  const messageInputRef = useRef();
  //
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
    // 及时更新ismentionme
    if (
      msg.content &&
      msg.content.mention &&
      msg.content.mention.uids instanceof Array &&
      msg.content.mention.uids.includes(WKSDK.shared().config.uid)
    ) {
      // 已打开的对话不提示@
      if (latestToChannel.current?.channelID === msg.channel.channelID) {
        return;
      }
      const conversation = WKSDK.shared().conversationManager.findConversation(
        msg.channel
      );
      if (conversation) {
        conversation.isMentionMe = true;
        WKSDK.shared().conversationManager.notifyConversationListeners(
          conversation,
          ConversationAction.update
        );
      }
    }
    // 只更新当前channel的message
    if (latestToChannel.current?.channelID !== msg.channel.channelID) {
      return;
    }
    const temp = [...messagesRef.current];
    temp.push(msg);
    messagesRef.current.push(msg);
    setMessages(temp);
    jumpMsgIdRef.current = "";
  };

  // 拉取当前会话最新消息
  const pullLast = async (channel: Channel) => {
    if (channel) {
      pulldowning.current = true;
      pulldownFinished.current = false;
      try {
        setMessageFetching(true);
        const msgs = await WKSDK.shared().chatManager.syncMessages(channel, {
          limit: MessagePerPageLimit,
          startMessageSeq: 0,
          endMessageSeq: 0,
          pullMode: PullMode.Up,
        });
        setMessageFetching(false);
        pulldowning.current = false;
        if (msgs && msgs.length > 0) {
          msgs.forEach((m) => {
            messagesRef.current.push(m);
          });
        }
        setMessages([...messagesRef.current]);
      } catch (err) {
        setMessageFetching(false);
      }
    }
  };

  const jumpScrolling = useRef(false);

  scrollStart = () => {
    pulldowning.current = true;
  };

  scrollEnd = () => {
    pulldowning.current = false;
  };

  const jumpMsgIdRef = useRef(""); // 加载上一页消息后滚动条会自动滚到最前面，要用jumpMsgIdRef记住上一次停留的信息位置，在message更新后滚动回上一次停留的消息
  // 查看前面的消息 不是往下拉，是消息序号down
  const pullDown = async () => {
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
      setMessageFetching(true);
      try {
        const msgs = await WKSDK.shared().chatManager.syncMessages(
          latestToChannel.current,
          {
            limit: limit,
            startMessageSeq: firstMsg.messageSeq - 1,
            endMessageSeq: 0,
            pullMode: PullMode.Down,
          }
        );
        setMessageFetching(false);
        if (msgs.length < limit) {
          pulldownFinished.current = true;
        }
        if (msgs && msgs.length > 0) {
          msgs.reverse().forEach((m) => {
            messagesRef.current.unshift(m);
          });

          setMessages([...messagesRef.current]);
        }

        jumpMsgIdRef.current = firstMsgId;
      } catch (er) {
        setMessageFetching(false);
      }
    }
  };

  // 定位到之前消息位置
  const handleFindPrevMsg = async (initMessageSeq: number) => {
    // 筛选模式下不跳转
    if (filterMode === true) {
      return;
    }
    const existedMessage = messagesRef.current.find(
      (item) => item.messageSeq === initMessageSeq
    );
    if (existedMessage) {
      // 消息列表里有要跳转的消息了
      locatedMessageIdRef.current = existedMessage.clientMsgNo;
      if (
        msgListRef.current &&
        typeof msgListRef.current.scrollTo === "function"
      ) {
        jumpToLocatedId.current = true;
        gotoLocatedMessagePosition();
        setLocatedMessageId(existedMessage.clientMsgNo);
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
        setMessageFetching(true);
        let remoteMessages: Message[] = [];
        try {
          remoteMessages = await WKSDK.shared().chatManager.syncMessages(
            selectedChannel,
            opts
          );
          setMessageFetching(false);
        } catch (er) {
          setMessageFetching(false);
        }
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
          locatedMessageIdRef.current = targetMessage.clientMsgNo;

          jumpScrolling.current = true;
          jumpToLocatedId.current = true;

          setLocatedMessageId(targetMessage.clientMsgNo);

          pulldowning.current = false;
        }
      }
    }
  };

  const pulldowning = useRef(false);
  const pulldownFinished = useRef(false);
  const handleMsgScroll = (e: any) => {
    if (jumpScrolling.current === true) {
      jumpScrolling.current = false;
      return;
    }

    if (pulldowning.current || pulldownFinished.current) {
      return;
    }

    pulldowning.current = true;
    pullDown()
      .then(() => {
        pulldowning.current = false;
      })
      .catch(() => {
        pulldowning.current = false;
      });
  };

  messageStatusListener = (ack: SendackPacket) => {
    // 有时一次会发多条消息，要缓存一下已经赋值过id和seq的消息
    let msgIdCache: Record<string, boolean> = {};
    let seqCache: Record<string, boolean> = {};
    for (let i = 0; i < messagesRef.current.length; i++) {
      const m = messagesRef.current[i];
      const newMsgId = ack.messageID.toString();
      if (!m.messageID && !msgIdCache[newMsgId]) {
        m.messageID = newMsgId;
        msgIdCache[newMsgId] = true;
      }
      if (!m.messageSeq && !seqCache[newMsgId]) {
        m.messageSeq = ack.messageSeq;
        seqCache[newMsgId] = true;
      }

      if (m.clientSeq == ack.clientSeq) {
        m.status =
          ack.reasonCode == 1 ? MessageStatus.Normal : MessageStatus.Fail;
      }
    }

    setMessages([...messagesRef.current]);
  };

  // 监听cmd消息
  cmdListener = (msg: Message) => {
    console.log("收到CMD：", msg);
    const cmdContent = msg.content as CMDContent;
    const temp = [...messagesRef.current];
    temp.push(msg);
    setMessages(temp);
    if (cmdContent.cmd === "messageRevoke") {
      // WKSDK.shared()
      //   .config.provider.syncConversationsCallback()
      //   .then((newConversations) => {
      //     const newWarps = newConversations.map(
      //       (item) => new ConversationWrap(item)
      //     );
      //     setConversationWraps(newWarps);
      //   });
    } else if (cmdContent.cmd === "channelUpdate") {
      // 编辑群时也调用这个方法更新
      WKSDK.shared().channelManager.fetchChannelInfo(
        new Channel(msg.channel.channelID, ChannelTypeGroup)
      );
      // 修改了群公告，群权限后触发
      getGroupDetailData(msg.channel.channelID);
      // 有人加群后也触发updatechannel
      syncSubscriber(msg.channel);
    } else if (cmdContent.cmd === "forbidden") {
      // 修改了禁言后重新同步群成员
      syncSubscriber(msg.channel);
    }
    const channel = msg.channel;
    let conversation =
      WKSDK.shared().conversationManager.findConversation(channel);

    if (conversation) {
      WKSDK.shared().conversationManager.notifyConversationListeners(
        conversation,
        ConversationAction.update
      );
    }
  };

  // 连接IM
  const connectIM = (addr: string) => {
    const config = WKSDK.shared().config;

    if (!user?.username || !token) {
      return;
    }
    config.uid = user.username;
    config.token = token;
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
    connectIM(`${wsUrlPrefix}/im-ws`);
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
    setFetchingSubscribers(true);
    try {
      await WKSDK.shared().channelManager.syncSubscribes(channel); // 同步订阅者
      setFetchingSubscribers(false);
    } catch (err) {
      setFetchingSubscribers(false);
    }
    const members: Subscriber[] =
      WKSDK.shared().channelManager.getSubscribes(channel);
    subscriberCache.set(channel.channelID, members);
    setSubscribers(members);
  };

  // 群成员

  const handleChannelSelect = (channel: Channel) => {
    messagesRef.current = [];
    jumpMsgIdRef.current = "";
    setLocatedMessageId("");
    locatedMessageIdRef.current = "";
    if (subscriberCache.has(channel.channelID)) {
      const members = subscriberCache.get(channel.channelID) || [];
      setSubscribers(members);
      pullLast(channel);
    } else {
      syncSubscriber(channel).finally(() => {
        // 查完群员之后缓存了人员头像昵称再拉消息，优化性能
        pullLast(channel);
      });
    }

    // 输入框和回复内容重置
    setReplyMessage(null);
    setMentions([]);
    setInputValue("");
  };

  // // 初始化群聊列表和消息
  const onInitChannel = (list: ConversationWrap[]) => {
    const firstChannel = list.find(
      (item) => item.channel.channelID === selectedChannel?.channelID
    )?.channel;
    if (firstChannel) {
      handleChannelSelect(firstChannel);
      getGroupDetailData(firstChannel.channelID);
      // 进来自动清理未读
      const conversation =
        WKSDK.shared().conversationManager.findConversation(firstChannel);
      if (conversation && conversation.unread > 0) {
        APIClient.shared.clearUnread(firstChannel);
        conversation.unread = 0;
        WKSDK.shared().conversationManager.notifyConversationListeners(
          conversation,
          ConversationAction.update
        );
      }
    }
  };

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
      // 现在只@一个人
      const curMention = {
        name: channelInfo?.title,
        uid: id,
      };
      setMentions([curMention]);
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
    // const newConversations =
    //   await WKSDK.shared().config.provider.syncConversationsCallback();
    // const newWarps = newConversations.map((item) => new ConversationWrap(item));

    // setConversationWraps(newWarps);
  };

  const initOverFlag = useRef(true);

  useEffect(() => {
    if (messages instanceof Array && messages.length > 0) {
      // 第一屏不够高时，再查一遍前面的信息
      initOverFlag.current = false;
      if (
        msgListRef.current &&
        typeof msgListRef.current.judgeNotOver === "function"
      ) {
        const notOver = msgListRef.current.judgeNotOver();
        if (notOver) {
          pullDown();
        }
      }

      // message 更新完成，并且dom也渲染结束胡，如果有要定位过去的消息，就自动scroll过去
      if (jumpMsgIdRef.current) {
        scroller.scrollTo(jumpMsgIdRef.current, {
          containerId: "group-chat-msglist",
          duration: 0,
        });
      } else if (
        locatedMessageIdRef.current &&
        jumpToLocatedId.current === true
      ) {
        // 点击了引用信息后，要跳转并高亮引用的原信息
        if (
          messages.findIndex(
            (m) => m.clientMsgNo === locatedMessageIdRef.current
          ) >= 0
        ) {
          gotoLocatedMessagePosition();
        }
      } else {
        scrollBottom();
      }
    }
  }, [messages]);

  let jumpToLocatedId = useRef(true);
  const gotoLocatedMessagePosition = () => {
    jumpToLocatedId.current = false;
    const dom = document.getElementById(locatedMessageIdRef.current);
    if (dom) {
      // 要差个300px  不然又触发pullDown
      msgListRef.current.scrollTo(dom.offsetTop - 300);
    }
  };

  const [total, setTotal] = useState<string | number>(0);
  useEffect(() => {
    window.document.title = "讨论社群";
  }, []);

  return (
    <div className="group-chat-container flex">
      <Toaster></Toaster>
      {messageFetching === true && <FullScreenLoading />}
      <GroupChatContext.Provider
        value={{ handleReply, handleRevoke, syncSubscriber }}
      >
        <GroupChatLeftBar />
        <GroupChannel
          onInitChannel={onInitChannel}
          onSelectChannel={(
            channel: Channel,
            conversation: ConversationWrap
          ) => {
            handleChannelSelect(channel);
            setTotal(conversation.total_user);
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
                    loading={messageFetching}
                    handleFindPrevMsg={handleFindPrevMsg}
                    handleScroll={handleMsgScroll}
                  />
                  <GroupChatInput
                    onMsgSend={() => {
                      jumpMsgIdRef.current = "";
                    }}
                    ref={messageInputRef}
                  />
                </div>
                <div className="w-[220px] group-member-panel">
                  <GroupMembers total={total} />
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
            min-width: 1080px;
          }
          .group-chat-container div {
            box-sizing: border-box;
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
            border-bottom: 1px solid rgb(50, 50, 50);
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
