import type { StockExtendResultMap, StockRawRecord } from '@/api'
import { getTrading } from '@/utils/date'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'

export type StockTrading = 'preMarket' | 'intraDay' | 'afterHours' | 'close'

export type StockResultRecord = {
  symbol: string
  stock: StockRawRecord
  extend?: StockExtendResultMap
}

export class StockRecord {
  time: string // 时间
  open: number // 开盘价
  close: number // 收盘价（最新价）
  high: number // 最高价
  low: number // 最低价
  volume: number // 当前时段成交量
  turnover: number // 当前时段成交额
  cumulativeVolume: number // 当日累计成交量
  cumulativeTurnover: number // 当日累计成交额
  prevClose: number // 前收盘价
  trading: StockTrading
  // 市值
  marketValue: number
  // 换手率
  turnOverRate: number
  // 所属行业
  industry: string
  // 市盈率
  pe: number
  // 市净率
  pb: number
  //
  totalShare: number
  // 缩略走势图
  thumbs: string[] = []

  //涨幅
  get percent() {
    const m = new Decimal(this.close).minus(this.prevClose)
    if (m.eq(0)) {
      return 0
    }
    return m.div(this.prevClose).toNumber()
  }

  static isValid(data: any): data is StockRawRecord {
    return Array.isArray(data) && (data.length === 8 || data.length === 10)
  }

  static create(record: StockResultRecord): [StockRecord?, StockRecord?, StockRecord?] {
    const r: [StockRecord?, StockRecord?, StockRecord?] = []
    if (StockRecord.isValid(record.stock)) {
      r.push(new StockRecord(record.stock, record.extend))
    } else {
      r.push(undefined)
    }

    if (record.extend?.stock_before && StockRecord.isValid(record.extend.stock_before)) {
      r.push(new StockRecord(record.extend.stock_before))
    } else {
      r.push(undefined)
    }

    if (record.extend?.stock_after && StockRecord.isValid(record.extend.stock_after)) {
      r.push(new StockRecord(record.extend.stock_after))
    } else {
      r.push(undefined)
    }
    return r
  }

  constructor(data: StockRawRecord, extend?: StockExtendResultMap) {
    this.time = StockRecord.parseTime(data[0])
    this.open = data[1]
    this.close = data[2]
    this.high = data[3]
    this.low = data[4]
    this.volume = data[5]
    this.turnover = data[6] * 10000
    this.trading = this._getTrading(this.time)
    this.industry = '-'
    this.pe = 0
    this.pb = 0
    this.totalShare = 0

    this.marketValue = 0
    this.turnOverRate = 0
    if (data.length === 10) {
      this.cumulativeVolume = data[7]
      this.cumulativeTurnover = data[8]
      this.prevClose = data[9]
    } else {
      this.cumulativeVolume = 0
      this.cumulativeTurnover = 0
      this.prevClose = data[7]
    }

    if (extend) {
      this.calcExtend(extend)
    }
  }

  update(data: StockRawRecord, extend?: StockExtendResultMap) {
    this.time = StockRecord.parseTime(data[0])
    this.open = data[1]
    this.close = data[2]
    this.high = data[3]
    this.low = data[4]
    this.volume = data[5]
    this.turnover = data[6] * 10000
    this.trading = this._getTrading(this.time)
    this.industry = '-'

    if (data.length === 10) {
      this.cumulativeVolume = data[7]
      this.cumulativeTurnover = data[8]
      this.prevClose = data[9]
    } else {
      this.cumulativeVolume = 0
      this.cumulativeTurnover = 0
      this.prevClose = data[7]
    }

    if (extend) {
      this.calcExtend(extend)
    }
  }

  private calcExtend(extend: StockExtendResultMap) {
    if (extend.total_share) {
      this.totalShare = extend.total_share
      this.marketValue = extend.total_share * this.close
      this.turnOverRate = this.turnover / this.marketValue

      if (extend.net_income_loss) {
        this.pe = this.marketValue / extend.net_income_loss
      }

      // 市净率(P/B Ratio):
      // 计算公式:
      // 市净率 = 股票市价 / 每股净资产
      // 其中:
      // 股票市价 = 股票当前的市场价格
      // 每股净资产 = (公司总资产 - 总负债) / 总股本
      if (extend.liabilities_and_equity && extend.liabilities) {
        this.pb = this.close / ((extend.liabilities_and_equity - extend.liabilities) / extend.total_share)
      }
    }

    if (extend.basic_index as string) {
      this.industry = extend.basic_index as string
    }

    if (extend.thumbs && extend.thumbs.length > 0) {
      this.thumbs = extend.thumbs
    }
  }

  private _getTrading(time: string) {
    return getTrading(time)
  }

  /**
   * 判断时间数据
   * 2024-09-10 不带时间默认为盘中数据，自动补齐
   */
  static parseTime(time: string) {
    if (time.length === 10) {
      return `${dayjs(time).format('YYYY-MM-DD')} 15:59:00`
    }
    return time
  }
}
