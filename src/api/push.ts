// 推送特色菜单列表

import request from '@/utils/request'

type GetPushMenuResult = {
  title: string
  name: string
  key: string
}
export const getPushMenu = () => {
  return request.get<GetPushMenuResult[]>('/push/menu').then(r => r.data)
}
getPushMenu.cacheKey = 'push:menu'
