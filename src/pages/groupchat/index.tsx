import GroupChannel from "./group-channel";
import GroupChatLeftBar from "./left-bar";

import GroupChatMsgList from "./group-chat-msglist";
import GroupChatInput from "./group-chat-input";
import WKSDK, {
  ConnectStatusListener,
  Message,
  Channel,
  Subscriber,
  ChannelTypePerson,
  CMDContent,
  ConversationAction,
  ChannelTypeGroup,
} from "wukongimjssdk";
import { useEffect, useRef, useState, createContext } from "react";
import { useUser, useToken } from "@/store";

import {
  useGroupChatShortStore,
  useGroupChatStoreNew,
} from "@/store/group-chat-new";
import { useShallow } from "zustand/react/shallow";
import { useLatest } from "ahooks";

import GroupMembers from "./group-members";

import { revokeMessageService } from "@/api";

import { Toaster } from "@/components";
import { ConversationWrap } from "./ConversationWrap";

import APIClient from "./Service/APIClient";
import TextImgLive from "./text-img-live";

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

let cmdListener!: (message: Message) => void;

const GroupChatPage = () => {
  const { token } = useToken();
  const { user } = useUser();

  const [indexTab, setIndexTab] = useState<"chat" | "live">("chat");
  const { selectedChannel } = useGroupChatStoreNew();

  const msgListRef = useRef<any>(null);

  const {
    setSubscribers,
    setFetchingSubscribers,
    setReplyMessage,
    setInputValue,
    setLocatedMessageId,
    setMessages,
    getGroupDetailData,
    groupDetailData,
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
        setConversationWraps: state.setConversationWraps,
        setMessages: state.setMessages,
        getGroupDetailData: state.getGroupDetailData,
        groupDetailData: state.groupDetailData,

        setMentions: state.setMentions,
      };
    })
  );

  // 输入框实例
  const messageInputRef = useRef();
  //

  // 监听cmd消息
  cmdListener = (msg: Message) => {
    console.log("收到CMD：", msg);
    const cmdContent = msg.content as CMDContent;
    if (msgListRef.current) {
      const temp = msgListRef.current.getMessagesRef();
      temp.push(msg);
      setMessages(temp);
    }
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

    WKSDK.shared().chatManager.addCMDListener(cmdListener);
    WKSDK.shared().connect();
  };

  useEffect(() => {
    connectIM(`${wsUrlPrefix}/im-ws`);

    const channel = new BroadcastChannel("chat-channel");

    channel.onmessage = (event) => {
      if (event.data.type === "logout") {
        window.close();
      }
    };

    return () => {
      WKSDK.shared().connectManager.removeConnectStatusListener(
        connectStatusListener
      );

      WKSDK.shared().chatManager.removeCMDListener(cmdListener);
      WKSDK.shared().disconnect();
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
    setLocatedMessageId("");

    if (subscriberCache.has(channel.channelID)) {
      const members = subscriberCache.get(channel.channelID) || [];
      setSubscribers(members);
      if (msgListRef.current) {
        msgListRef.current.pullLast(channel, true);
      }
    } else {
      syncSubscriber(channel).finally(() => {
        // 查完群员之后缓存了人员头像昵称再拉消息，优化性能
        if (msgListRef.current) {
          msgListRef.current.pullLast(channel, true);
        }
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
        name: channelInfo?.title || "",
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

  const [total, setTotal] = useState<string | number>(0);
  useEffect(() => {
    window.document.title = "讨论社群";
  }, []);

  if (!token) {
    return (
      <div
        style={{ height: "100vh" }}
        className="w-full flex items-center justify-center"
      >
        您已退出登录，请关闭窗口并重新登录
      </div>
    );
  }

  return (
    <div className="group-chat-container flex">
      <Toaster></Toaster>

      <GroupChatLeftBar
        indexTab={indexTab}
        onTabChange={(val) => {
          setIndexTab(val);
        }}
      />
      {indexTab === "live" ? (
        <TextImgLive></TextImgLive>
      ) : (
        <GroupChatContext.Provider
          value={{ handleReply, handleRevoke, syncSubscriber }}
        >
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
            <div className="group-chat-header justify-between h-[58px]">
              <div className="group-title items-center pt-2 h-full">
                <p className="mb-0 mt-0">{groupDetailData?.name}</p>
                <p className="text-xs text-gray-400 mt-0 mb-0">
                  {groupDetailData?.brief}
                </p>
              </div>
            </div>
            <div className="flex" style={{ height: "calc(100% - 58px)" }}>
              <div className="group-msg-panel">
                <GroupChatMsgList ref={msgListRef} />
                <GroupChatInput
                  onMsgSend={() => {
                    if (msgListRef.current) {
                      msgListRef.current.resetJumpIdRef();
                    }
                  }}
                  ref={messageInputRef}
                />
              </div>
              <div className="w-[220px] group-member-panel">
                <GroupMembers total={total} />
              </div>
            </div>
          </div>
        </GroupChatContext.Provider>
      )}

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
  );
};

export default GroupChatPage;
