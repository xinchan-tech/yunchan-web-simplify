import request from '@/utils/request'
import { User } from "./im"



export const getChatNameAndAvatar = async (params: {
  type: string
  id: string
}) => {
  const resp = await request.get<{ name: string; avatar: string }>('/im/avatars', { params }).then(r => r.data)
  return resp
}
getChatNameAndAvatar.cacheKey = 'groupChannels:getChatNameAndAvatar'



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
