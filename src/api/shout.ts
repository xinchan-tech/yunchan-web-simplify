import request from '@/utils/request'

type GetShoutOrdersParams = {
  /**
   * 关键词搜索
   */
  keywords?: string
  /**
   * 等级id
   */
  grade_id: string
  limit?: string | number
  page?: string | number
  id?: string | number
  /**
   * up 获取{id}之前数据，其他获取{id}之后数据
   */
  direction?: 'up' | string
}

type GetShoutOrderResult = {
  content: string
  create_time: string
  id: string
  teacher: {
    id: string
    avatar: string
    brief: string
    name: string
    uid: string
  }
  timezone: string
  type: string
}

/**
 * 喊单列表
 */
export const getShoutOrders = (params: GetShoutOrdersParams) => {
  return request.get<PageResult<GetShoutOrderResult>>('/shout/orders', { params }).then(r => r.data)
}
getShoutOrders.cacheKey = 'shout:orders'

/**
 * 获取配置列表
 *
 * @param type 配置类型 0新手教程 1名师专栏 2名师推荐 3特色研报 4超短喊单 5喊单王 6牛股跟踪 7价值组合
 */
export const getTeacherGrades = (type: string) => {
  return request
    .get<{ id: string; name: string; type: string }[]>('/teacher/grades', { params: { type } })
    .then(r => r.data)
}
getTeacherGrades.cacheKey = 'teacher:grades'
