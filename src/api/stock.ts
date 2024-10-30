import request from '@/utils/request'
import dayjs from "dayjs"
import { md5 } from "js-md5"
import { sha256 } from "js-sha256"
import { customAlphabet } from "nanoid"

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
 | [StockTime, StockOpen, StockClose, StockHigh, StockLow, StockVolume, StockTurnover, StockCumulativeVolume, StockCumulativeTurnover, StockPrevClose]
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
  IN = 0,
  BEFORE = -1,
  AFTER = -2,
  DAY = 1440,
  FIVE_DAY = 7200,
  WEEK = 10080,
  MONTH = 43200,
  QUARTER = 129600,
  HALF_YEAR = 259200,
}

export enum StockChartType {
  BEFORE = -1,
  IN = 0,
  AFTER = 1,
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

  if(!params._tr){
    params._tr = dayjs().valueOf().toString() + customAlphabet('0123456789', 6)()
  }

  const paramsKeySort = Object.keys(params).sort() as (keyof typeof params)[]

  const paramsStr = paramsKeySort.reduce((acc, key) => `${acc}${key}=${params[key]}&`, '').slice(0, -1)

  const sign = md5(sha256(paramsStr))


  return request.get<GetStockChartResult>('/stock/chart', { params, headers: { sign, "Content-Type": 'application/x-www-form-urlencoded' } }).then(r => r.data)
}
