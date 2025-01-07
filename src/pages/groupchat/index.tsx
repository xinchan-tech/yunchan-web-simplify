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
} from "wukongimjssdk";
import { useEffect, useRef, useState } from "react";
import { useUser, useToken } from "@/store";
import { Button, Input } from "@/components";
import { useGroupChatStoreNew } from "@/store/group-chat-new";
import { useLatest } from "ahooks";

let connectStatusListener!: ConnectStatusListener;
let messageListener!: MessageListener;
let messageStatusListener!: MessageStatusListener;

enum PullMode {
  Down = 0, // 向下拉取
  Up = 1, // 向上拉取
}

const GroupChatPage = () => {
  const { token } = useToken();
  const { user } = useUser();

  const [title, setTitle] = useState("");
  const { toChannel, setToChannel, selectedChannel } = useGroupChatStoreNew();
  const latestToChannel = useLatest(toChannel)
  const msgListRef = useRef<any>(null)

  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<Message[]>([]);

  // 消息列表滚动到底部
  const scrollBottom = () => {
    let timer = setTimeout(() => {
      if(msgListRef.current && typeof msgListRef.current.scrollToBottom === 'function') {
        msgListRef.current.scrollToBottom()
      }
      clearTimeout(timer)
      timer = null;
    }, 0);
  }

  // 监听消息
  messageListener = 
    (msg) => {
      if (latestToChannel.current?.channelID !== msg.channel.channelID) {
        return;
      }
      const temp = [...messagesRef.current];
      temp.push(msg);
      setMessages(temp);
      messagesRef.current = temp;

      //   scrollBottom();
    }

 

  // 拉取当前会话最新消息
  const pullLast = async (channel: Channel) => {
    if (channel) {
      const msgs = await WKSDK.shared().chatManager.syncMessages(channel, {
        limit: 15,
        startMessageSeq: 0,
        endMessageSeq: 0,
        pullMode: PullMode.Up,
      });

      if (msgs && msgs.length > 0) {
        msgs.forEach((m) => {
          messagesRef.current.push(m);
        });
      }
      setMessages(messagesRef.current);
      scrollBottom()
    }
  };

  messageStatusListener = (ack: SendackPacket) => {
    console.log(ack);
    messagesRef.current.forEach((m) => {
      if (m.clientSeq == ack.clientSeq) {
        m.status =
          ack.reasonCode == 1 ? MessageStatus.Normal : MessageStatus.Fail;
        return;
      }
    });
    setMessages(messagesRef.current)
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
      if (status == ConnectStatus.Connected) {
        setTitle(`${config.uid || ""}(连接成功)`);
      } else {
        setTitle(`${config.uid || ""}(断开)`);
      }
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

  const handleChannelSelect = (channel:Channel) => {
    messagesRef.current = [];

    pullLast(channel);
  }

  useEffect(() => {
    if(selectedChannel) {
      handleChannelSelect(selectedChannel)
    }
  }, [

    selectedChannel
  ])
  return (
    <div className="group-chat-container flex">
      <GroupChatLeftBar />
      <GroupChannel
        onSelectChannel={(channel: Channel) => {
          // handleChannelSelect(channel)
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
            <GroupChatMsgList messages={messages} ref={msgListRef}/>
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
