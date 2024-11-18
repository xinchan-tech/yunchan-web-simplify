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

/**
 * 喊单列表
 */
export const getShoutOrders = (params: GetShoutOrdersParams) => {
  return request.get('/shout/orders', { params }).then(r => r.data)
}
getShoutOrders.cacheKey = 'shout:orders'
