import dayjs from 'dayjs'
import { getTrading } from '../date'
import type { StockExtendResultMap, StockRawRecord } from '@/api'
import Decimal from 'decimal.js'

export type StockTrading = 'preMarket' | 'intraDay' | 'afterHours' | 'close'

export type StockResultRecord = {
  symbol: string
  name: string
  stock: StockRawRecord
  extend?: StockExtendResultMap
}

export class StockRecord {
  name = ''
  code = ''
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

  collect: 0 | 1 = 0

  /**
   * 涨幅
   */
  percent: number
  /**
   *  涨跌额
   */
  percentAmount: number

  get symbol() {
    return this.code
  }

  /**
   * 是否涨
   */
  get isUp() {
    return this.percent >= 0
  }

  static isValid(data: any): data is StockRawRecord {
    return Array.isArray(data) && (data.length === 8 || data.length === 10)
  }

  static create(record: StockResultRecord): [StockRecord?, StockRecord?, StockRecord?] {
    const r: [StockRecord?, StockRecord?, StockRecord?] = []
    if (StockRecord.isValid(record.stock)) {
      r.push(new StockRecord(record.symbol, record.name, record.stock, record.extend))
    } else {
      r.push(undefined)
    }

    if (record.extend?.stock_before && StockRecord.isValid(record.extend.stock_before)) {
      r.push(new StockRecord(record.symbol, record.name, record.extend.stock_before))
    } else {
      r.push(undefined)
    }

    if (record.extend?.stock_after && StockRecord.isValid(record.extend.stock_after)) {
      r.push(new StockRecord(record.symbol, record.name, record.extend.stock_after))
    } else {
      r.push(undefined)
    }
    return r
  }

  static of(code: string, name: string, data: StockRawRecord, extend?: StockExtendResultMap) {
    return new StockRecord(code, name, data, extend)
  }

  constructor(code: string, name: string, data: StockRawRecord, extend?: StockExtendResultMap) {
    this.code = code
    this.name = name
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

    this.percent = this.calcPercent()
    this.percentAmount = Decimal.create(this.close).minus(this.prevClose).toNumber()

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
    this.percent = this.calcPercent()
    this.percentAmount = Decimal.create(this.close).minus(this.prevClose).toNumber()
    if (extend) {
      this.calcExtend(extend)
    }
  }

  private calcPercent() {
    const m = new Decimal(this.close).minus(this.prevClose)
    if (m.eq(0)) {
      return 0
    }
    return m.div(this.prevClose).toNumber()
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

    if (extend.collect) {
      this.collect = extend.collect
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

export class Stock {
  private records: StockRecord[] = []
  public name: string
  public symbol: string

  constructor(symbol: string, name: string) {
    this.symbol = symbol
    this.name = name
  }

  public getRecords() {
    return this.records
  }
  public insertRaw(raw: StockRawRecord, extend?: StockExtendResultMap) {
    if (this.records.length === 0) {
      this.records.push()
    } else {
      if (hasIndex(this.records, StockRecord.parseTime(raw[0]))) {
        const record = this.records.find(record => record.time === StockRecord.parseTime(raw[0]))
        record?.update(raw, extend)
      } else {
        const index = getInsertIndex(this.records, StockRecord.parseTime(raw[0]))

        this.records.splice(index, 0, new StockRecord(this.symbol, this.name, raw, extend))
      }
    }
  }

  public getLastRecord() {
    return this.records?.[this.records.length - 1]
  }

  public getLastRecordByTrading(trading: StockTrading) {
    return this.records?.filter(record => record.trading === trading).slice(-1)[0]
  }

  public getLastRecords(trading: StockTrading) {
    const r = []
    for (let index = this.records.length - 1; index >= 0; index--) {
      if (r.length !== 0) {
        if (this.records[index].time.slice(0, 8) !== r[r.length - 1].time.slice(0, 8)) {
          return r
        }
      }
      if (this.records[index].trading === trading) {
        r.unshift(this.records[index])
      }
    }

    return r
  }
  public insertRawByRecords(record: StockResultRecord[]) {
    for (const s of record) {
      if (StockRecord.isValid(s.stock)) {
        this.insertRaw(s.stock, s.extend)
      }

      if (s.extend?.stock_after && StockRecord.isValid(s.extend.stock_after)) {
        this.insertRaw(s.extend.stock_after, s.extend)
      }
      if (s.extend?.stock_before && StockRecord.isValid(s.extend.stock_before)) {
        this.insertRaw(s.extend.stock_before, s.extend)
      }
    }
  }
}

//根据二分法查找
const hasIndex = (times: StockRecord[], time: string) => {
  let left = 0
  let right = times.length - 1
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (times[mid].time === time) {
      return true
    }

    if (times[mid].time > time) {
      right = mid - 1
    } else {
      left = mid + 1
    }
  }
  return false
}

//根据二分查找获取时间列表的插入下标
const getInsertIndex = (times: StockRecord[], time: string) => {
  let left = 0
  let right = times.length - 1
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (times[mid].time === time) {
      return mid
    }

    if (times[mid].time > time) {
      right = mid - 1
    } else {
      left = mid + 1
    }
  }

  return left
}
