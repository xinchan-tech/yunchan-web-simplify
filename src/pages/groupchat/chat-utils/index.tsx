import WKSDK, {
  Channel,
  ChannelTypePerson,
  Message,
  ChannelInfo,
  CMDContent,
} from "wukongimjssdk";

import { ConversationWrap } from "../ConversationWrap";
import { getChatNameAndAvatar } from "@/api";
import { ReactNode } from "react";

export const lastContent = (conversationWrap: ConversationWrap) => {
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

  // if (conversationWrap.lastMessage.content.cmd === "messageRevoke") {
  //   const fromUser = WKSDK.shared().channelManager.getChannelInfo(
  //     new Channel(conversationWrap.lastMessage.fromUID, ChannelTypePerson)
  //   );

  //   return (fromUser?.title || "") + "撤回了一条消息";
  // }
  if (conversationWrap.lastMessage) {
    const channelInfo = WKSDK.shared().channelManager.getChannelInfo(
      new Channel(conversationWrap.lastMessage.fromUID, ChannelTypePerson)
    );
    if (channelInfo) {
      head = channelInfo.title + "：";
    } else {
      // 没有就缓存下
      // setPersonChannelCache(conversationWrap.lastMessage.fromUID)
    }

    content = conversationWrap.lastMessage.content.conversationDigest || "";
    if (conversationWrap.lastMessage.content instanceof CMDContent) {
      content = "[系统消息]";
    }
  }

  return (
    <span>
      {head}
      {content}
    </span>
  );
};

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
