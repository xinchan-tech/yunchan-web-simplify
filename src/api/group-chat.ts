import request from '@/utils/request'

export type getGroupChannelsParams = {
  type: '0' | '1' | '2' | '3'
  keywords?: string
  page?: string
  'order[price]'?: 'ASC' | 'DESC'
  re_code?: string
}

export type GroupChannelItem = {
  id: string
  account: string
  avatar: string
  name: string
  price: string
  brief: string
  tags: string
  total_user: string
  in_channel: number
  products: {
    channel_id: string
    price: string
    product_sn: string
    type: string
    unit: string
  }[]
}

export type GroupChannelsResult = PageResult<GroupChannelItem>

export const getGroupChannels = async (params: getGroupChannelsParams) => {
  const r = await request
    .get<GroupChannelsResult>('/channels', { params: { ...params, limit: 50 } })
    .then(r => r.data.items)
  return r
}

getGroupChannels.cacheKey = 'groupChannels:channels'

type SyncRecentConversationParams = {
  uid: string
  msg_count: number
}

type SyncRecentConversationResult = {
  channel_id: string
  channel_type: number
  last_client_msg_no: string
  last_msg_seq: number
  offset_msg_seq: number
  readed_to_msg_seq: number
  recents: {
    header: {
      no_persist: number
      red_dot: number
      sync_once: number
    }
    setting: number
    message_id: number
    message_idstr: string
    client_msg_no: string
    client_seq?: number
    message_seq: number
    from_uid: string
    channel_id: string
    channel_type: number
    expire: number
    timestamp: number
    payload: string
    revoke?: number
    message_extra?: string
    stream_no?: string
  }[]
  timestamp: number
  unread: number
  version: number
}

export const syncRecentConversation = async (params: SyncRecentConversationParams) => {
  const r = await request.post<SyncRecentConversationResult[]>('/conversations/sync', params).then(r => r.data)
  return r
}

syncRecentConversation.cacheKey = 'groupChannels:sync'

export type GroupMemberResult = PageResult<{
  type: string
  uid: string
  forbidden: string
  username: string
  realname: string
  avatar: string
}>
export const getGroupMembersService = async (groupId: string, limit?: number) => {
  const r = await request
    .get<GroupMemberResult>(`/channel/${groupId}/users`, {
      params: {
        limit: limit || 20
      }
    })
    .then(r => r.data)
  return r
}

getGroupMembersService.key = 'groupChannels:getGroupMembers'

export const getChatNameAndAvatar = async (params: {
  type: string
  id: string
}) => {
  const resp = await request.get<{ name: string; avatar: string }>('/im/avatars', { params }).then(r => r.data)
  return resp
}

