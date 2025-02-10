import {
  CMDContent,
  Channel,
  ChannelTypePerson,
  Conversation,
  Message,
  SyncOptions,
  WKSDK,
} from "wukongimjssdk";
import { Convert } from "./convert";

import request from "@/utils/request";
import cacheManager from "../messageCache";

export class CMDType {
  static CMDTypeClearUnread = "clearUnread";
}

export const EXIT = "EXIT";

export default class APIClient {
  isFetchingMessage: boolean;
  lastMessageFetchChannel: string;
  private constructor() {
    this.isFetchingMessage = false;
    this.lastMessageFetchChannel = "";
  }
  public static shared = new APIClient();

  // 同步频道的消息
  // 仅仅做演示，所以直接调用的WuKongIM的接口，实际项目中，建议调用自己的后台接口，
  // 然后后台接口再调用WuKongIM的接口，这样自己的后台可以返回一些自己的业务数据填充到Message.remoteExtra中
  syncMessages = async (channel: Channel, opts: SyncOptions) => {
    let resultMessages = new Array<Message>();
    try {
      const resp = await request.post("/message/sync", {
        login_uid: WKSDK.shared().config.uid,
        channel_id: channel.channelID,
        channel_type: channel.channelType,
        start_message_seq: opts.startMessageSeq,
        end_message_seq: opts.endMessageSeq,
        pull_mode: opts.pullMode,
        limit: opts.limit || 20,
      });

      const messageList = resp && resp.data && resp.data["messages"];
      if (messageList) {
        messageList.forEach((msg: any) => {
          const message = Convert.toMessage(msg);
          resultMessages.push(message);
          // 存入indexDB
          cacheManager.cacheMessage(msg);
        });
      }
      return resultMessages;
    } catch (er) {
      throw new Error("退群了");
    }
  };

  // 同步会话列表
  // 仅仅做演示，所以直接调用的WuKongIM的接口，实际项目中，建议调用自己的后台接口，
  // 然后后台接口再调用WuKongIM的接口，这样自己的后台可以返回一些自己的业务数据填充到Conversation.extra中
  syncConversations = async () => {
    let resultConversations = new Array<Conversation>();
    const resp = await request.post("/conversation/sync", {
      uid: WKSDK.shared().config.uid,
      msg_count: 20,
    });
    const conversationList = resp.data;
    if (conversationList) {
      conversationList.forEach((v: any) => {
        const conversation = Convert.toConversation(v);
        resultConversations.push(conversation);
      });
    }
    return resultConversations;
  };
  clearUnread = async (channel: Channel) => {
    return request
      .post("/channel/setUnread", {
        uid: WKSDK.shared().config.uid,
        channel_id: channel.channelID,
        channel_type: channel.channelType,
        unread: 0,
      })
      .then((res) => {
        // 这里uid指定的是自己，意味着如果是多端登录，其他端也会收到这条消息
        // this.sendCMD(new Channel(WKSDK.shared().config.uid!,ChannelTypePerson),CMDType.CMDTypeClearUnread,channel)
      })
      .catch((err) => {
        console.log(err);
      });
  };
}

export class RequestConfig {
  param?: any;
  data?: any;
  resp?: () => APIResp;
}

export interface APIResp {
  fill(data: any): void;
}
