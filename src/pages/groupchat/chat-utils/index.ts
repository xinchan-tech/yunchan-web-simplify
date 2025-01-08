import WKSDK, {
  Channel,
  ChannelTypePerson,
  Message,
  ChannelInfo,
} from "wukongimjssdk";
import { ConversationWrap } from "../ConversationWrap";
import { getChatNameAndAvatar } from "@/api";

export const lastContent = (conversationWrap: ConversationWrap) => {
  if (!conversationWrap.lastMessage) {
    return;
  }
  const draft = conversationWrap.remoteExtra.draft;
  if (draft && draft !== "") {
    return draft;
  }
};

// 缓存单聊头像名称信息
export const setPersonChannelCache = (fromUID: string) => {
  return new Promise<{avatar: string, name: string}>((resolve, reject) => {
    const params = {
      type: "1",
      id: fromUID,
    };
    getChatNameAndAvatar(params).then((data) => {
      if (data) {
        WKSDK.shared().channelManager.setChannleInfoForCache(
          userToChannelInfo(data, fromUID)
        );
      }
      resolve(data);
    });
  });
};

export const userToChannelInfo = (
  data: {
    name: string;
    avatar: string;
  },
  fromUID: string
): ChannelInfo => {
  let channelInfo = new ChannelInfo();
  channelInfo.channel = new Channel(fromUID, ChannelTypePerson);
  channelInfo.title = data.name;
  channelInfo.mute = false;
  channelInfo.top = false;
  channelInfo.online = false;

  channelInfo.logo = data.avatar;

  return channelInfo;
};
