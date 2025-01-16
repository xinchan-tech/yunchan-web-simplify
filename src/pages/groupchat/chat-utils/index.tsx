import WKSDK, {
  Channel,
  ChannelTypePerson,
  Message,
  ChannelInfo,
} from "wukongimjssdk";

import { getChatNameAndAvatar } from "@/api";

// 缓存单聊头像名称信息
export const setPersonChannelCache = (fromUID: string) => {
  return new Promise<{ avatar: string; name: string }>((resolve, reject) => {
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

export class MentionModel {
  all: boolean = false;
  uids?: Array<string>;
}

export const sortMessages = (messages: Message[]) => {
  let result = [...messages];
  for (let i = 0; i < result.length; i++) {
    const msg = result[i];
    if (msg.content.cmd === "messageRevoke") {
      if (msg.content.param && msg.content.param.message_id) {
        let msgId: any = BigInt(msg.content.param?.message_id);
        msgId = msgId.toString();

        // const temp = result.splice(i, 1);
        // 目标消息位置
        let targetMessagePos = result.findIndex((m) => m.messageID === msgId);
        // revoke标志,到时渲染成 xxx 撤回了一条消息
        if (result[targetMessagePos]) {
          result[targetMessagePos].content.revoke = true;
          result[targetMessagePos].content.revoker = msg.fromUID;
          // result.splice(targetMessagePos, 0, temp[0]);
        }
      }
    }
  }
  return result;
};
