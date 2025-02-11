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
import { ReactNode, useEffect, useRef, useState } from "react";
import {
  useGroupChatStoreNew,
  useGroupChatShortStore,
  useChatNoticeStore,
} from "@/store/group-chat-new";
import { cn } from "@/utils/style";
import APIClient from "../Service/APIClient";
import { useLatest } from "ahooks";
import { useShallow } from "zustand/react/shallow";
import { useModal } from "@/components";
import { useUpdate } from "ahooks";
import { getGroupChannels } from "@/api";
// import { useQuery } from "@tanstack/react-query";
import ChatAvatar from "../components/chat-avatar";
import CreateGroup from "../components/create-and-join-group";
import {
  groupToChannelInfo,
  judgeIsExpireGroupCache,
  judgeIsUserInSyncChannelCache,
  setExpireGroupInCache,
  setPersonChannelCache,
  setUserInSyncChannelCache,
} from "../chat-utils";
import { JknIcon, Skeleton } from "@/components";
import UpdateGroupInfo from "./updateGroupInfo";
import { useQuery } from "@tanstack/react-query";

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
  onInitChannel: (conversations: ConversationWrap[]) => void;
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
  const { updateForceUpdateAvatarId } = useChatNoticeStore();
  // const update = useUpdate();
  const latestConversation = useLatest(conversationWraps);
  const { onSelectChannel } = props;
  const { setSelectedChannel, selectedChannel, setToChannel } =
    useGroupChatStoreNew();
  const latestChannel = useLatest(selectedChannel);
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
  const fetchData = async () => {
    if (data?.items && data?.items.length > 0) {
      return;
    }
    const res = await getGroupChannels({ type: "1" });
    if (res.items instanceof Array) {
      res.items.forEach((channel) => {
        const cacheData = { name: channel.name, avatar: channel.avatar };
        WKSDK.shared().channelManager.setChannleInfoForCache(
          groupToChannelInfo(cacheData, channel.account)
        );
      });
    }
    return res;
  };
  const options = {
    queryFn: fetchData,
    queryKey: ["channel:fetchData"],
  };

  const { data } = useQuery(options);
  const [editChannel, setEditChannel] = useState<ConversationWrap>();
  // 修改社群
  const updateGroupInfoModal = useModal({
    content: (
      <>
        {editChannel && (
          <UpdateGroupInfo
            group={editChannel.channel}
            total={editChannel.total_user}
          />
        )}
      </>
    ),
    title: "社群信息",
    footer: null,
    className: "w-[700px]",
    closeIcon: true,
  });

  // 监听连接状态
  const firstInitFlag = useRef(true);
  const [fetchingConversation, setFetchingConversation] = useState(false);
  const connectStatusListener = async (status: ConnectStatus) => {
    if (status === ConnectStatus.Connected) {
      setFetchingConversation(true);
      try {
        const remoteConversations =
          await WKSDK.shared().conversationManager.sync(); // 同步最近会话列表
        setFetchingConversation(false);
        if (remoteConversations && remoteConversations.length > 0) {
          const temp = sortConversations(
            remoteConversations.map(
              (conversation) => new ConversationWrap(conversation)
            )
          );
          batchUpdateConversation(temp);
          setConversationWraps(temp);
          if (firstInitFlag.current === true) {
            firstInitFlag.current = false;
            typeof props.onInitChannel === "function" &&
              props.onInitChannel(temp);
          }
        } else {
          setConversationWraps([]);
        }
      } catch (er) {
        setFetchingConversation(false);
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
      handleSelectChannel(
        conversation.channel,
        new ConversationWrap(conversation)
      );
    } else if (action === ConversationAction.update) {
      // 过期了，不更新这个channel
      if (judgeIsExpireGroupCache(conversation.channel.channelID)) {
        return;
      }
      if (conversation.channel.channelID === latestChannel.current?.channelID) {
        // 避免未读消息在选中时还展示
        conversation.unread = 0;
        conversation.isMentionMe = false;
      }
      const index = latestConversation.current?.findIndex(
        (item) =>
          item.channel.channelID === conversation.channel.channelID &&
          item.channel.channelType === conversation.channel.channelType
      );
      if (index !== undefined && index >= 0) {
        // conversation.reloadIsMentionMe();

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
    //   const temp = [...latestConversation.current]
    //   const idx = latestConversation.current.findIndex(c => c.channel.channelID === channelInfo.channel.channelID);
    //   if(idx >= 0) {
    //     temp[idx].reloadIsMentionMe()
    //     setConversationWraps(temp);
    //   }
    // }
  };

  const lastContent = (conversationWrap: ConversationWrap) => {
    if (!conversationWrap.lastMessage) {
      return;
    }

    let mention: ReactNode | string = "";
    let head: ReactNode | string;
    let content: ReactNode | string;
    const draft = conversationWrap.remoteExtra.draft;
    if (draft && draft !== "") {
      head = draft;
    }

    if (conversationWrap.isMentionMe === true) {
      mention = <span style={{ color: "red" }}>[有人@我]</span>;
    }
    if (conversationWrap.lastMessage) {
      const channelInfo = WKSDK.shared().channelManager.getChannelInfo(
        new Channel(conversationWrap.lastMessage.fromUID, ChannelTypePerson)
      );
      if (channelInfo) {
        head = channelInfo.title + "：";
      } else {
        // 没有就缓存下
        const uid = conversationWrap.lastMessage.fromUID;
        if (judgeIsUserInSyncChannelCache(uid) !== true) {
          setUserInSyncChannelCache(uid, true);
          setPersonChannelCache(conversationWrap.lastMessage.fromUID).then(
            () => {
              setUserInSyncChannelCache(uid, false);
              updateForceUpdateAvatarId();
            }
          );
        }
      }

      content = conversationWrap.lastMessage.content.conversationDigest || "";
      if (conversationWrap.lastMessage.content instanceof CMDContent) {
        if (conversationWrap.lastMessage.content.cmd === "messageRevoke") {
          content = "撤回了一条消息";
        } else {
          // content = "加入了群聊";
          content = "[系统消息]";
        }
      }
    }

    return (
      <span>
        {mention}
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

  const handleSelectChannel = (
    channel: Channel,
    conversation: ConversationWrap
  ) => {
    //  优化一下，有未读消息才clear unread
    if (conversation && conversation.unread && conversation.unread > 0) {
      APIClient.shared.clearUnread(channel);
      clearConversationUnread(channel);
    }

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

  const [goodConversations, setGoodConversations] = useState<
    ConversationWrap[]
  >([]);
  // const [goodGroups, setGoodGroups] = useState<GroupData[]>([]);
  useEffect(() => {
    let filteConversations: ConversationWrap[] = [];
    // let filteGroup: GroupData[] = [];
    if (
      data &&
      data.items instanceof Array &&
      conversationWraps instanceof Array
    ) {
      data.items.forEach((item) => {
        WKSDK.shared().channelManager.setChannleInfoForCache(
          toChannelInfo(item)
        );

        const joinedChannel = conversationWraps.find(
          (con) => con.channel.channelID === item.account
        );
        if (joinedChannel) {
          joinedChannel.total_user = item.total_user;
          filteConversations.push(joinedChannel);
          if (joinedChannel.timestamp === 0) {
            setExpireGroupInCache(joinedChannel.channel.channelID, true);
          }
        }
        //  else {
        //   filteGroup.push(item);
        // }
      });
    }
    // setGoodGroups(filteGroup);
    setGoodConversations(filteConversations);
  }, [data, conversationWraps]);

  return (
    <div className="w-[270px] h-full">
      <div className="group-filter h-[58px] flex items-center justify-between pl-4 pr-4">
        <span>我的群聊</span>
        <CreateGroup />
      </div>
      <div className="group-list">
        {!conversationWraps &&
          Array.from({
            length: 10,
          }).map((_, i) => (
            <Skeleton
              style={{ background: "#555" }}
              key={i + "channel"}
              className="h-[76px]"
            />
          ))}
        {conversationWraps && (
          <>
            {goodConversations.map((item: ConversationWrap) => {
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
                    <div className="group-title flex  justify-between">
                      <div className="flex items-baseline">
                        <div
                          title={item.channelInfo?.title || ""}
                          className="overflow-hidden whitespace-nowrap text-ellipsis max-w-36"
                        >
                          {item.channelInfo?.title || ""}
                        </div>
                        <span className="text-xs ml-1 text-gray-400">
                          ({item.total_user})
                        </span>
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditChannel(item);
                          updateGroupInfoModal.modal.open();
                        }}
                        className="oper-icons"
                      >
                        <JknIcon
                          name="settings_shallow"
                          className="rounded-none"
                        />
                      </div>
                    </div>
                    <div className="group-last-msg flex justify-between">
                      <div className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis max-w-24 text-xs">
                        {lastContent(item)}
                      </div>
                      <div className="max-w-30 text-xs">
                        {item.timestampString || ""}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {/* {goodGroups.map((item: GroupData) => {
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
                    <div
                      title={item.name || ""}
                      className="group-title max-w-200[px] overflow-hidden whitespace-nowrap text-ellipsis"
                    >
                      {item.name || ""}
                    </div>
                    <div className="group-last-msg flex justify-between">
                      <div className="flex-1 overflow-hidden whitespace-nowrap text-ellipsis max-w-24 text-xs">
                        一起加入群组吧
                      </div>
                      <div className="max-w-24 text-xs"></div>
                    </div>
                  </div>
                </div>
              );
            })} */}
          </>
        )}
      </div>
      {updateGroupInfoModal.context}
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
          .group-title {
            height: 26px;
          }
          .group-title .oper-icons {
            display: none;
          }
          .group-title:hover .oper-icons {
            display: block;
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
