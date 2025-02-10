import {
  Channel,
  ChannelInfo,
  ChannelTypeGroup,
  ChannelTypePerson,
  SyncOptions,
  WKSDK,
  Conversation,
  Message,
  MessageTask,
  Subscriber,
  PullMode,
} from "wukongimjssdk";

import { MediaMessageUploadTask } from "./task";
import APIClient, { EXIT } from "./APIClient";
import {
  syncRecentConversation,
  getGroupMembersService,
  GroupMemberResult,
} from "@/api";
import { Convert } from "./convert";
import request from "@/utils/request";
import UploadUtil from "./uploadUtil";
import { userToChannelInfo } from "../chat-utils";
import cacheManager, { LocalCacheManager } from "../messageCache";

LocalCacheManager.page = 1;

const getMessageFromCache = async (channel: Channel, opts: SyncOptions) => {
  const cacheParams = {
    limit: opts.limit,
    mode: opts.pullMode,
    start: opts.startMessageSeq,
    end: opts.endMessageSeq,
  };
  let resultMessages = await cacheManager.getMessages(
    channel.channelID,
    LocalCacheManager.page,
    cacheParams
  );
  if (resultMessages instanceof Array && resultMessages.length > 0) {
    let res = resultMessages.map((msg) => {
      return Convert.toMessage(msg);
    });
    return res;
  } else {
    return [];
  }
};

export function initDataSource() {
  // 同步自己业务端的频道消息列表
  // WKSDK.shared().config.deviceFlag = 0;
  WKSDK.shared().config.provider.syncMessagesCallback = async (
    channel: Channel,
    opts: {
      startMessageSeq: number;
      endMessageSeq: number;
      limit: number;
      pullMode: PullMode;
      remoteJump?: boolean;
    }
  ) => {
    let result = [];

    result = await getMessageFromCache(channel, opts);
    // 跨页定位时，要判断缓存返回的list长度是否和入参的差值相同
    let isNavigate = false;
    if (opts.startMessageSeq > 0 && opts.endMessageSeq > 0) {
      const distance = Math.abs(opts.startMessageSeq - opts.endMessageSeq);
      if (result.length !== distance) {
        isNavigate = true;
      }
    }
    if (isNavigate === true) {
      result = await APIClient.shared.syncMessages(channel, opts);
      return result;
    }
    if (result.length === 0) {
      try {
        result = await APIClient.shared.syncMessages(channel, opts);
        return result;
      } catch (e) {
        opts.endMessageSeq = -1;
        opts.startMessageSeq = -1;
        return await getMessageFromCache(channel, opts);
      }
    }
    return result;
  };

  // 同步自己业务端的最近会话列表
  WKSDK.shared().config.provider.syncConversationsCallback = async () => {
    // const res = await APIClient.shared.syncConversations()

    let resultConversations = new Array<Conversation>();
    const resp = await syncRecentConversation({
      uid: WKSDK.shared().config.uid,
      msg_count: 20,
    });
    const conversationList = resp;
    if (conversationList) {
      conversationList.forEach((v: any) => {
        const conversation = Convert.toConversation(v);
        resultConversations.push(conversation);
      });
    }

    console.log(resultConversations, "resultConversations");

    return resultConversations;
  };

  // 获取频道信息
  // UI层可以通过const channelInfo = WKSDK.shared().channelManager.getChannelInfo(channel)获取缓存中的频道信息
  // 如果缓存中没有频道信息，调用 WKSDK.shared().channelManager.fetchChannelInfo(channel) 将会触发此回调，然后获取到channelInfo放入缓存
  WKSDK.shared().config.provider.channelInfoCallback = async (
    channel: Channel
  ) => {
    let params = {
      type: "1",
      id: channel.channelID,
    };
    if (channel.channelType === ChannelTypeGroup) {
      params.type = "2";
    }
    const resp = await request.get<{ name: string; avatar: string }>(
      "/im/avatars",
      { params }
    );

    // 这里仅做演示，实际应该是请求自己业务端的接口，然后返回自己业务端的频道信息，然后填充ChannelInfo,这样在UI的各处就可以很容易的获取到频道的业务信息
    if (channel.channelType === ChannelTypePerson) {
      // 这里调用你的业务接口获取个人信息
      const channelInfo = new ChannelInfo();
      channelInfo.title = resp.data?.name || channel.channelID; // 个人名字
      channelInfo.logo = resp.data?.avatar; // 个人头像

      channelInfo.mute = false; // 是否免打扰
      channelInfo.top = false; // 是否置顶
      channelInfo.orgData = {}; // 自己独有的业务数据可以放到这里
      channelInfo.online = false; // 是否在线
      channelInfo.lastOffline = 0; // 最后离线时间
      channelInfo.channel = channel;
      return channelInfo;
    }

    // 群频道，这里调用你的业务接口获取群信息，然后填充ChannelInfo
    const channelInfo = new ChannelInfo();
    channelInfo.title = resp.data?.name || channel.channelID; // 群名字
    channelInfo.logo = resp.data?.avatar; //群头像
    channelInfo.mute = false; // 是否免打扰
    channelInfo.top = false; // 是否置顶
    channelInfo.orgData = {}; // 自己独有的业务数据可以放到这里
    channelInfo.channel = channel;
    return channelInfo;
  };
  // 如果是群频道，可以实现这个方法，调用 WKSDK.shared().channelManager.syncSubscribes(channel) 方法将会触发此回调
  WKSDK.shared().config.provider.syncSubscribersCallback = async (
    channel: Channel,
    limit?: number
  ): Promise<Array<Subscriber>> => {
    let resp: GroupMemberResult;
    let members: Subscriber[] = [];
    try {
      // if (subscriberCache.has(channel.channelID)) {
      //   members = subscriberCache.get(channel.channelID) || [];
      // } else {

      // }
      resp = await getGroupMembersService(channel.channelID, limit || 100);
      if (resp.items instanceof Array && resp.items.length > 0) {
        resp.items.forEach((man) => {
          let member = new Subscriber();
          member.uid = man.username;
          member.name = man.realname;
          member.orgData = man;
          member.avatar = man.avatar;

          // 在这里缓存群成员的头像昵称
          const data = {
            name: man.realname,
            avatar: man.avatar,
          };
          WKSDK.shared().channelManager.setChannleInfoForCache(
            userToChannelInfo(data, man.username)
          );

          members.push(member);
        });
      }
      // subscriberCache.set(channel.channelID, members);
    } catch (err) {
      console.error(err);
    }

    return members;
  };

  // 如果涉及到消息包含附件（多媒体）可以实现这个方法，sdk将调用此方法进行附件上传
  //  WKSDK.shared().config.provider.messageUploadTask

  // 消息上传任务
  WKSDK.shared().config.provider.messageUploadTaskCallback = (
    message: Message
  ): MessageTask => {
    return new MediaMessageUploadTask(message);
  };

  UploadUtil.shared.init();
}
