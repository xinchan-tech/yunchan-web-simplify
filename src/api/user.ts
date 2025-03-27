import request from '@/utils/request'

export type UserResult = {
  alarm_email?: string
  /**
   * 已授权的指标列表
   */
  authorized: Authorized[]
  /**
   * 头像
   */
  avatar: string
  /**
   * 邮箱
   */
  email?: string
  grade?: string
  id: string
  is_kefu: boolean
  /**
   * 手机号
   */
  mobile: string
  /**
   * 账户
   */
  money: string
  /**
   * 真实姓名
   */
  realname: string
  /**
   * 教师信息
   */
  teacher: Teacher
  /**
   * 未授权的指标列表
   */
  unauthorized: Unauthorized[]
  user_type: string
  /**
   * 用户名
   */
  username: string

  permission: string
  share_url: string
  re_code: string
  in_channel_status: '0' | '1'
  show_invite: 0 | 1
  total_inv: number
  total_points: number
  transaction: number
  inv_click: number
  points: number
  flow_num: number
  buy_inchannel_status: number

  user_grade: string[]
}

export type Authorized = {
  /**
   * 封面图
   */
  cover?: string
  /**
   * 过期时间
   */
  expire_time?: string
  /**
   * 套餐id
   */
  id: string
  /**
   * 套餐名称
   */
  name: string
}

/**
 * 教师信息
 */
export type Teacher = {
  brief: string
  grade_ids: string
  name: string
}

export type Unauthorized = {
  cover: string
  expire_time: string
  id: string
  name: string
}

type GetUserParams = {
  extends: ('teacher' | 'authorized' | 'kefu')[]
}

export const getUser = (params: GetUserParams) => {
  return request.get<UserResult>('/user', { params: params }).then(r => r.data)
}
getUser.cacheKey = 'user:info'

type UpdateUserParams = {
  avatar?: string
  nickname?: string
  alarm_email?: string
}

export const updateUser = (params: UpdateUserParams) => {
  return request
    .post('/user/update', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    .then(r => r.data)
}

type OssResult = {
  credentials: {
    accessKeyId: string
    accessKeySecret: string
    expiration: string
    securityToken: string
  }
  bucket: string
  endpoint: string
}

export const getAliOssToken = () => {
  return request.get<OssResult>('/upload/getOssToken').then(r => r.data)
}

/**
 * 绑定邀请码
 */
export const bindInviteCode = (code: string, cid?: string) => {
  const form = new FormData()
  form.append('inv_code', code)
  if (cid) {
    form.append('cid', cid)
  }
  return request.post('/user/inv/bind', form).then(r => r.data)
}
