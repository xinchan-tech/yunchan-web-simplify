import request from '@/utils/request'
import type { StockExtend, StockExtendResultMap, StockRawRecord } from './stock'
import { useStock } from '@/store'

type GetAlarmsGroupParams = {
  limit?: number | string
  page?: number | string
  extend?: StockExtend[]
  /**
   * 0 AI报警
   * 1 全息报警
   * 2 股价报警
   * 3 画线报警
   */
  type: number
}

type GetAlarmsGroupResult = PageResult<{
  extend?: StockExtendResultMap
  name: string
  stock: StockRawRecord
  symbol: string
}>
export const getAlarmsGroup = async (params: GetAlarmsGroupParams) => {
  const r = await request.get<GetAlarmsGroupResult>('/alarms/groupAlarms', { params }).then(r => r.data)
  useStock.getState().insertRawByRecords(r.items)
  return r
}
getAlarmsGroup.cacheKey = 'alarms:groupAlarms'

type GetAlarmsParams = {
  limit?: number | string
  page?: number | string
  symbol?: string
  /**
   * 0 AI报警
   * 1 全息报警
   * 2 股价报警
   * 3 画线报警
   */
  type: number
}

type GetAlarmsResult = PageResult<{
  condition: {
    bull: string
    category_hdly_ids: string[]
    category_hdly_names: string[]
    category_ids: number[]
    category_names: string[]
  }
  create_time: string
  id: string
  stock_cycle: string
}>

export const getAlarms = async (params: GetAlarmsParams) => {
  const r = await request.get<GetAlarmsResult>('/alarms', { params }).then(r => r.data)
  return r
}
getAlarms.cacheKey = 'alarms:list'

/**
 * 删除报警
 */
export const deleteAlarm = async (params: { ids?: string[]; symbols?: string[]; type: string }) => {
  const f = new URLSearchParams()
  for (const id of params.ids || []) {
    f.append('ids[]', id)
  }

  for (const symbol of params.symbols || []) {
    f.append('symbols[]', symbol)
  }
  f.append('type', params.type)

  return request.post('/alarms/delete', f).then(r => r.data)
}
