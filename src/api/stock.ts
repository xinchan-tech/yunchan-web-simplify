import { useStock } from '@/store'
import { StockRecord } from '@/store/stock/stock'
import request from '@/utils/request'
import dayjs from 'dayjs'
import { md5 } from 'js-md5'
import { sha256 } from 'js-sha256'
import { customAlphabet } from 'nanoid'

type StockTime = string
type StockOpen = number
type StockClose = number // 收盘价（最新价）
type StockHigh = number // 最高价
type StockLow = number // 最低价
type StockVolume = number // 当前时段成交量
type StockTurnover = number // 当前时段成交额
type StockCumulativeVolume = number // 当日累计成交量
type StockCumulativeTurnover = number // 当日累计成交额
type StockPrevClose = number // 前收盘价

export type StockRawRecord =
  | [
      StockTime,
      StockOpen,
      StockClose,
      StockHigh,
      StockLow,
      StockVolume,
      StockTurnover,
      StockCumulativeVolume,
      StockCumulativeTurnover,
      StockPrevClose
    ]
  | [StockTime, StockOpen, StockClose, StockHigh, StockLow, StockVolume, StockTurnover, StockPrevClose]

/**
 * 股票接口通用extend参数
 * // 'alarm_ai' => 是否有ai报警,
 * // 'alarm_all' =>是否有全息报警,
 * // 'collect' =>是否存在金池,
 * // 'thumbs' => 股票缩略走势图,
 * // 'day_basic' => 市值、换手率、市盈率,
 * // 'basic_index' => 行业板块名称,
 * // 'stock_before' => 盘前数据,
 * // 'stock_after' => 盘后数据,
 * // 'total_share' => 股本,
 * // 'financials'=>净利润、总资产、总负责
 * // 'bubble'=> 泡沫系数
 */
export type StockExtend =
  | 'alarm_ai'
  | 'alarm_all'
  | 'collect'
  | 'thumbs'
  | 'day_basic'
  | 'basic_index'
  | 'stock_before'
  | 'stock_after'
  | 'total_share'
  | 'financials'
  | 'bubble'

export type StockExtendResult =
  | 'alarm_ai'
  | 'alarm_all'
  | 'collect'
  | 'thumbs'
  | 'day_basic'
  | 'basic_index'
  | 'stock_before'
  | 'stock_after'
  | 'total_share'
  | 'liabilities'
  | 'liabilities_and_equity'
  | 'net_income_loss' // 净利润？
  | 'bubble'

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export type StockExtendResultMap = Record<StockExtendResult, any>

type GetStockBaseCodeInfoParams = {
  /**
   * 股票代码
   */
  symbol: string
  /**
   * 获取类型
   */
  extend: StockExtend[]
}

export const getStockBaseCodeInfo = (params: GetStockBaseCodeInfoParams) => {
  return request.get('/basic/stock/getCodeInfo', { params }).then(r => r.data)
}

export enum StockChartInterval {
  /**
   * 0：盘中分时图，-1：盘前分时图，-2：盘后分时图，小于1440-任意分钟的分钟线, 1440-日线, 7200：5日分时图, 10080-周线, 43200-月线,
   * 129600-季线, 259200-半年线
   */
  INTRA_DAY = 0,
  PRE_MARKET = -1,
  AFTER_HOURS = -2,
  DAY = 1440,
  FIVE_DAY = 7200,
  WEEK = 10080,
  MONTH = 43200,
  QUARTER = 129600,
  HALF_YEAR = 259200
}

export enum StockChartType {
  PRE_MARKET = -1,
  INTRA_DAY = 0,
  AFTER_HOURS = 1
}

