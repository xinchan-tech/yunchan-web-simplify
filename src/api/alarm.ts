import request from '@/utils/request'
import type { StockExtend, StockExtendResultMap, StockRawRecord } from './stock'

export enum AlarmType {
  AI = 0,
  HISTORY = 1,
  PRICE = 2,
  LINE = 3,
  PERCENT = 4
}

export enum PriceAlarmTrigger {
  UP = 2,
  DOWN = 3
}

type GetAlarmsGroupParams = {
  limit?: number | string
  page?: number | string
  extend?: StockExtend[]
  type: AlarmType
}

type GetAlarmsGroupResult = PageResult<{
  extend?: StockExtendResultMap
  name: string
  stock: StockRawRecord
  symbol: string
}>
export const getAlarmsGroup = async (params: GetAlarmsGroupParams) => {
  const r = await request.get<GetAlarmsGroupResult>('/alarms/groupAlarms', { params }).then(r => r.data)
  return r
}
getAlarmsGroup.cacheKey = 'alarms:groupAlarms'

type GetAlarmsParams = {
  limit?: number | string
  page?: number | string
  symbol?: string
  /**
   * 0 AI警报
   * 1 全息警报
   * 2 股价警报
   * 3 画线警报
   */
  type: number
}

type GetAlarmsResult = PageResult<{
  condition: {
    frequency: number
    bull: string
    category_hdly_ids: string[]
    category_hdly_names: string[]
    category_ids: number[]
    category_names: string[]
    price: string
    trigger: number
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
 * 删除警报
 */
export const deleteAlarm = async (params: { ids?: string[]; symbols?: string[]; type: AlarmType }) => {
  const f = new URLSearchParams()
  for (const id of params.ids || []) {
    f.append('ids[]', id)
  }

  for (const symbol of params.symbols || []) {
    f.append('symbols[]', symbol)
  }
  f.append('type', params.type.toString())

  return request.post('/alarms/delete', f).then(r => r.data)
}

/**
 * 添加警报
 */

type AddAlarmParams = {
  symbol: string
  type: number
  stock_cycle?: string[]
  expire_time?: string
  condition: {
    category_ids?: string[]
    category_hdly_ids?: string[]
    own_ids?: string[]
    rise?: number[]
    fall?: number[]
    frequency?: number
    is_email?: '0' | '1'
    float_params?: {price: number, type: number; change_value: number}[]
  }
}
export const addAlarm = async (params: AddAlarmParams) => {
  return request.post('/stock-svc/alarm/stocks', params).then(r => r.data)
}

type GetAlarmTypesResult = {
  own: []
  stock_kline: {
    authorized: 0 | 1
    id: string
    name: string
    value: string
  }[]
  stocks: {
    children?: GetAlarmTypesResult['stocks']
    authorized: 0 | 1
    id: string
    name: string
    pid: string
  }[]
}

/**
 * 获取警报类型
 */
export const getAlarmTypes = async () => {
  return request.get<GetAlarmTypesResult>('/alarm/getStocks').then(r => r.data)
}
getAlarmTypes.cacheKey = 'alarms:getStocks'

type GetAlarmLogsParams = {
  limit?: number | string
  page?: number | string
  symbol?: string
  type?: AlarmType
  /**
   * k线周期
   */
  cycle?: string
  /**
   * 开始时间
   * @example 2023-01-01 00:00:00
   */
  start?: string
  /**
   * 结束时间
   * @example 2023-01-01 00:00:00
   */
  end?: string
  extend?: StockExtend[]
  order?: 'asc' | 'desc'
  order_by?: string
}

type GetAlarmLogsResult = PageResult<{
  symbol: string
  type: AlarmType
  stock_cycle?: string
  alarm_time: string
  condition: {
    category_name?: string
    hdly?: string
    indicators?: string
    own_ids?: string[]
    rise?: number[]
    price?: number
    fall?: number[]
    frequency?: number
    is_email?: '0' | '1'
    bull?: string
    trigger?: PriceAlarmTrigger
  }
  id: string
}>

/**
 * 获取触发警报列表
 */
export const getAlarmLogs = async (params: GetAlarmLogsParams) => {
  return request.get<GetAlarmLogsResult>('/alarm/logs', { params }).then(r => r.data)
}
getAlarmLogs.cacheKey = 'alarms:logs'

type GetAlarmConditionsListParams = {
  page: number
  limit: number
  symbol?: string
  order?: 'asc' | 'desc'
  order_by?: string
}

type AlarmBaseType = {
  create_time: string
  id: string
  stock_cycle: number
  symbol: string
  expire_time?: number
}

type AlarmAIType = AlarmBaseType & {
  type: AlarmType.AI
  condition: {
    bull: string
    category_hdly_ids?: string[]
    category_hdly_names?: string[]
    category_ids: number[]
    category_names: string[]
    frequency: 0 | 1
  }
}

type PriceAlarmType = AlarmBaseType & {
  type: AlarmType.PRICE
  condition: {
    frequency: number
    is_email: 0 | 1
    price: number
    trigger: PriceAlarmTrigger
  }
}

type PercentAlarmType = AlarmBaseType & {
  type: AlarmType.PERCENT
  condition: {
    float_param: {
      price: number
      type: number
      change_value: number
    }
  }
}

type GetAlarmConditionsListResult = AlarmAIType | PriceAlarmType | PercentAlarmType

/**
 * 警报列表
 */
export const getAlarmConditionsList = async (params: GetAlarmConditionsListParams) => {
  return request.get<Page<GetAlarmConditionsListResult>>('/stock-svc/alarm/conditions', { params }).then(r => r.data)
}
getAlarmConditionsList.cacheKey = 'alarms:conditions:list'

/**
 * 删除警报条件
 */
export const deleteAlarmCondition = async (ids: string[]) => {
  return request.post('/stock-svc/alarm/conditions/delete', { ids }).then(r => r.data)
}

type BaseAlarmRecord = {
  symbol: string
  stock_cycle: number
  id: string
  alarm_time: number
}

type AiAlarmRecord = BaseAlarmRecord & {
  type: AlarmType.AI
  condition: {
    bull: '0' | '1'
    hdly?: string
    indicators?: string
    score: {
      indicators: number
      hdly: number
    }
    score_total: number
    frequency: number
    coiling: {
      action: string
      param: {
        stock_cycle: number
      }
    }
  }
}

type PriceAlarmRecord = BaseAlarmRecord & {
  type: AlarmType.PRICE
  condition: {
    trigger: PriceAlarmTrigger
    price: number
    frequency: number
  }
}

type PercentAlarmRecord = BaseAlarmRecord & {
  type: AlarmType.PERCENT
  condition: {
    data: {
      pnl_percent: number
      pnl_price: number
      trigger_price: number
      trigger_type: number
      base_price: number
    }
  }
}


/**
 * 触发警报日志列表
 */
export const getAlarmLogsList = async (params: GetAlarmLogsParams) => {
  return request.get<Page<PriceAlarmRecord | AiAlarmRecord | PercentAlarmRecord>>('/stock-svc/alarm/logs', { params }).then(r => r.data)
}
getAlarmLogsList.cacheKey = 'stock-svc:alarms:logs'

/**
 * 删除报警触发日志
 */
export const deleteAlarmLog = async (ids: string[]) => {
  return request.post('/stock-svc/alarm/logs/delete', { ids }).then(r => r.data)
}

/**
 * 清除所有报警触发日志
 */
export const clearAlarmLogs = async () => {
  return request.post('/stock-svc/alarm/logs/deleteAll').then(r => r.data)
}
