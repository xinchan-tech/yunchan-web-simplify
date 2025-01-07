import WKSDK, {
  ConnectStatus,
  ConversationAction,
  Conversation,
  Channel,
} from "wukongimjssdk";
import { ConversationWrap } from "../ConversationWrap";
import { useEffect, useState } from "react";
import { useGroupChatStoreNew } from "@/store/group-chat-new";
import { cn } from "@/utils/style";
import APIClient from "@/services/APIClient";
import { useLatest } from "ahooks";
import { lastContent } from "../chat-utils";

const GroupChannel = (props: { onSelectChannel: (c: Channel) => void }) => {
  const [conversationWraps, setConversationWraps] = useState<
    ConversationWrap[]
  >([]);
  const latestConversation = useLatest(conversationWraps);
  const { onSelectChannel } = props;
  const { setSelectedChannel, selectedChannel, setToChannel } =
    useGroupChatStoreNew();

  // 排序最近会话列表
  const sortConversations = (conversations?: Array<ConversationWrap>) => {
    let newConversations = conversations;
    if (!newConversations) {
      newConversations = [...latestConversation.current];
    }
    if (!newConversations || newConversations.length <= 0) {
      return [];
    }
    let sortAfter = newConversations.sort((a, b) => {
      let aScore = a.timestamp;
      let bScore = b.timestamp;
      if (a.extra?.top === 1) {
        aScore += 1000000000000;
      }
      if (b.extra?.top === 1) {
        bScore += 1000000000000;
      }
      return bScore - aScore;
    });
    return sortAfter;
  };

  const batchUpdateConversation = (list: ConversationWrap[]) => {
    if (list instanceof Array && list.length > 0) {
      list.forEach((item) => {
        fetchChannelInfoIfNeed(item.channel);
      });
    }
  };
  // 监听连接状态
  const connectStatusListener = async (status: ConnectStatus) => {
    if (status === ConnectStatus.Connected) {
      const remoteConversations =
        await WKSDK.shared().conversationManager.sync(); // 同步最近会话列表
      if (remoteConversations && remoteConversations.length > 0) {
        const temp = sortConversations(
          remoteConversations.map(
            (conversation) => new ConversationWrap(conversation)
          )
        );
        batchUpdateConversation(temp);
        setConversationWraps(temp);
      }
    }
  };

  // 监听最近会话列表的变化
  const conversationListener = (
    conversation: Conversation,
    action: ConversationAction
  ) => {
    // 监听最近会话列表的变化

    if (action === ConversationAction.add) {
      const temp = [
        new ConversationWrap(conversation),
        ...(latestConversation.current || []),
      ];
      batchUpdateConversation(temp);
      setConversationWraps(temp);
    } else if (action === ConversationAction.update) {
      const index = latestConversation.current?.findIndex(
        (item) =>
          item.channel.channelID === conversation.channel.channelID &&
          item.channel.channelType === conversation.channel.channelType
      );
      if (index !== undefined && index >= 0) {
        latestConversation.current![index] = new ConversationWrap(conversation);
        const temp = sortConversations();
        batchUpdateConversation(temp);
        setConversationWraps(temp);
      }
    } else if (action === ConversationAction.remove) {
      const index = latestConversation.current?.findIndex(
        (item) =>
          item.channel.channelID === conversation.channel.channelID &&
          item.channel.channelType === conversation.channel.channelType
      );
      const temp = [...latestConversation.current];
      if (index && index >= 0) {
        temp.splice(index, 1);
      }
      batchUpdateConversation(temp);
      setConversationWraps(temp);
    }
  };

  // 强制刷新会话
  const channelInfoListener = () => {
    if (conversationWraps.length > 0) {
      const temp = [...conversationWraps];
      setConversationWraps(temp);
    }
  };

  useEffect(() => {
    WKSDK.shared().connectManager.addConnectStatusListener(
      connectStatusListener
    ); // 监听连接状态
    WKSDK.shared().conversationManager.addConversationListener(
      conversationListener
    ); // 监听最近会话列表的变化

    WKSDK.shared().channelManager.addListener(channelInfoListener); // 监听频道信息变化

    return () => {
      WKSDK.shared().conversationManager.removeConversationListener(
        conversationListener
      );
      WKSDK.shared().connectManager.removeConnectStatusListener(
        connectStatusListener
      );
      WKSDK.shared().channelManager.removeListener(channelInfoListener);
    };
  }, []);

  const fetchChannelInfoIfNeed = (channel: Channel) => {
    const channelInfo = WKSDK.shared().channelManager.getChannelInfo(channel);
    if (!channelInfo) {
      WKSDK.shared().channelManager.fetchChannelInfo(channel);
    }
  };

  const clearConversationUnread = (channel: Channel) => {
    const conversation =
      WKSDK.shared().conversationManager.findConversation(channel);
    if (conversation) {
      conversation.unread = 0;
      WKSDK.shared().conversationManager.notifyConversationListeners(
        conversation,
        ConversationAction.update
      );
    }
  };

  const handleSelectChannel = (channel: Channel) => {
    setSelectedChannel(channel);
    setToChannel(channel);
    if (typeof onSelectChannel === "function") {
      onSelectChannel(channel);
    }
    APIClient.shared.clearUnread(channel);
    clearConversationUnread(channel);
  };
  // console.log(conversationWraps, "conversationWraps");

  return (
    <div className="w-[270px]">
      <div className="group-filter h-[58px]"></div>
      <div className="group-list">
        {conversationWraps.map((item: ConversationWrap) => {
          return (
            <div
              key={item.channel.channelID}
              className={cn(
                "flex conversation-card",
                item.channel.channelID === selectedChannel?.channelID &&
                  "actived"
              )}
              onClick={() => {
                handleSelectChannel(item.channel);
              }}
            >
              <div className="group-avatar flex items-center overflow-hidden text-ellipsis justify-center relative">
                {item.channelInfo?.logo ? (
                  <img
                    src={item.channelInfo?.logo}
                    style={{ width: "48px", height: "48px" }}
                  />
                ) : (
                  <span>{item.channelInfo?.title || ''}</span>
                )}

                {item.unread > 0 && (
                  <div className="absolute h-[18px] box-border unread min-w-6">
                    {item.unread > 99 ? "99+" : item.unread}
                  </div>
                )}
              </div>
              <div className="group-data flex-1">
                <div className="group-title">
                  {item.channelInfo?.title || ""}
                </div>
                <div className="group-last-msg flex justify-between">
                  <div className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis">
                    {lastContent(item)}
                    {item.lastMessage?.content.conversationDigest || ""}
                  </div>
                  <div className="max-w-20">{item.timestampString || ""}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <style jsx>
        {`
          .group-filter {
            background-color: rgb(49, 51, 57);
          }
          .unread {
            background-color: rgb(218, 50, 50);
            border-radius: 8px;
            border: 1px solid #fff;
            font-size: 14px;
            line-height: 16px;
            text-align: center;
            padding: 0 4px;
            top: 0;
            right: 0;
            transform: translate(50%, -50%);
          }
          .group-avatar {
            width: 48px;
            height: 48px;
            border-radius: 8px;
            background-color: rgb(228, 98, 64);
            color: #fff;
            font-size: 13px;
          }
          .group-avatar img {
            border-radius: 8px;
          }
          .group-data {
            margin-left: 8px;
          }
          .conversation-card {
            padding: 14px 12px;
            border-radius: 8px;
          }
          .group-last-msg {
            color: rgb(112, 116, 124);
            margin-top: 4px;
            font-size: 14px;
          }
          .conversation-card.actived .group-last-msg {
            color: #fff;
          }
          .conversation-card.actived {
            background: linear-gradient(
              to right,
              rgb(89, 78, 225),
              rgb(79, 69, 176)
            );
          }
        `}
      </style>
    </div>
  );
};

export default GroupChannel;