type GetStockChartParams = {
  /**
   * 时间戳_随机数（6位数）
   */
  _tr?: string
  /**
   * 是否计算缠论
   */
  coiling?: string
  /**
   * 数据类型：0获取实时维护的数据，1获取历史数据
   */
  data_type?: string
  /**
   * 结束时间，分钟线精确到分，其它精确到天
   */
  end_at?: string
  /**
   * 测试-是否压缩
   */
  gzencode?: string
  /**
   * 0：盘中分时图，-1：盘前分时图，-2：盘后分时图，小于1440-任意分钟的分钟线, 1440-日线, 7200：5日分时图, 10080-周线, 43200-月线,
   * 129600-季线, 259200-半年线
   */
  interval: StockChartInterval
  /**
   * -1-盘前，0-盘中，1-盘后
   */
  ktype?: StockChartType
  /**
   * 前置数据的md5
   */
  pre_md5?: string
  /**
   * 开始时间，分钟线精确到分，其它精确到天
   */
  start_at?: string
  /**
   * 股票代码
   */
  ticker: string
}

type GetStockChartResult = {
  history: StockRawRecord[]
  coiling_data: unknown[]
  md5: string
}

/**
 * 股票K线数据
 */
export const getStockChart = (params: GetStockChartParams) => {
  //   生成sign的步骤：
  // 步骤 1: 请求参数排序
  // 按照请求参数的名称，对所有的请求参数进行升序排序。

  // 例如，将参数 start_at=2023-10-24 11:32:59, ticker=AAPL, interval=3 排序为 interval=3, start_at=2023-10-24 11:32:59, ticker=AAPL。然后，将参数名和参数值拼接，形成参数字符串：

  // interval=3&start_at=2023-10-24 11:32:59&ticker=AAPL
  // 步骤 2: 添加 appKey
  // 将 appKey 添加在参数字符串的尾部，用 & 符号连接，得到如下字符串：

  // interval=3&start_at=2023-10-24 11:32:59&ticker=AAPL&app_key=appKey
  // 步骤 3: sha256、MD5 加密
  // 对上述字符串依次进行sha256和MD5加密，即可得到最终的签名 Sign

  if (!params._tr) {
    params._tr = dayjs().valueOf().toString() + customAlphabet('0123456789', 6)()
  }

  const paramsKeySort = Object.keys(params).sort() as (keyof typeof params)[]

  const paramsStr = paramsKeySort.reduce((acc, key) => `${acc}${key}=${params[key]}&`, '').slice(0, -1)

  const sign = md5(sha256(paramsStr))

  return request
    .get<GetStockChartResult>('/stock/chart', {
      params,
      headers: { sign, 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    .then(r => r.data)
}

type GetHotSectorsParams = {
  type: 'day' | 'month' | 'week'
  /**
   * 排名前几
   */
  top?: number
  /**
   * 选择项
   */
  sector: 'industry' | 'concept'
  /**
   * 是否显示股票相关信息：1、显示（领涨股信息、涨家数、跌家数、成交总额）
   * @example ["1"]
   */
  stock?: string[]
}

type GetHotSectorsResult = {
  amount: number
  /**
   * 总成交额
   */
  amount_total: number
  change: number
  /**
   * 跌家数
   */
  fall_number: number
  /**
   * 涨家数
   */
  rise_number: number
  sector_name: string
  market_cap: number
  /**
   * 涨幅前几名股票列表
   */
  tops: {
    code: string
    increase: number
    lifting: number
    name: string
    plate_code: string
    stock: StockRawRecord
    symbol: string
  }[]
}

/**
 * 行业/概念热点
 */
export const getHotSectors = (params: GetHotSectorsParams) => {
  return request.get<GetHotSectorsResult[]>('/index/hotSectors', { params }).then(r => r.data)
}

export enum IncreaseTopStatus {
  PRE_MARKET = 0,
  INTRA_DAY = 1,
  AFTER_HOURS = 2,
  NIGHT_MARKET = 3,
  YESTERDAY = 4,
  WEEK = 5
}

type GetIncreaseTopParams = {
  open_status: IncreaseTopStatus
  extend: StockExtend[]
}

type GetIncreaseTopResult = {
  name: string
  symbol: string
  stock: StockRawRecord
  extend?: Record<StockExtend, unknown>
}[]

/**
 * 鹰眼数据
 */
export const getIncreaseTop = (params: GetIncreaseTopParams) => {
  return request.get<GetIncreaseTopResult>('/index/increase/top', { params }).then(r => r.data)
}

type GetCollectHotResult = {
  name: string
  stocks: {
    count: string
    extend: Record<StockExtend, unknown>
    name: string
    stock: StockRawRecord
    symbol: string
    total_mv: string
  }[]
  type: number
}

/**
 * 热度金池
 */
export const getCollectHot = (params: { extend: StockExtend[] }) => {
  return request.get<GetCollectHotResult[]>('/collect/hot', { params }).then(r => r.data)
}

type GetStockCollectsParams = {
  /**
   * 获取类型
   */
  extend: StockExtend[]
  /**
   * 分类id
   */
  cate_id?: number
  /**
   * 页码
   */
  page?: number
  /**
   * 每页数量
   */
  limit?: number
}

type GetStockCollectsResult = {
  /**
   * 当前的上一页
   */
  before: number
  /**
   * 当前页码
   */
  current: number
  first: number
  /**
   * 数据列表
   */
  items: {
    id: string
    symbol: string
    name: string
    create_time: string
    stock: StockRawRecord
    extend?: Record<StockExtendResult, unknown>
  }[]
  /**
   * 记录集中的最后一页
   */
  last: number
  /**
   * 每页显示数量
   */
  limit: number
  /**
   * 当前的下一页
   */
  next: number
  previous: number
  /**
   * 源数据中的项目数
   */
  total_items: number
  /**
   * 页数
   */
  total_pages: number
}

/**
 * 股票金池
 */
export const getStockCollects = async (params: GetStockCollectsParams) => {
  const r = await request.get<GetStockCollectsResult>('/collects', { params }).then(r => r.data)
  useStock.getState().insertRawByRecords(r.items)
  return r
}
getStockCollects.cacheKey = 'getStockCollects'

type GetStockCollectCatesResult = {
  /**
   * 唯一标识
   */
  id: string

  /**
   * 名称
   */
  name: string

  /**
   * 创建时间戳
   */
  create_time: string

  /**
   * 激活状态
   */
  active: number

  /**
   * 总数
   */
  total: string
}

/**
 * 股票金池分类
 */
export const getStockCollectCates = (symbol?: string) => {
  const url = symbol ? `/collect/cates/${symbol}` : '/collect/cates'

  return request.get<GetStockCollectCatesResult[]>(url).then(r => r.data)
}
getStockCollectCates.cacheKey = '/collect/cates'

/**
 * 修改金池分类
 */
export const updateStockCollectCate = (params: { id: string; name: string }) => {
  return request.post('/collect/cate/update', new URLSearchParams(params)).then(r => r.data)
}

/**
 * 添加金池分类
 */
export const addStockCollectCate = (name: string) => {
  return request.post('/collect/cate/save', new URLSearchParams({ name })).then(r => r.data)
}

/**
 * 删除金池分类
 */
export const removeStockCollectCate = (id: string) => {
  return request.post('/collect/cate/delete', new URLSearchParams({ id })).then(r => r.data)
}

/**
 * 加入金池
 */
export const addStockCollect = (params: { symbols: string[]; cate_ids: number[] }) => {
  const form = new URLSearchParams()
  for (const s of params.symbols) {
    form.append('symbols[]', s)
  }

  for (const c of params.cate_ids) {
    form.append('cate_ids[]', c.toString())
  }
  return request.post('/collect/save', new URLSearchParams(form)).then(r => r.data)
}

/**
 * 单个股票加入多个金池
 */
export const addStockCollectBatch = (params: { symbol: string; cate_ids: number[] }) => {
  const form = new URLSearchParams()

  for (const c of params.cate_ids) {
    form.append('cate_ids[]', c.toString())
  }
  return request.post(`/collect/save/${params.symbol}`, new URLSearchParams(form)).then(r => r.data)
}

/**
 * 移出金池
 */
export const removeStockCollect = (params: { symbols: string[]; cate_ids: number[] }) => {
  const form = new URLSearchParams()
  for (const s of params.symbols) {
    form.append('symbols[]', s)
  }

  for (const c of params.cate_ids) {
    form.append('cate_ids[]', c.toString())
  }
  return request.post<void>('/collect/delete', form).then(r => r.data)
}

/**
 * 股票：symbol
 * 现价：'close',
 * 成交额： 'amount',
 * 成交量： 'volume',
 * 市值： 'total_mv',
 * 换手率： 'turnover_rate',
 * 盘前涨跌幅：'stock_before',
 * 涨跌幅：'increase',
 * 盘后涨跌幅： 'stock_after'
 * 市盈率TTM： 'pe_ttm'
 * 市净率： 'pb'
 */
export type UsStockColumn =
  | 'symbol'
  | 'close'
  | 'amount'
  | 'volume'
  | 'total_mv'
  | 'turnover_rate'
  | 'stock_before'
  | 'increase'
  | 'stock_after'
  | 'pe_ttm'
  | 'pb'

type GetUsStocksParams = {
  column: UsStockColumn
  order: 'asc' | 'desc'
  limit: number
  page: number
  extend?: StockExtend[]
  type?: string
}

type GetUsStocksResult = {
  before?: number
  current: number
  first: number
  items: {
    extend: StockExtendResultMap
    symbol: string
    name: string
    stock: StockRawRecord
  }[]
  last: number
  limit: number
  next: number
  previous: number
  total_items: number
  total_pages: number
}

/**
 * 全部美股
 */
export const getUsStocks = async (params: GetUsStocksParams) => {
  const r = await request.get<GetUsStocksResult>('/stock/cutom/getUsStocks', { params: params }).then(r => r.data)
  useStock.getState().insertRawByRecords(r.items)

  return r
}

type GetPlateListResult = {
  amount: number
  change: number
  hot_rise: number
  id: string
  name: string
}

/**
 * 板块列表
 * 1: 行业板块 2：概念板块
 */
export const getPlateList = (type: 1 | 2) => {
  return request.get<GetPlateListResult[]>('/plate/list', { params: { type } }).then(r => r.data)
}
getPlateList.cacheKey = '/plate/list'

type GetPlateStocksResult = {
  symbol: string
  name: string
  market_cap: string
  ep: number
  change_perc: number
  collect: number
  /**
   * 获取类型
   */
  extend: StockExtendResultMap
  stock: StockRawRecord
}

/**
 * 成分股板块
 *
 */
export const getPlateStocks = async (id: number, extend: StockExtend[]) => {
  const r = await request
    .get<GetPlateStocksResult[]>('/plate/stocks', { params: { plate_id: id, extend } })
    .then(r => r.data)
  useStock.getState().insertRawByRecords(r)
  return r
}
getPlateStocks.cacheKey = '/plate/stocks'

type GetIndexRecommendsResult = {
  extend: StockExtendResultMap
  name: string
  symbol: string
  stock: StockRawRecord
}

/**
 * 精品推荐集合
 */
export const getIndexRecommends = async (type: string, extend: StockExtend[]) => {
  const r = await request
    .get<GetIndexRecommendsResult[]>('/index/recommends', { params: { type, extend } })
    .then(r => r.data)
  useStock.getState().insertRawByRecords(r)

  return r
}

type GetIndexGapAmplitudeResult = GetIndexRecommendsResult

/**
 * 跳空涨跌
 */
export const getIndexGapAmplitude = (extend: StockExtend[]) => {
  return request.get<GetIndexGapAmplitudeResult[]>('/index/gapAmplitude', { params: { extend } }).then(r => r.data)
}

/**
 * 名师推荐列表
 */
export const getRecommendIndex = (params: { type: 0 | 1 | 2; extend: StockExtend[] }) => {
  return request.get<void>('/recommend/index', { params }).then(r => r.data)
}
