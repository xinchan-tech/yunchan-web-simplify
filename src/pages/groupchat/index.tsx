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
} from "wukongimjssdk";
import { useEffect, useRef, useState } from "react";
import { useUser, useToken } from "@/store";
import { Button, Input } from "@/components";
import {
  useGroupChatShortStore,
  useGroupChatStoreNew,
} from "@/store/group-chat-new";
import { useLatest, useThrottleFn } from "ahooks";
import { setPersonChannelCache } from "./chat-utils";
import { fromUIDList } from "./Service/dataSource";
import GroupMembers from "./group-members";

const Threshold = 200;

let connectStatusListener!: ConnectStatusListener;
let messageListener!: MessageListener;
let messageStatusListener!: MessageStatusListener;

const GroupChatPage = () => {
  const { token } = useToken();
  const { user } = useUser();

  const { toChannel, setToChannel, selectedChannel } = useGroupChatStoreNew();
  const latestToChannel = useLatest(toChannel);
  const msgListRef = useRef<any>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);
  const { conversationWraps } = useGroupChatShortStore();

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
        limit: 15,
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

  // 查看前面的消息
  const pullDown = async () => {
    if (messagesRef.current.length == 0) {
      return;
    }
    const firstMsg = messagesRef.current[0];
    const firstMsgId = firstMsg.clientMsgNo;
    if (firstMsg.messageSeq == 1) {
      pulldownFinished.current = true;
      return;
    }
    if (latestToChannel.current) {
      const limit = 15;
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

      // 等待dom更新后修改滚动位置

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
      }, 0);
    }
  };

  const pulldowning = useRef(false);
  const pulldownFinished = useRef(false);
  const handleMsgScroll = useThrottleFn(
    (e: any) => {
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
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);

  const handleChannelSelect = async (channel: Channel) => {
    messagesRef.current = [];

    await WKSDK.shared().channelManager.syncSubscribes(channel); // 同步订阅者
    const members: Subscriber[] =
      WKSDK.shared().channelManager.getSubscribes(channel);
    setSubscribers(members);
    console.log(members, "subscribers");
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
  return (
    <div className="group-chat-container flex">
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
              handleScroll={handleMsgScroll.run}
            />
            <GroupChatInput
              onMsgSend={scrollBottom}
              subscribers={subscribers}
            />
          </div>
          <div className="w-[220px] group-member-panel">
            <GroupMembers subscribers={subscribers} />
          </div>
        </div>
      </div>
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
