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
    }, 0);
  };

  // 监听消息
  messageListener = (msg) => {
    if (latestToChannel.current?.channelID !== msg.channel.channelID) {
      return;
    }
    const temp = [...messagesRef.current];

    if (fromUIDList.indexOf(msg.fromUID) < 0) {
      fromUIDList.push(msg.fromUID);
      setPersonChannelCache(msg.fromUID);

      setMessages(temp);
    }

    temp.push(msg);
    setMessages(temp);
    messagesRef.current = temp;

    //   scrollBottom();
  };

  // 拉取当前会话最新消息
  const pullLast = async (channel: Channel) => {
    if (channel) {
      pulldowning.current = true
      pulldownFinished.current = false
      const msgs = await WKSDK.shared().chatManager.syncMessages(channel, {
        limit: 15,
        startMessageSeq: 0,
        endMessageSeq: 0,
        pullMode: PullMode.Up,
      });
      pulldowning.current = false
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
    const firstMsgId = firstMsg.clientMsgNo
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
  const handleMsgScroll = useThrottleFn((e: any) => {
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
  }, {
    wait: 200
  })

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

  const [groupNm, setGroupNm] = useState("");

  const handleAddGroupChannel = () => {
    const channel = new Channel(groupNm, ChannelTypeGroup);

    setToChannel(channel);
    const conversation =
      WKSDK.shared().conversationManager.findConversation(channel);
    if (!conversation) {
      // 如果最近会话不存在，则创建一个空的会话
      WKSDK.shared().conversationManager.createEmptyConversation(channel);
    }
  };

  const handleChannelSelect = (channel: Channel) => {
    messagesRef.current = [];

    pullLast(channel);
  };

  // 初始化群聊列表和消息
  const initChannelFlag = useRef(true);
  useEffect(() => {
    if (
      selectedChannel &&
      conversationWraps.length > 0 &&
      initChannelFlag.current === true
    ) {
      handleChannelSelect(selectedChannel);
      initChannelFlag.current = false;
    }
  }, [selectedChannel, conversationWraps]);
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
          <div className="group-title">
            群名称
            <div className="flex">
              <Input
                className="inline-block"
                placeholder="请输入群聊名称"
                value={groupNm}
                onChange={(e) => {
                  setGroupNm(e.target.value);
                }}
              />
              <Button onClick={handleAddGroupChannel}>新建群聊</Button>
            </div>
          </div>
        </div>
        <div className="flex" style={{ height: "calc(100% - 58px)" }}>
          <div className="group-msg-panel">
            <GroupChatMsgList
              messages={messages}
              ref={msgListRef}
              handleScroll={handleMsgScroll.run}
            />
            <GroupChatInput onMsgSend={scrollBottom} />
          </div>
          <div className="w-[220px]"></div>
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
