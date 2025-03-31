import { useIndicator } from '@/store'
import request from '@/utils/request'
import { gzDecode } from '@/utils/string'
import axios from 'axios'
import dayjs from 'dayjs'
import { md5 } from 'js-md5'
import { sha256 } from 'js-sha256'
import { customAlphabet } from 'nanoid'
import { isString } from 'radash'

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
  | []

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

export type StockExtendResultMap = Record<StockExtendResult, any>

export const getAllStocks = async (key?: string) => {
  return request.get<{ data: string; key: string }>('/index/getAllStock', { params: { key } }).then(r => r.data)
}
getAllStocks.cacheKey = 'index:allStock'

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

type GetStockBaseCodeInfoResult = {
  extend?: StockExtendResultMap
  name: string
  stock: StockRawRecord
  symbol: string
}

export const getStockBaseCodeInfo = async (params: GetStockBaseCodeInfoParams) => {
  const r = await request.get<GetStockBaseCodeInfoResult>('/basic/stock/getCodeInfo', { params }).then(r => r.data)
  return r
}
getStockBaseCodeInfo.cacheKey = 'basic:stock:code:info'

export enum StockChartInterval {
  /**
   * 0：盘中分时图，-1：盘前分时图，-2：盘后分时图，小于1440-任意分钟的分钟线, 1440-日线, 7200：5日分时图, 10080-周线, 43200-月线,
   * 129600-季线, 259200-半年线
   */
  INTRA_DAY = 0,
  PRE_MARKET = -1,
  AFTER_HOURS = -2,
  FIVE_DAY = 7200,
  ONE_MIN = 1,
  TWO_MIN = 2,
  THREE_MIN = 3,
  FIVE_MIN = 5,
  TEN_MIN = 10,
  FIFTEEN_MIN = 15,
  THIRTY_MIN = 30,
  FORTY_FIVE_MIN = 45,
  ONE_HOUR = 60,
  TWO_HOUR = 120,
  THREE_HOUR = 180,
  FOUR_HOUR = 240,
  DAY = 1440,
  WEEK = 10080,
  MONTH = 43200,
  QUARTER = 129600,
  HALF_YEAR = 259200,
  YEAR = 518400
}

export enum StockPeriod {
  INTRA_DAY = '1m',
  PRE_MARKET = '1m',
  AFTER_HOURS = '1m',
  FIVE_DAY = '5d',
  ONE_MIN = '1m',
  TWO_MIN = '2m',
  THREE_MIN = '3m',
  FIVE_MIN = '5m',
  TEN_MIN = '10m',
  FIFTEEN_MIN = '15m',
  THIRTY_MIN = '30m',
  FORTY_FIVE_MIN = '45m',
  ONE_HOUR = '60m',
  TWO_HOUR = '120m',
  THREE_HOUR = '180m',
  FOUR_HOUR = '240m',
  DAY = '1d',
  WEEK = '1w',
  MONTH = '1M',
  QUARTER = '1q',
  HALF_YEAR = '6M',
  YEAR = '1y'
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
  gzencode?: boolean
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
  coiling_data?: {
    istop: boolean
    md5: string
    status: number
    points: number[]
    pivots: number[][]
    expands: number[][]
    class_1_trade_points: number[][]
    class_2_trade_points: number[][]
    class_3_trade_points: number[][]
  }
  md5: string
}

/**
 * 股票K线数据
 */
export const getStockChart = async (params: GetStockChartParams) => {
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

  let r = await request
    .get<GetStockChartResult>('/stock/chart', {
      params,
      headers: { sign, 'Content-Type': 'application/x-www-form-urlencoded' }
    })
    .then(r => r.data)

  if (params.gzencode) {
    // const data = atob(r as unknown as string)

    // const dataUint8 = new Uint8Array(data.length)

    // for (let i = 0; i < data.length; i++) {
    //   dataUint8[i] = data.charCodeAt(i)
    // }

    r = JSON.parse(gzDecode(r as unknown as string)) as GetStockChartResult
  }

  return r
}
getStockChart.cacheKey = 'stock:chart'

/**
 * 股票K线数据V2
 */
