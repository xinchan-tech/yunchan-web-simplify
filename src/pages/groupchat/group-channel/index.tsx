import WKSDK, {
  ConnectStatus,
  ConversationAction,
  Conversation,
  Channel,
  ChannelInfo,
  ChannelTypeGroup,
  CMDContent,
  ChannelTypePerson,
} from "wukongimjssdk";
import { ConversationWrap } from "../ConversationWrap";
import { ReactNode, useEffect, useMemo, useRef } from "react";
import {
  useGroupChatStoreNew,
  useGroupChatShortStore,
} from "@/store/group-chat-new";
import { cn } from "@/utils/style";
import APIClient from "../Service/APIClient";
import { useLatest } from "ahooks";
import { useShallow } from "zustand/react/shallow";

import { getGroupChannels } from "@/api";
import { useQuery } from "@tanstack/react-query";
import ChatAvatar from "../components/chat-avatar";
import CreateGroup from "../components/create-group";
import { setPersonChannelCache } from "../chat-utils";

export type GroupData = {
  id: string;
  account: string;
  avatar: string;
  name: string;
  price: string;
  brief: string;
  tags: string;
  total_user: string;
  in_channel: number;
};

const GroupChannel = (props: {
  onSelectChannel: (c: Channel, con: ConversationWrap) => void;
}) => {
  const {
    conversationWraps,
    setConversationWraps,
    setReadyToJoinGroup,
    readyToJoinGroup,
    getGroupDetailData,
  } = useGroupChatShortStore(
    useShallow((state) => ({
      conversationWraps: state.conversationWraps,
      setConversationWraps: state.setConversationWraps,
      setReadyToJoinGroup: state.setReadyToJoinGroup,
      readyToJoinGroup: state.readyToJoinGroup,
      getGroupDetailData: state.getGroupDetailData,
    }))
  );
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
      handleSelectChannel(conversation.channel, conversation);
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
  const channelInfoListener = (channelInfo: ChannelInfo) => {
    // if (latestConversation.current.length > 0) {
    //   const temp = [...latestConversation.current];
    //   setConversationWraps(temp);
    // }
  };

  const fetchingUserFlag = useRef(false);
  const lastContent = (conversationWrap: ConversationWrap) => {
    if (!conversationWrap.lastMessage) {
      return;
    }
    let head: ReactNode | string;
    let content: ReactNode | string;
    const draft = conversationWrap.remoteExtra.draft;
    if (draft && draft !== "") {
      head = draft;
    }

    if (conversationWrap.isMentionMe === true) {
      head = <span style={{ color: "red" }}>[有人@我]</span>;
    }

    if (conversationWrap.lastMessage) {
      const channelInfo = WKSDK.shared().channelManager.getChannelInfo(
        new Channel(conversationWrap.lastMessage.fromUID, ChannelTypePerson)
      );
      if (channelInfo) {
        head = channelInfo.title + "：";
      } else if (fetchingUserFlag.current === false) {
        // 没有就缓存下
        fetchingUserFlag.current = true;
        setPersonChannelCache(conversationWrap.lastMessage.fromUID).then(() => {
          fetchingUserFlag.current = false;
        });
      }

      content = conversationWrap.lastMessage.content.conversationDigest || "";
      if (conversationWrap.lastMessage.content instanceof CMDContent) {
        if (conversationWrap.lastMessage.content.cmd === "messageRevoke") {
          content = "撤回了一条消息";
        } else {
          content = "加入了群聊";
        }
      }
    }

    return (
      <span>
        {head}
        {content}
      </span>
    );
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

  const clearConversationMentionMe = (channel: Channel) => {
    const conversation =
      WKSDK.shared().conversationManager.findConversation(channel);
    if (conversation && conversation.isMentionMe === true) {
      conversation.isMentionMe = false;
      WKSDK.shared().conversationManager.notifyConversationListeners(
        conversation,
        ConversationAction.update
      );
    }
  };

  const option = {
    queryKey: [getGroupChannels.cacheKey],
    queryFn: () =>
      getGroupChannels({
        type: "1",
      }),
  };

  const { data } = useQuery(option);

  const handleSelectChannel = (
    channel: Channel,
    conversation: ConversationWrap
  ) => {
    //  优化一下，有未读消息才clear unread
    if (conversation && conversation.unread && conversation.unread > 0) {
      APIClient.shared.clearUnread(channel);
    }

    clearConversationUnread(channel);
    clearConversationMentionMe(channel);
    if (channel.channelID === selectedChannel?.channelID) {
      return;
    }
    getGroupDetailData(channel.channelID);
    setSelectedChannel(channel);
    setToChannel(channel);
    if (typeof onSelectChannel === "function") {
      onSelectChannel(channel, conversation);
    }
  };
  // console.log(conversationWraps, "conversationWraps");

  useEffect(() => {
    console.log(data, "conversationWraps");
  }, [data]);

  const toChannelInfo = (data: GroupData) => {
    let channelInfo = new ChannelInfo();
    channelInfo.channel = new Channel(data.account, ChannelTypeGroup);
    channelInfo.title = data.name;
    channelInfo.mute = false;
    channelInfo.top = false;
    channelInfo.online = false;

    channelInfo.logo = data.avatar;

    return channelInfo;
  };

  const displayConversations = useMemo(() => {
    let result: Array<GroupData | ConversationWrap> = [];

    if (
      data &&
      data.items instanceof Array &&
      conversationWraps instanceof Array
    ) {
      result = data.items.map((item) => {
        WKSDK.shared().channelManager.setChannleInfoForCache(
          toChannelInfo(item)
        );
        const joinedGroup = conversationWraps.find(
          (con) => con.channel.channelID === item.account
        );
        if (joinedGroup) {
          joinedGroup.total_user = item.total_user;
          return joinedGroup;
        } else {
          return item;
        }
      });
    }
    return result;
  }, [data, conversationWraps]);

  return (
    <div className="w-[270px] h-full">
      <div className="group-filter h-[58px] flex items-center justify-between pl-4 pr-4">
        <span>我的群聊</span>
        <CreateGroup />
      </div>
      <div className="group-list">
        {displayConversations.map((item: ConversationWrap | GroupData) => {
          if (item instanceof ConversationWrap) {
            return (
              <div
                key={item.channel.channelID}
                className={cn(
                  "flex conversation-card",
                  item.channel.channelID === selectedChannel?.channelID &&
                    !readyToJoinGroup &&
                    "actived"
                )}
                onClick={() => {
                  setReadyToJoinGroup(null);
                  handleSelectChannel(item.channel, item);
                }}
              >
                <div className="group-avatar rounded-md flex items-center text-ellipsis justify-center relative">
                  <ChatAvatar
                    radius="10px"
                    className="w-[44px] h-[44px]"
                    data={{
                      name: item.channelInfo?.title || "",
                      uid: item.channel.channelID,
                      avatar: item.channelInfo?.logo || "",
                    }}
                  />
                  {item.unread > 0 && (
                    <div className="absolute h-[18px] box-border  unread min-w-6">
                      {item.unread > 99 ? "99+" : item.unread}
                    </div>
                  )}
                </div>
                <div className="group-data flex-1">
                  <div className="group-title">
                    {item.channelInfo?.title || ""}
                    <span className="text-xs text-gray-400">
                      ({item.total_user})
                    </span>
                  </div>
                  <div className="group-last-msg flex justify-between">
                    <div className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis max-w-24">
                      {lastContent(item)}
                    </div>
                    <div className="max-w-24">{item.timestampString || ""}</div>
                  </div>
                </div>
              </div>
            );
          } else {
            return (
              <div
                key={item.account}
                className={cn(
                  "flex conversation-card",
                  item.account === readyToJoinGroup?.account && "actived"
                )}
                onClick={() => {
                  if (readyToJoinGroup?.account === item.account) {
                    return;
                  }
                  setSelectedChannel(null);
                  getGroupDetailData(item.account);
                  setReadyToJoinGroup(item);
                }}
              >
                <div className="group-avatar rounded-md flex items-center text-ellipsis justify-center relative">
                  <ChatAvatar
                    radius="10px"
                    className="w-[44px] h-[44px]"
                    data={{
                      name: item.name || "",
                      uid: item.account,
                      avatar: item.avatar || "",
                    }}
                  />
                </div>
                <div className="group-data flex-1">
                  <div className="group-title">{item.name || ""}</div>
                  <div className="group-last-msg flex justify-between">
                    <div className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis max-w-24">
                      一起加入群组吧
                    </div>
                    <div className="max-w-24"></div>
                  </div>
                </div>
              </div>
            );
          }
        })}
      </div>

      <style jsx>
        {`
          .group-filter {
            background-color: rgb(49, 51, 57);
          }
          .group-list {
            overflow-y: auto;
            height: calc(100% - 58px);
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
