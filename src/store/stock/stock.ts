import type { StockRawRecord } from '@/api'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'

export type StockTrading = 'preMarket' | 'intraDay' | 'afterHours'

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
  // 市值
  get marketValue() {
    return this.close * this.cumulativeVolume
  }
  //涨幅
  get percent() {
    return new Decimal(this.close).minus(this.prevClose).div(this.prevClose).toNumber()
  }

  constructor(data: StockRawRecord) {
    this.time = data[0]
    this.open = data[1]
    this.close = data[2]
    this.high = data[3]
    this.low = data[4]
    this.volume = data[5]
    this.turnover = data[6]
    if (data.length === 10) {
      this.cumulativeVolume = data[7]
      this.cumulativeTurnover = data[8]
      this.prevClose = data[9]
    } else {
      this.cumulativeVolume = 0
      this.cumulativeTurnover = 0
      this.prevClose = data[7]
    }
  }
}

export class Stock {
  private symbol: symbol
  private name: string
  private records: Record<string, StockRecord>
  private times: string[]
  //时间段
  private period: Record<string, Record<StockTrading, string[]>>

  constructor(symbol: string, name: string) {
    this.symbol = Symbol.for(symbol)
    this.name = name
    this.times = []
    this.records = {}
    this.period = {}
  }

  getCode() {
    return this.symbol.description as string
  }

  getSymbol() {
    return this.symbol
  }

  insertForRaw(raw: StockRawRecord) {
    const record = new StockRecord(raw)
    if (this.records[record.time]) return
    this.records[record.time] = record
    this.insertTimeOrder(record.time)
    this.insertPeriodOrder(record.time)
  }

  private insertTimeOrder(time: string) {
    if (this.times.length === 0) {
      this.times.push(time)
      return
    }
    const index = this.times.findIndex(t => t > time)
    if (index === -1) {
      this.times.push(time)
    } else {
      this.times.splice(index, 0, time)
    }
  }

  private insertPeriodOrder(time: string) {
    const date = dayjs(time)

    const period = date.format('YYYY-MM-DD')

    if (!this.period[period]) {
      this.period[period] = {
        preMarket: [],
        intraDay: [],
        afterHours: []
      }
    }

    const p = this.period[period]
    let per: string[]

    //盘前交易时间段
    if (date.isBefore(date.hour(9).minute(30))) {
      per = p.preMarket
    } else if (date.isBefore(date.hour(16).minute(0))) {
      //盘中交易时间段
      per = p.intraDay
    } else {
      //盘后交易时间段
      per = p.afterHours
    }

    const index = per.findIndex(t => t > time)
    if(index !== -1){
      per.push(time)
    }else{
      per.splice(index, 0, time)
    }
  }

  getName() {
    return this.name
  }

  getDataSet() {
    return this.times.map(time => this.records[time])
  }

  forEach(cb: (record: StockRecord, time: string) => void) {
    for (const time of this.times) {
      cb(this.records[time], time)
    }
  }

  get lastRecord() {
    return this.records[this.times[this.times.length - 1]]
  }

  /**
   * 根据周期获取最新数据
   */
  getLastRecords(period: StockTrading) {
    const periods = Object.keys(this.period)
    periods.sort()

    //倒序查找
    for (let i = periods.length - 1; i >= 0; i--) {
      const p = this.period[periods[i]]
      
      if(p[period].length > 0){
        const time = p[period][p[period].length - 1]
        return this.records[time]
      }
    }
  }
}
