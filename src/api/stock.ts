import request from '@/utils/request'
import dayjs from 'dayjs'
import { md5 } from 'js-md5'
import { sha256 } from 'js-sha256'
import { customAlphabet } from 'nanoid'
import pako from 'pako'

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
    const data = atob(r as unknown as string)

    const dataUint8 = new Uint8Array(data.length)

    for (let i = 0; i < data.length; i++) {
      dataUint8[i] = data.charCodeAt(i)
    }

    r = JSON.parse(pako.inflate(dataUint8, { to: 'string' })) as GetStockChartResult
  }

  return r
}
getStockChart.cacheKey = 'stock:chart'

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
  const r = await request.get<GetStockCollectsResult>('/collects', { params }).then(r => r.data)
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
 * 经济数据详情
 */
export const getStockEconomicDetail = (key: string) => {
  return request.get<GetStockEconomicDetailResult>('/stock/economic/info', { params: { key } }).then(r => r.data)
}
getStockEconomicDetail.cacheKey = 'stock:economic:detail'

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
  type: string
  value: string
  name?: string
  param?: string | any[][]
}

type GetStockIndicatorsResult = {
  main: {
    db_type: 'system' | 'user'
    id: string
    indicators:
      | {
          authorized: 1 | 0
          id: string
          name: string
          items: StockIndicator[]
        }[]
      | StockIndicator[]
    name: string
  }[]
  secondary: GetStockIndicatorsResult['main']
}

/**
 * 指标列表
 */
export const getStockIndicators = () => {
  return request.get<GetStockIndicatorsResult>('/stock/indicators').then(r => r.data)
}
getStockIndicators.cacheKey = 'stock:indicators'

type GetStockIndicatorDataParams = {
  symbol: string
  id: string
  cycle: StockChartInterval
  start_at?: string
  params?: string
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
    update_at: string
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
      update_at: string
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