export const revokeMessageService = async (params: {
  msg_id: number | string
}) => {
  const r = await request
    .post('/message/revoke', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .then(r => r.data)
  return r
}
// 查询群资料
export interface GroupDetailData {
  /**
   * 群账号
   */
  account: string
  /**
   * 群头像
   */
  avatar: string
  /**
   * 群简介
   */
  brief: string
  /**
   * 群id
   */
  id: string
  /**
   * 最大人数
   */
  max_num: string
  /**
   * 群名称
   */
  name: string
  /**
   * 群通知
   */
  notice: string
  /**
   * 群标签
   */
  tags: string
  /**
   * 当前成员数量
   */
  total_user: string
  /**
   * 创建者
   */
  user: User
  editable: boolean
  products: Array<{
    product_sn: string
    price: string
    unit: string
    title: string
    type: string
  }>
  chat_type: '0' | '1' | '2'
  blacklist: Array<{ uid: string; realname: string }>
  owner?: string
}

/**
 * 创建者
 */
export interface User {
  avatar: null
  id: string
  username: string
  [property: string]: any
}
export const getGroupDetailService = async (id: string) => {
  const r = await request.get<GroupDetailData>(`/channel/${id}`).then(r => r.data)
  return r
}

getGroupDetailService.key = 'groupChannels:getDetail'

// 加入群
export const joinGroupService = async (id: string, params?: { product_sn: string; payment_type: string }) => {
  const r = await request
    .post(`/channel/${id}/user`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .then(r => r.data)
  return r
}

// 申请建群

export interface createGroupRequest {
  avatar: string
  brief: string
  grade: string
  id: string
  max_num: string
  name: string
  notice: string
  price_tag: PriceTag[]
  tags: string
}

export interface PriceTag {
  price: string
  unit: string
}

export const applyCreateGroupService = async (params: createGroupRequest) => {
  const r = request.post('/chat/apply/save', params).then(res => res)
  return r
}

// 禁言
export type forbiddenServicePyload = {
  channelId: string
  uids: string[]
  forbidden: string
}
export const setMemberForbiddenService = async (data: forbiddenServicePyload) => {
  const resp = await request
    .post<{ status: number; msg: string }>(
      `/channel/${data.channelId}/forbidden`,
      {
        uids: data.uids,
        forbidden: data.forbidden
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )
    .then(r => r)

  return resp
}

// 管理员设置
export type setManagerServicePayload = {
  username: string
  type: '0' | '1'
  channelId: string
}

export const setGroupManagerService = async (data: setManagerServicePayload) => {
  const resp = await request
    .post<{ status: number; msg: string }>(
      `/channel/${data.channelId}/user/set`,
      {
        username: data.username,
        type: data.type
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    )
    .then(r => r)

  return resp
}

export type ImgLoginPayload = {
  device_flag: string
  device_level: string
}

export const loginImService = async () => {
  const params: ImgLoginPayload = {
    device_flag: '5',
    device_level: '0'
  }
  const r = await request.post('/im/login', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  return r
}

// 编辑群
export type EditGroupPayload = {
  chat_type?: '0' | '1' | '2'
  notice?: string
  tags?: string
  name?: string
  brief?: string
  avatar?: string
  account: string
}
export const editGroupService = async (params: EditGroupPayload) => {
  const r = await request.post(`/channel/${params.account}/edit`, params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  })
  return r
}

// 支付状态更新
export const loopUpdatePaymentStatus = async (pay_sn: string) => {
  const resp = await request.get('/order/pay/payStatus', { params: { pay_sn } }).then(r => r.data)
  return resp
}

// 查询建群记录
export interface CreateGroupRecord {
  id: string
  name: string
  status: string
  account: string
  grade: string
  tags: string
  price: string
  unit?: string | null
  brief: string
  notice: string
  reject_reason?: string | null
  max_num: string
  create_time: string
  [key: string]: any
}
export const getCreateGroupHistoryService = async () => {
  const r = await request.get<PageResult<CreateGroupRecord>>('/chat/apply/index').then(r => r.data)
  return r
}

getCreateGroupHistoryService.key = 'groupChannels:createHistory'

export type opinionsRequestParam = {
  /**
   * 关键词
   */
  keyword?: string
  /**
   * 每页显示数量
   */
  limit?: string
  /**
   * 0：所有的观点，1：我关注的观点，2：我的观点
   */
  my?: string
  /**
   * 页码
   */
  page?: string
  /**
   * 0观点，1图文直播
   */
  type?: string
  /**
   * 用户id（教师关联的uid，type=1才有效）
   */
  uid?: string
  [property: string]: any
}

export type opinionItem = {
  /**
   * 评论数
   */
  comment_count: string
  /**
   * 内容
   */
  content: string
  /**
   * 发布时间
   */
  create_time: string
  /**
   * 观点id
   */
  id: string
  is_care: boolean
  /**
   * 是否点赞
   */
  is_praise: boolean
  /**
   * 点赞数
   */
  praise_count: string
  urls: string[]
  user: User
  [property: string]: any
}

export const getLiveOpnions = async (params: opinionsRequestParam) => {
  const r = await request.get<PageResult<opinionItem>>('/opinions', { params }).then(r => r.data.items)
  return r
}

export type sendOpinionRequestPrams = {
  /**
   * 发布的内容
   */
  content?: string
  /**
   * 0观点，1图文直播
   */
  type: number
  urls?: string[]
}
export const sendLiveOpinions = async (params: sendOpinionRequestPrams) => {
  const r = await request
    .post('/opinion/save', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .then(res => res)
  return r
}

export const testExitGroup = async (channelId: string) => {
  const r = await request.post(`/channel/${channelId}/out`).then(r => r)
  return r
}

export const getPaymentTypesService = async () => {
  const r = await request
    .get<
      Array<{
        logo: string
        type: string
        name: string
      }>
    >('/payment/types')
    .then(r => r.data)
  return r
}

getPaymentTypesService.key = 'getPaymentTypesService'

//邀请码加群
export const joinGroupByInviteCode = async (params: {
  channel_id: string
  type: '1' | '2'
}) => {
  const res = await request
    .post('/channel/in', params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    })
    .then(r => r)
  return res
}
