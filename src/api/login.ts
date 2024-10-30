import request from "@/utils/request"

type LoginParams = {
  mobile: string
  password: string
}

type LoginResult = {
  token: string
  user: {
    id: string
    user_type: string
    username: string
    mobile: string
    realname: string
    email: string | null
    money: string
    avatar: string
    teacher: {
      name: string
      grade_ids: string
      brief: string
    }
    sale: string | null
    kefu: string | null
    user_grade: string[]
  }
}

export const login = (params: LoginParams) => {
  return request.post<LoginResult>('/login', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded'} }).then(r => r.data)
}

export const logout = (platform?: 'window' | 'macos' | 'android' | 'linux') => {
  const form = new FormData()
  form.append('platform', platform || 'window')
  return request.post('/user/logOut', form).then(r => r.data)
}

export const getConfig = () => {
  return request.get('/init/get').then(r => r.data)
}

type getUsTimeResult = {
     /**
     * 美国时间
     */
     date: string
     /**
      * false：休息，0开盘前，1开盘中，2开盘后
      */
     open_status: boolean
     /**
      * 开盘时段列表
      */
     stock_open: {
      active: number
      name: string
     }[]
     /**
      * 美国时间戳
      */
     time: number
}

/**
 * 获取美国纽约时间
 */
export const getUsTime = () => {
  return request.get<getUsTimeResult>('/index/us/info').then(r => r.data)
}