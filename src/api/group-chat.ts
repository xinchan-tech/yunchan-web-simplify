import request from "@/utils/request";

type getGroupChannelsParams = {
  type: "0" | "1" | "2" | "3";
  keywords?: string;
  page?: string;
  "order[price]"?: "ASC" | "DESC";
};

export type GroupChannelItem = {
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

type GroupChannelsResult = PageResult<GroupChannelItem>;

export const getGroupChannels = async (params: getGroupChannelsParams) => {
  const r = await request
    .get<GroupChannelsResult>("/channels", { params: { ...params, limit: 30 } })
    .then((r) => r.data);
  return r;
};

getGroupChannels.cacheKey = "groupChannels:channels";

export const syncRecentConversation = async (params) => {
  const r = await request
    .post("/conversations/sync", params)
    .then((r) => r.data);
  return r;
};

syncRecentConversation.cacheKey = "groupChannels:sync";

export type GroupMemberResult = PageResult<{
  type: string;
  uid: string;
  forbidden: string;
  username: string;
  realname: string;
  avatar: string;
}>;
export const getGroupMembersService = async (groupId: string) => {
  const r = await request
    .get<GroupMemberResult>(`/channel/${groupId}/users`)
    .then((r) => r.data);
  return r;
};

getGroupMembersService.key = "groupChannels:getGroupMembers";

export const getChatNameAndAvatar = async (params: {
  type: string;
  id: string;
}) => {
  const resp = await request
    .get<{ name: string; avatar: string }>("/im/avatars", { params })
    .then((r) => r.data);
  return resp;
};

export const revokeMessageService = async (params: {
  msg_id: number | string;
}) => {
  const r = await request
    .post("/message/revoke", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    .then((r) => r.data);
  return r;
};
// 查询群资料
export interface GroupDetailData {
  /**
   * 群账号
   */
  account: string;
  /**
   * 群头像
   */
  avatar: string;
  /**
   * 群简介
   */
  brief: string;
  /**
   * 群id
   */
  id: string;
  /**
   * 最大人数
   */
  max_num: string;
  /**
   * 群名称
   */
  name: string;
  /**
   * 群通知
   */
  notice: string;
  /**
   * 群标签
   */
  tags: string;
  /**
   * 当前成员数量
   */
  total_user: string;
  /**
   * 创建者
   */
  user: User;
  editable: boolean;
  products: Array<{
    product_sn: string;
    price: string;
    unit: string;
    title: string;
  }>;
  chat_type: "0" | "1" | "2";
  blacklist: Array<{ uid: string; realname: string }>;
}

/**
 * 创建者
 */
export interface User {
  avatar: null;
  id: string;
  username: string;
  [property: string]: any;
}
export const getGroupDetailService = async (id: string) => {
  const r = await request
    .get<GroupDetailData>(`/channel/${id}`)
    .then((r) => r.data);
  return r;
};

getGroupDetailService.key = "groupChannels:getDetail";

// 加入群
export const joinGroupService = async (
  id: string,
  params?: { product_sn: string; payment_type: string }
) => {
  const r = await request
    .post(`/channel/${id}/user`, params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    .then((r) => r.data);
  return r;
};

// 申请建群

export interface createGroupRequest {
  avatar: string;
  brief: string;
  grade: string;
  id: string;
  max_num: string;
  name: string;
  notice: string;
  price_tag: PriceTag[];
  tags: string;
}

export interface PriceTag {
  price: string;
  unit: string;
}

export const applyCreateGroupService = async (params: createGroupRequest) => {
  const r = request.post("/chat/apply/save", params).then((res) => res);
  return r;
};

// 禁言
export type forbiddenServicePyload = {
  channelId: string;
  uids: string[];
  forbidden: string;
};
export const setMemberForbiddenService = async (
  data: forbiddenServicePyload
) => {
  const resp = await request
    .post<{ status: number; msg: string }>(
      `/channel/${data.channelId}/forbidden`,
      {
        uids: data.uids,
        forbidden: data.forbidden,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )
    .then((r) => r);

  return resp;
};

// 管理员设置
export type setManagerServicePayload = {
  username: string;
  type: "0" | "1";
  channelId: string;
};

export const setGroupManagerService = async (
  data: setManagerServicePayload
) => {
  const resp = await request
    .post<{ status: number; msg: string }>(
      `/channel/${data.channelId}/user/set`,
      {
        username: data.username,
        type: data.type,
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    )
    .then((r) => r);

  return resp;
};

export type ImgLoginPayload = {
  device_flag: string;
  device_level: string;
};

export const loginImService = async (params: ImgLoginPayload) => {
  const r = await request.post("/im/login", params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return r;
};

// 编辑群
export type EditGroupPayload = {
  chat_type?: "0" | "1" | "2";
  notice?: string;
  tags?: string;
  name?: string;
  brief?: string;
  avatar?: string;
  account: string;
};
export const editGroupService = async (params: EditGroupPayload) => {
  const r = await request.post(`/channel/${params.account}/edit`, params, {
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
  return r;
};

// 支付状态更新
export const loopUpdatePaymentStatus = async (pay_sn: string) => {
  const resp = await request
    .get("/order/pay/payStatus", { params: { pay_sn } })
    .then((r) => r.data);
  return resp;
};

// 查询建群记录
export interface CreateGroupRecord {
  id: string;
  name: string;
  status: string;
  account: string;
  grade: string;
  tags: string;
  price: string;
  unit?: string | null;
  brief: string;
  notice: string;
  reject_reason?: string | null;
  max_num: string;
  create_time: string;
  [key: string]: any;
}
export const getCreateGroupHistoryService = async () => {
  const r = await request
    .get<PageResult<CreateGroupRecord>>("/chat/apply/index")
    .then((r) => r.data);
  return r;
};

getCreateGroupHistoryService.key = "groupChannels:createHistory";

export type opinionsRequestParam = {
  /**
   * 关键词
   */
  keyword?: string;
  /**
   * 每页显示数量
   */
  limit?: string;
  /**
   * 0：所有的观点，1：我关注的观点，2：我的观点
   */
  my?: string;
  /**
   * 页码
   */
  page?: string;
  /**
   * 0观点，1图文直播
   */
  type: string;
  /**
   * 用户id（教师关联的uid，type=1才有效）
   */
  uid?: string;
  [property: string]: any;
};

export type opinionItem = {
  /**
   * 评论数
   */
  comment_count: string;
  /**
   * 内容
   */
  content: string;
  /**
   * 发布时间
   */
  create_time: string;
  /**
   * 观点id
   */
  id: string;
  is_care: boolean;
  /**
   * 是否点赞
   */
  is_praise: boolean;
  /**
   * 点赞数
   */
  praise_count: string;
  urls: string[];
  user: User;
  [property: string]: any;
};

export const getLiveOpnions = async (params: opinionsRequestParam) => {
  const r = await request
    .get<PageResult<opinionItem>>("/opinions", { params })
    .then((r) => r.data);
  return r;
};

export type sendOpinionRequestPrams = {
  /**
   * 发布的内容
   */
  content?: string;
  /**
   * 0观点，1图文直播
   */
  type: number;
  urls?: string[];
};
export const sendLiveOpinions = async (params: sendOpinionRequestPrams) => {
  const r = await request
    .post("/opinion/save", params, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    })
    .then((res) => res);
};
