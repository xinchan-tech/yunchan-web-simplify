import request from "@/utils/request";
import { UserPermission } from "@/utils/util";
import request from '@/utils/request'
import qs from 'qs'

type LoginParams = {
  mobile: string;
  password: string;
};

type LoginResult = {
  token: string;
  user: {
    id: string;
    user_type: string;
    username: string;
    mobile: string;
    realname: string;
    email: string | null;
    money: string;
    avatar: string;
    teacher: {
      name: string;
      grade_ids: string;
      brief: string;
    };
    permission: UserPermission;
    sale: string | null;
    kefu: string | null;
    user_grade: string[];
  };
};

export const login = (params: LoginParams) => {
  return request
    .post<LoginResult>('/login', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    .then(r => r.data)
}

export const logout = (platform?: "window" | "macos" | "android" | "linux") => {
  const form = new FormData();
  form.append("platform", platform || "window");
  return request.post("/user/logOut", form).then((r) => r.data);
};

type GetConfigResult = {
  servers: {
    host: string;
    name: string;
    ws: string;
  }[];
  consults: {
    name: string;
    contact: string[];
  }[];
};

export const getConfig = () => {
  return request.get<GetConfigResult>("/init/get").then((r) => r.data);
};

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

/**
 * 轮询微信登录状态
 */
export const getWxLoginStatus = (sid: string) => {
  return request.get<{ platform: string; code?: string }>('/login/wxRedirect', { params: { s_id: sid } }).then(r => {
    const { url } = r.data as any
    if (!url) {
      return {
        platform: '',
        code: undefined
      }
    }

    const { platform, code } = qs.parse(url.split('?')[1].replace(/ /g, '')) as any

    return {
      platform,
      code
    }
  })
}

/**
 * 第三方登录
 */
export const loginByThird = (platform: 'google' | 'apple', code: string) => {
  return request
    .post<LoginResult>(
      '/login/auto',
      {
        platform,
        code,
        appid: 'com.jkn.app.web',
        extends: ['authorized', 'teacher', 'kefu'],
        redirect_uri: import.meta.env.PUBLIC_BASE_APPLE_REDIRECT_URI
      },
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )
    .then(r => r.data)
}

/**
 * 发送邮箱验证码
 */
export const sendEmailCode = (email: string, type: 'register' | 'forgot') => {
  return request
    .post('/send/code/email', { email, type }, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    .then(r => r.data)
}

/**
 * 邮箱注册
 */
export const registerByEmail = (params: {
  username: string
  password: string
  password_confirm: string
  code: string
}) => {
  return request
    .post('/login/register', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    .then(r => r.data)
}

/**
 * 忘记密码
 */
export const forgotPassword = (params: {
  username: string
  password: string
  password_confirm: string
  code: string
}) => {
  return request
    .post('/login/forgot', params, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
    .then(r => r.data)
}
