import request from '@/utils/request'
import WKSDK, { type Channel } from 'wukongimjssdk'

export type getChatChannelsParams = {
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

export const getChatChannels = async (params: getChatChannelsParams) => {
  const r = await request
    .get<GroupChannelsResult>('/channels', { params: { ...params, limit: 50 } })
    .then(r => r.data.items)
  return r
}

getChatChannels.cacheKey = 'groupChannels:channels'

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

export const cleanUnreadConversation = (channel: Channel) => {
  return request
    .post('/channel/setUnread', {
      uid: WKSDK.shared().config.uid,
      channel_id: channel.channelID,
      channel_type: channel.channelType,
      unread: 0
    })
    .then(response => response.data)
}

interface SyncChannelMessageParams {
  channelId: string
  channelType: number
  startMessageSeq: number
  endMessageSeq: number
  pullMode: number
  limit?: number
}

export const syncChannelMessages = (opts: SyncChannelMessageParams) => {
  const params = {
    login_uid: WKSDK.shared().config.uid,
    channel_id: opts.channelId,
    channel_type: opts.channelType,
    start_message_seq: opts.startMessageSeq,
    end_message_seq: opts.endMessageSeq,
    pull_mode: opts.pullMode,
    limit: opts.limit || 20
  }

  return request.post('/message/sync', params).then(r => r.data.messages)
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
export const getChannelDetail = async (id: string) => {
  const r = await request.get<GroupDetailData>(`/channel/${id}`).then(r => r.data)
  return r
}

getChannelDetail.cacheKey = 'groupChannels:getDetail'

export type GroupMemberResult = PageResult<{
  type: string
  uid: string
  forbidden: string
  username: string
  realname: string
  avatar: string
}>
export const getChannelMembers = async (groupId: string, limit?: number) => {
  const r = await request
    .get<GroupMemberResult>(`/channel/${groupId}/users`, {
      params: {
        limit: limit || 20
      }
    })
    .then(r => r.data)
  return r
}

getChannelMembers.cacheKey = 'groupChannels:getGroupMembers'


// 管理员设置
export type setManagerServicePayload = {
  username: string
  type: '0' | '1'
  channelId: string
}

export const setChannelManager = async (data: setManagerServicePayload) => {
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



// 禁言
export type channelForbiddenParams = {
  channelId: string
  uids: string[]
  forbidden: string
}
export const setMemberForbidden = async (data: channelForbiddenParams) => {
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