type GetStockChartV2Params = {
  /**
   * 股票代码
   */
  symbol: string
  /**
   * 周期
   */
  period: StockPeriod
  /**
   * 开始时间
   * @example 2021-01-01 00:00:00
   */
  start_at: string
  /**
   * 结束时间
   * @example 2021-01-01 00:00:00
   */
  end_at?: string
  /**
   * 时间格式
   * @example int 时间戳
   * @example string 时间字符串
   */
  time_format: string
}
export const getStockChartV2 = async (params: GetStockChartV2Params) => {
  const paramsKeySort = Object.keys(params).sort() as (keyof typeof params)[]

  const paramsStr = `${paramsKeySort.reduce((acc, key) => `${acc}${key}=${params[key]}&`, '').slice(0, -1)}&app_key=${'LMOl&8skLax%ls1Haapd'}`

  const sign = md5(sha256(paramsStr))

  const r = await axios
    .get<{ data: { list: StockRawRecord[] } }>('/apiv2/chart/kline', {
      params,
      headers: { sign }
    })
    .then(r => r.data)
  return r
}
getStockChartV2.cacheKey = 'stock:kline:v2'

export const getStockChartQuote = async (
  symbol: string,
  period: 'pre' | 'intraday' | 'post' | '5d' | 'full-day' | number,
  time_format = 'int'
) => {
  const _period = isString(period)
    ? period
    : period === StockChartInterval.PRE_MARKET
      ? 'pre'
      : period === StockChartInterval.INTRA_DAY
        ? 'intraday'
        : period === StockChartInterval.AFTER_HOURS
          ? 'post'
          : '5d'
  const params = { symbol, _period, time_format }
  const paramsKeySort = Object.keys(params).sort() as (keyof typeof params)[]
  const paramsStr = `${paramsKeySort.reduce((acc, key) => `${acc}${key}=${params[key]}&`, '').slice(0, -1)}&app_key=${'LMOl&8skLax%ls1Haapd'}`
  const sign = md5(sha256(paramsStr))

  const r = await await axios
    .get<{ list: StockRawRecord[] }>('/apiv2/chart/quote', {
      params: { symbol: symbol, period: _period, time_format },
      headers: { sign }
    })
    .then(
      r =>
        ((r.data as any).data as { list: StockRawRecord[] }).list.map(v => [
          v[0],
          v[1],
          v[4],
          v[2],
          v[3],
          ...v.slice(5)
        ]) as StockRawRecord[]
    )
  return r
}
getStockChartQuote.cacheKey = 'stock:chart:quote'

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
    increase_abs: number
    lifting: number
    name: string
    plate_id: string
    stock: StockRawRecord
    symbol: string
  }[]
}

/**
 * 行业/概念热点
 */
export const getHotSectors = async (params: GetHotSectorsParams) => {
  const r = await request.get<GetHotSectorsResult[]>('/index/hotSectors', { params }).then(r => r.data)
  return r
}
getHotSectors.cacheKey = 'index:hot:sector'

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
  extend?: StockExtendResultMap
}[]

/**
 * 鹰眼数据
 */
export const getIncreaseTop = async (params: GetIncreaseTopParams) => {
  const r = await request.get<GetIncreaseTopResult>('/index/increase/top', { params }).then(r => r.data)
  return r
}
getIncreaseTop.cacheKey = 'index:increase:top'

