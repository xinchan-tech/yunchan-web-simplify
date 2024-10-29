import request from '@/utils/request'

export type UserResult = {
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
  email: null
  grade: null
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
  id?: string
  /**
   * 套餐名称
   */
  name?: string
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

type UpdateUserParams = {
  avatar?: string
  nickname?: string
}

export const updateUser = (params: UpdateUserParams) => {
  return request.post('/user/update', params).then(r => r.data)
}
