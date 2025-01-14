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
    .get<GroupChannelsResult>("/channels", { params })
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
export const getGroupDetailService = async (id: string) => {
  const r = await request.get(`/channel/${id}`).then((r) => r.data);
  return r;
};

// 加入群
export const joinGroupService = async (
  id: string,
  params?: { product_sn: string }
) => {
  const r = await request
    .post(`/channel/${id}/user`, params )
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

export const applyCreateGroupService = async (params:createGroupRequest) => {
  const r = request.post('/chat/apply/save', params).then(res => res);
  return r;
}