type GetCollectHotResult = {
  name: string
  stocks: {
    count: string
    extend: StockExtendResultMap
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
export const getCollectHot = async (params: { extend: StockExtend[] }) => {
  const r = await request.get<GetCollectHotResult[]>('/collect/hot', { params }).then(r => r.data)
  return r
}
getCollectHot.cacheKey = 'collect:hot'

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
  if(!params.page){
    params.page = 1
  }
  const r = await request.get<GetStockCollectsResult>('/stock-svc/collect/stocks', { params }).then(r => {
    if(r.data.items === null){
      r.data.items = []
    }
    return r.data
  })
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

  /**
   * 是否选中
   */
  is_default: boolean
  
  /**
   * 排序
   */
  sort: number

}

/**
 * 股票金池分类
 */
export const getStockCollectCates = () => {
  return request.get<GetStockCollectCatesResult[]>('/stock-svc/collect/categories').then(r => r.data)
}
getStockCollectCates.cacheKey = '/collect/cates'

/**
 * 修改金池分类
 */
export const updateStockCollectCate = (params: { id: string; name: string }) => {
  return request.post('/stock-svc/collect/categories/update', { cate_id: params.id, name: params.name }).then(r => r.data)
}

/**
 * 添加金池分类
 */
export const addStockCollectCate = (name: string) => {
  return request.post('/stock-svc/collect/categories', { name }).then(r => r.data)
}

/**
 * 删除金池分类
 */
export const removeStockCollectCate = (id: string | string[]) => {
  const ids = Array.isArray(id) ? id : [id]
  return request.post('/stock-svc/collect/categories/delete',{ids} ).then(r => r.data)
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
  return request.post('/stock-svc/collect/stocks', form).then(r => r.data)
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
  return request.post<void>('/stock-svc/collect/stocks/delete', form).then(r => r.data)
}

/**
 * 移动到其他金池
 * @param params.collect_ids 金池股票id
 * @param params.cate_ids 目标金池分类id
 */
export const moveStockCollectBatch = (params: { collect_ids: number[]; cate_ids: number[] }) => {
  return request.post<void>('/stock-svc/collect/stocks/move', params).then(r => r.data)
}

/**
 * 股票金池分类排序
 */
export const sortStockCollectCate = (id: string, sort: number) => {
  return request.post<void>(`/stock-svc/collect/categories/${id}/setSort`, {sort}).then(r => r.data)
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
  return r
}
getUsStocks.cacheKey = 'stock:cutom:getUsStocks'

/**
 * 中概股
 */
export const getChineseStocks = async (extend: StockExtend[]) => {
  const r = await request
    .get<
      {
        extend: StockExtendResultMap
        symbol: string
        name: string
        stock: StockRawRecord
      }[]
    >('/stock/cutom/getStocks', { params: { type: 'china', extend } })
    .then(r => r.data)
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

type GetStockCategoryResult = Record<string, StockCategory>

export type StockCategory = {
  from_datas: never[]
  authorized: 0 | 1
  children: Record<string, StockCategory>
  datas: string
  id: string
  /**
   * 1 为 hot
   */
  is_hot: string
  key: string
  name: string
  pid: string
}

/**
 * 获取选股分类所有数据
 */
export const getStockCategoryData = () => {
  return request.get<GetStockCategoryResult>('/stock/category/data').then(r => r.data)
}
getStockCategoryData.cacheKey = '/stock/category/data'

/**
 * 财务
 */
export type Finance = {
  /**
   * 研发额
   */
  develop_amount: number[]
  /**
   * 研发额占比率
   */
  develop_amount_rate: number[]
  /**
   * 净资产
   */
  equity: number[]
  /**
   * 净资产回报率
   */
  equity_rate: number[]
  /**
   * 年报、季报
   */
  fiscal_period: FiscalPeriod
  /**
   * 总负债
   */
  liabilities: number[]
  /**
   * 总负债率
   */
  liabilities_rate: number[]
  /**
   * 现金流
   */
  net_cash_flow: number[]
  /**
   * 现金流占比率
   */
  net_cash_flow_rate: number[]
  /**
   * 净利润
   */
  net_income_loss: number[]
  /**
   * 净利润率
   */
  net_income_loss_rate: number[]
  /**
   * 总营收
   */
  revenues: number[]
  /**
   * 营收增长率
   */
  revenues_rate: number[]
}

/**
 * 年报、季报
 */
export enum FiscalPeriod {
  Fy = 'FY',
  Q1 = 'Q1',
  Q2 = 'Q2',
  Q3 = 'Q3',
  Q4 = 'Q4'
}

/**
 * 量价指标
 */
export type QuantityPrice = {
  /**
   * 上一个交易日成交额前排名，
   */
  amount_top: number
  /**
   * 天数，0默认当天
   */
  day: number
  /**
   * 活跃度（特色指标）
   */
  feature: number[]
}

/**
 * 估值指标[总市值][开始]
 */
export type Valuation = {
  /**
   * 创新高
   */
  innovate_high: number
  /**
   * 创新低
   */
  innovate_low: number
  /**
   * 市净率
   */
  pb: number[]
  /**
   * 市盈率
   */
  pe: number[]
  /**
   * 股价
   */
  price: number[]
  /**
   * 估值指标[总市值]
   */
  total_mv?: TotalMv[]
}

/**
 * [开始|表达式，结束]
 */
export enum TotalMv {
  Empty = '>=',
  Fluffy = '<',
  Purple = '>',
  Tentacled = '=',
  The1000 = '1000',
  TotalMv = '<='
}

type StockSelectionParams = {
  /**
   * 泡沫系数
   */
  bubble: number
  /**
   * 指标分类id集合
   */
  category_ids: number[]
  /**
   * 金池
   */
  collect: number[]
  /**
   * 行业比价
   */
  compare: string[]
  /**
   * 财务
   */
  finance: Finance
  /**
   * 量价指标
   */
  quantity_price: QuantityPrice
  /**
   * 名师推荐
   */
  recommend: number[]
  /**
   * 板块代码，plate_code
   */
  sectors: string[]
  /**
   * 股票周期，单位：分
   */
  stock_cycle: number[]
  /**
   * 股票代码
   */
  symbols: string[]
  /**
   * 0技术面、1基本面、2超级组合、3名师专用
   */
  tab_page: number
  /**
   * 估值指标[总市值][开始]
   */
  valuation: Valuation
}

type GetStockSelectionResult = {
  bull: string
  extend: StockExtendResultMap
  indicator_name: string
  indicator_name_hdly: string
  name: string
  stock: StockRawRecord
  stock_cycle: number
  symbol: string
  score_total: number
}

/**
 * 筛选股票
 */
export const getStockSelection = (params: StockSelectionParams) => {
  return request.post<GetStockSelectionResult[]>('/stock/selection', params).then(r => r.data)
}

type GetStockFinancialsParams = {
  'date[0]'?: string
  'date[1]'?: string
  page?: number
  limit: number
  symbol?: string
  extend?: StockExtend[]
}

type GetStockFinancialsResult = {
  items: {
    date: string
    id: string
    name: string
    stock: StockRawRecord
    symbol: string
    time: string
    extend?: StockExtendResultMap
  }[]
  dates: string[]
}

/**
 * 财报个股
 */
export const getStockFinancials = (params: GetStockFinancialsParams) => {
  return request.get<GetStockFinancialsResult>('/stock/financials', { params }).then(r => r.data)
}
getStockFinancials.cacheKey = 'stock:financials'

type GetStockEconomicParams = {
  /**
   * 开始时间
   */
  'date[0]'?: string
  /**
   * 结束时间
   */
  'date[1]'?: string
  /**
   * 每页显示数量
   */
  limit?: number
  /**
   * 页码
   */
  page?: number
  /**
   * 排序 DESC   ASC
   */
  sort?: 'DESC' | 'ASC'
  /**
   * 默认0 经济数据  1重大事件
   */
  type?: number
}

type GetStockEconomicResult = {
  items: {
    /**
     * 唯一标识符
     */
    id: string

    /**
     * 发布日期和时间
     */
    date: string

    /**
     * 指标关键字
     */
    key: string

    /**
     * 指标名称
     */
    title: string

    /**
     * 上期值
     */
    previous: string

    /**
     * 预估值
     */
    estimate: string

    /**
     * 实际值
     */
    actual: string

    /**
     * 变动值
     */
    change: string

    /**
     * 影响程度
     */
    impact: number

    /**
     * 变动百分比
     */
    changePercentage: string

    /**
     * 单位
     */
    unit: string

    /**
     * 下次发布时间
     */
    next_time: string
  }[]
  current: number
  next: number
  total_pages: number
}

/**
 * 经济数据
 */
export const getStockEconomic = (params: GetStockEconomicParams) => {
  return request.get<GetStockEconomicResult>('/stock/economic', { params }).then(r => r.data)
}
getStockEconomic.cacheKey = 'stock:economic'

type GetStockEconomicDetailResult = {
  introduce: {
    analysis: string
    frequency: string
    impact: string
    institutions: string
    reasons: string
  }
  list: {
    id: string
    date: string
    title: string
    currency: string
    previous: string
    estimate: string
    actual: string
    change: string
    impact: string
    changePercentage: string
    unit: string
  }[]
}

/**
 * 日历事件（财经日历）按时间汇总
 */
export const getCalendarEvents = () => {
  return request.get<GetCalendarEventsResult[]>('/stock-svc/calendar/events').then(r => r.data)
}
getCalendarEvents.cacheKey = 'calendar:events'

type GetCalendarEventsResult = {
  name: string
  values: {
    title: string
    datetime: string
  }[]
}

/**
 * 经济数据详情
 */
export const getStockEconomicDetail = (key: string) => {
  return request.get<GetStockEconomicDetailResult>('/stock/economic/info', { params: { key } }).then(r => r.data)
}
getStockEconomicDetail.cacheKey = 'stock:economic:detail'

/**
 * 美联储日程
 */
export const getStockFedCalendar = () => {
  return request
    .get<
      {
        date: string
        /**
         * 褐皮书
         */
        beige_book: string
        /**
         * 点阵图
         */
        bitmap: string
        /**
         * 发布会
         */
        conference: string
        /**
         * 决议声明
         */
        declare: string
        /**
         * 经济预测
         */
        prediction: string
        /**
         * 纪要
         */
        summary: string
      }[]
    >('/stock/schedule')
    .then(r => r.data)
}
getStockFedCalendar.cacheKey = 'stock:fed:schedule'

type GetStockHolidayResult = {
  id: string
  exchange: string
  date: string
  name: string
  status: string
}

/**
 * 休市
 */
export const getStockHoliday = (start: string, end: string) => {
  return request
    .get<GetStockHolidayResult[]>('/market/holidays', { params: { 'date[0]': start, 'date[1]': end } })
    .then(r => r.data)
}
getStockHoliday.cacheKey = 'stock:holiday'

type GetStockBriefResult = {
  symbol: string
  active: string
  address?: string
  cik?: string
  name: string
  description?: string
  sic_description?: string
  list_date: string
  composite_figi: string
  ticker_root: string
  ticker_suffix?: string
  homepage_url?: string
  locale: string
  market: string
  market_cap: string
  phone_number?: string
  primary_exchange: string
  round_lot?: string
  share_class_figi: string
  share_class_shares_outstanding: string
  sic_code?: string
  total_employees?: string
  type: string
  weighted_shares_outstanding?: string
}

/**
 * 股票详情
 */
export const getStockBrief = (symbol: string) => {
  return request.get<GetStockBriefResult>('/stock/brief', { params: { ticker: symbol } }).then(r => r.data)
}
getStockBrief.cacheKey = 'stock:brief'

type GetStockQuoteResult = {
  /**
   * 当日成交额
   */
  amount: string
  /**
   * 股价变化值百分比
   */
  change_perc: string
  /**
   * 股价变化值
   */
  change_val: string
  /**
   * 总市值
   */
  market_cap: string
  /**
   * 最新报价
   */
  q_close: string
  /**
   * 当日最高价
   */
  q_high: string
  /**
   * 当日最低价
   */
  q_low: string
  /**
   * 开盘价
   */
  q_open: string
  /**
   * 昨日收盘价
   */
  q_preday_close: string
  /**
   * 52周最高价
   */
  q_year_high: string
  /**
   * 52周最低价
   */
  q_year_low: string
  /**
   * 当日成交量
   */
  volume: string
}

/**
 * 当日报价
 */
export const getStockQuote = (symbol: string) => {
  return request.get<GetStockQuoteResult>('/stock/quote', { params: { ticker: symbol } }).then(r => r.data)
}
getStockQuote.cacheKey = 'stock:quote'

/**
 * 股票新闻列表
 */
export const getStockNewsList = (symbol: string) => {
  return request.get('/stock/newslist', { params: { ticker: symbol } }).then(r => r.data)
}
getStockNewsList.cacheKey = 'stock:newslist'

type GetStockNoticeResult = {
  event: {
    time: number
    title: string
    url?: string
  }[]
}

/**
 * 公告
 */
export const getStockNotice = (symbol: string) => {
  return request.get<GetStockNoticeResult>('/stock/notice', { params: { symbol: symbol } }).then(r => r.data)
}
getStockNotice.cacheKey = 'stock:notice'

interface GetStockRelatedResult {
  plates?: {
    id: string
    name: string
  }[]
  stocks: {
    name: string
    symbol: string
    stock: StockRawRecord
    extend?: StockExtendResultMap
  }[]
}

interface GetStockRelatedParams {
  symbol: string
  plate_id?: string
  extend?: StockExtend[]
}

/**
 * 相关股票列表
 */
export const getStockRelated = (params: GetStockRelatedParams) => {
  return request.get<GetStockRelatedResult>('/stock/relates', { params }).then(r => r.data)
}
getStockRelated.cacheKey = 'stock:relates'

/**
 * 买卖点位
 */
export const getStockTrades = (symbol: string) => {
  return request.get<{ p: number; t: string; v: number }[]>(`/trades/${symbol}`).then(r => r.data)
}
getStockTrades.cacheKey = 'stock:trades'

export type StockIndicator = {
  authorized: 1 | 0
  category_id: string
  db_type: 'system' | 'user'
  formula?: string
  id: string
  collect: 0 | 1
  type: string
  value: string
  name?: string
  param?: [string, number, number, number][]
  // items?: StockIndicator[]
}

type GetStockIndicatorsResult = {
  main: {
    db_type: 'system' | 'user'
    id: string
    indicators: StockIndicator[]
    name: string
  }[]
  secondary: GetStockIndicatorsResult['main']
}

/**
 * 指标列表
 * @deprecated
 */
export const getStockIndicators = () => {
  return request.get<GetStockIndicatorsResult>('/stock/indicators').then(r => {
    const indicator: {
      id: string
      name: string
      params: { name: string; value: string; default: string; min: string; max: string }[]
    }[] = []
    const formula: Record<string, string> = {}
    r.data.main.forEach(m => {
      m.indicators.forEach(i => {
        if (i.formula) {
          formula[i.id] = i.formula
        }
        if (i.param) {
          indicator.push({
            id: i.id,
            name: i.name!,
            params: i.param.map(p => {
              return {
                name: p[0],
                value: p[1].toString(),
                default: p[1].toString(),
                min: p[3].toString(),
                max: p[2].toString()
              }
            })
          })
        }
      })
    })
    r.data.secondary.forEach(m => {
      m.indicators.forEach(i => {
        if (i.formula) {
          formula[i.id] = i.formula
        }
        if (i.param) {
          indicator.push({
            id: i.id,
            name: i.name!,
            params: i.param.map(p => {
              return {
                name: p[0],
                value: p[1].toString(),
                default: p[1].toString(),
                min: p[3].toString(),
                max: p[2].toString()
              }
            })
          })
        }
      })
    })

    useIndicator.getState().mergeIndicatorParams(indicator)
    useIndicator.getState().setFormula(formula)
    return r.data
  })
}
getStockIndicators.cacheKey = 'stock:indicators'

interface GetStockIndicatorsV2Result {
  id: string
  name: string
  indicators?: StockIndicator[]
  items?: {
    id: string
    name: string
    indicators?: StockIndicator[]
  }[]
}

export const getStockIndicatorsV2 = () => {
  
  return request.get<GetStockIndicatorsV2Result[]>('/stock-svc/v2/indicators').then(r => {
    const indicator: {
      id: string
      name: string
      params: { name: string; value: string; default: string; min: string; max: string }[]
    }[] = []
    const formula: Record<string, string> = {}
    r.data.forEach(m => {
      m.items?.forEach(i => {
        i.indicators?.forEach(j => {
          if (j.formula) {
            formula[j.id] = j.formula
          }
          if (j.param) {
            indicator.push({
              id: j.id,
              name: j.name!,
              params: j.param.map(p => {
                return {
                  name: p[0],
                  value: p[1].toString(),
                  default: p[1].toString(),
                  min: p[3].toString(),
                  max: p[2].toString()
                }
              })
            })
          }
        })
      })
    })


    useIndicator.getState().mergeIndicatorParams(indicator)
    useIndicator.getState().setFormula(formula)
    return r.data
  })
}
getStockIndicatorsV2.cacheKey = 'stock:indicators:v2'

export const addStockIndicatorCollect = (ids: string[]) => {
  return request.post('/stock-svc/indicators/collect/add', { ids }).then(r => r.data)
}

export const removeStockIndicatorCollect = (ids: string[]) => {
  return request.post('/stock-svc/indicators/collect/remove', { ids }).then(r => r.data)
}

type GetStockIndicatorDataParams = {
  symbol: string
  id: string
  cycle: StockChartInterval
  start_at?: string
  param?: string
  db_type: string
}

type GetStockIndicatorDataResult = {
  result: {
    name: string
    data: any[] | any
    draw?: string
    style?: {
      color: string
      style_type?: string
      linethick: 1
    }
  }[]
}


/**
 * 获取用户自编指标绘图数据
 */
export const getStockIndicatorData = (params: GetStockIndicatorDataParams) => {
  return request.get<GetStockIndicatorDataResult>('/stock/indicator/data', { params }).then(r => r.data)
}
getStockIndicatorData.cacheKey = 'stock:indicator:data'

type GetStockTabListResult = {
  key: string
  title: string
  value: {
    name: string
    key: string
  }[]
}

/**
 * 获取叠加标记列表
 */
export const getStockTabList = () => {
  return request.get<GetStockTabListResult[]>('/stock/tab/list').then(r => r.data)
}
getStockTabList.cacheKey = 'stock:tab:list'

type GetStockTabDataResult = {
  [key: string]: {
    date: string
    event_zh: string
    event_en: string
    category: string
  }[]
}

/**
 * 获取叠加标签数据
 */
export const getStockTabData = (params: {
  start?: string
  ticker: string
  param: {
    finance?: string[]
    economic?: string[]
    event?: string[]
  }
}) => {
  return request.post<GetStockTabDataResult>('/stock/economic/tab', params).then(r => r.data)
}
getStockTabData.cacheKey = 'stock:tab:data'

type GetStockWitchingDayResult = {
  beforeYear: [number, number, number, number, number]
  beforeTwoYear: GetStockWitchingDayResult['beforeYear']
  beforeThreeYear: GetStockWitchingDayResult['beforeYear']
  date: {
    year: string
    items: [string, string, string, string]
  }
}

/**
 * 获取巫日数据
 */
export const getWitchingDay = () => {
  return request.get<GetStockWitchingDayResult>('/stock/getQWData').then(r => r.data)
}
getWitchingDay.cacheKey = 'stock:getQWData'

type GetStockFinanceTotalResult = {
  quarter_items: {
    current_assets: { fiscal_year: string; fiscal_period: string; value: number; rate: number }[]
    equity: { fiscal_year: string; fiscal_period: string; value: number; rate: number }[]
    liabilities: { fiscal_year: string; fiscal_period: string; value: number; rate: number }[]
    liabilities_and_equity: { fiscal_year: string; fiscal_period: string; value: number; rate: number }[]
    liabilities_rate: { fiscal_year: string; fiscal_period: string; value: number; rate: number }[]
    net_cash_flow_free: { fiscal_year: string; fiscal_period: string; value: number; rate: number }[]
    net_income_loss: { fiscal_year: string; fiscal_period: string; value: number; rate: number }[]
    revenues: { fiscal_year: string; fiscal_period: string; value: number; rate: number }[]
  }
  rating: {
    buy: string
    hold: string
    sell: string
    symbol: string
    title: string
    updated_at: string
  }
  targets: {
    list: { close: number; datetime: string }[]
    target: {
      consensus: string
      created_at: string
      high: string
      id: string
      low: string
      median: string
      ticker: string
      updated_at: string
    }
  }
  totals: {
    revenues: number
    net_income_loss: number
    current_assets: number
    equity: number
    liabilities_and_equity: number
    net_cash_flow_free: number
    liabilities: number
    liabilities_rate: number
    updated_at: string
  }
  year_items: {
    current_assets: { fiscal_year: string; value: number; rate: number }[]
    equity: { fiscal_year: string; value: number; rate: number }[]
    liabilities: { fiscal_year: string; value: number; rate: number }[]
    liabilities_and_equity: { fiscal_year: string; value: number; rate: number }[]
    liabilities_rate: { fiscal_year: string; value: number; rate: number }[]
    net_cash_flow_free: { fiscal_year: string; value: number; rate: number }[]
    net_income_loss: { fiscal_year: string; value: number; rate: number }[]
    revenues: { fiscal_year: string; value: number; rate: number }[]
  }
}

/**
 * 股票核心财务
 */
export const getStockFinanceTotal = (symbol: string) => {
  return request.get<GetStockFinanceTotalResult>('/stock/financials/total', { params: { symbol } }).then(r => r.data)
}
getStockFinanceTotal.cacheKey = 'stock:financials:total'

type GetStockValuationResult = {
  foam: string
  total_mv: {
    items: [string, number][]
    current: number
    max: number
    min: number
  }
  pe_ttm: GetStockValuationResult['total_mv']
  pb: GetStockValuationResult['total_mv']
  revenues: {
    geographic: {
      name: string
      revenue: number
      ratio: number
    }[]
    product: GetStockValuationResult['revenues']['geographic']
  }
  options: {
    period: string
    year: string
  }[]
}

/**
 * 股票财务估值
 */
export const getStockValuation = (symbol: string, dates: [string, string]) => {
  return request.get<GetStockValuationResult>('/stock/valuation', { params: { symbol, dates } }).then(r => r.data)
}
getStockValuation.cacheKey = 'stock:valuation'

type GetStockFinancialsStatisticsResult = {
  latest_date: string
  items: {
    symbol: string
    /**
     * 当日振幅
     */
    amplitude: string
    /**
     * 当日涨幅
     */
    increase: string
    /**
     * 财报前一周（五日）涨幅
     */
    last_five_increase: string
    /**
     * 财报前一天涨幅
     */
    last_one_increase: string
    /**
     * 合并净利润
     */
    net_income_loss: string
    /**
     * 净利润 同比增长
     */
    net_income_loss_rate: string
    /**
     * 财报后一周（五日）涨幅
     */
    next_five_increase: string
    /**
     * 财报后一天涨幅
     */
    next_one_increase: string
    /**
     * 发布时间
     */
    report_date: string
    /**
     * 总营收
     */
    revenues: string
    /**
     * 上年 总营收
     */
    revenues_last: string
    /**
     * 总营收 同比增长
     */
    revenues_rate: string
    /**
     * 总市值
     */
    total_mv: string
  }[]
}

/**
 * 财报统计
 */
export const getStockFinancialsStatistics = (symbol: string) => {
  return request
    .get<GetStockFinancialsStatisticsResult>('/stock/financials/total/code', { params: { symbol } })
    .then(r => r.data)
}
getStockFinancialsStatistics.cacheKey = 'stock:financials:total:code'

type GetStockFinancialsStatisticsCateResult = {
  release_num: number
  unrelease_num: number
  rise_rate: number
  latest_date: string
  plates: {
    id: string
    name: string
  }[]
  items: GetStockFinancialsStatisticsResult['items']
}
/**
 * 同行对比
 */
export const getStockFinancialsStatisticsCate = (params: { symbol: string; plate_id?: string; quarter?: string }) => {
  return request
    .get<GetStockFinancialsStatisticsCateResult>('/stock/financials/total/cate', { params })
    .then(r => r.data)
}
getStockFinancialsStatisticsCate.cacheKey = 'stock:financials:total:cate'

type GetStockFinancialsPKResult = {
  quarter_data: {
    fiscal_period: string
    fiscal_year: string
    revenues: string
    liabilities: string
    liabilities_and_equity: string
    net_cash_flow_from_operating_activities: string
    net_income_loss: string
    liabilities_rate: string
    market_cap: string
    net_cash_flow_free: string
  }[]
  valuation: {
    foam: string
    pb: {
      current: number
      max: number
      min: number
      items: [string, number][]
    }
    pe_ttm: GetStockFinancialsPKResult['valuation']['pb']
    total_mv: GetStockFinancialsPKResult['valuation']['pb']
  }
  year_data: GetStockFinancialsPKResult['quarter_data']
}
/**
 * 财务PK
 */
export const getStockFinancialsPK = (symbol: string) => {
  return request.get<GetStockFinancialsPKResult>('/stock/revenues/pk', { params: { symbol } }).then(r => r.data)
}
getStockFinancialsPK.cacheKey = 'stock:revenues:pk'

export enum StockPushType {
  /**
   * 超牛清单
   */
  STOCK_KING = '0',
  /**
   * 缠论推送
   */
  COILING = '1',
  /**
   * MA趋势评级
   */
  MA = '2',
  /**
   * 今日牛股
   */
  BOLL = '3'
}

type GetStockPushParams = {
  type: StockPushType
  date: string
  extend: StockExtend[]
}

type GetStockPushResult = {
  symbol: string
  id: string
  star: string
  interval: string
  coiling_signal: string
  warning: string
  bull: string
  update_time: string
  name: string
  stock: StockRawRecord
  extend: StockExtendResultMap
  create_time: string
}

/**
 * 特色推送
 */
export const getStockPush = (params: GetStockPushParams) => {
  return request.get<GetStockPushResult[]>('/push/index', { params }).then(r => r.data ?? [])
}
getStockPush.cacheKey = 'push:index'

/**
 * 特色推送股票列表
 */
type GetStockPushListResult = {
  bull: number
  name: string
  score: number
  stock: StockRawRecord
  symbol: string
  type: number
  extend?: StockExtendResultMap
  datetime: number
}
export const getStockPushList = (key: string, extend?: StockExtend[]) => {
  return request.get<GetStockPushListResult[]>('/push/list', { params: { key, extend } }).then(r => r.data)
}
getStockPushList.cacheKey = 'push:list'

type GetPalTopResult = {
  create_time: number
  en_name: string
  id: number
  name: string
  score: number
  symbol: string
  update_time: number
}
/**
 * 热力榜单
 */
export const getPalTop = (params?: { date?: string; limit?: number }) => {
  return request
    .get<GetPalTopResult[]>('/stock-svc/ranking/top/plates', { params: { date: params?.date, limit: params?.limit ?? 10 } })
    .then(r => r.data)
}
getPalTop.cacheKey = 'pal:top'
