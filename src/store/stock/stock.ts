import type { StockRawRecord } from "@/api"
import Decimal from "decimal.js"


class StockRecord {
  time: string; // 时间
  open: number; // 开盘价
  close: number; // 收盘价（最新价）
  high: number; // 最高价
  low: number; // 最低价
  volume: number; // 当前时段成交量
  turnover: number; // 当前时段成交额
  cumulativeVolume: number; // 当日累计成交量
  cumulativeTurnover: number; // 当日累计成交额
  prevClose: number; // 前收盘价
  //涨幅
  get percent() {
    return new Decimal(this.close).minus(this.prevClose).div(this.prevClose).toNumber()
  }

  constructor(data: StockRawRecord) {
    this.time = data[0];
    this.open = data[1];
    this.close = data[2];
    this.high = data[3];
    this.low = data[4];
    this.volume = data[5];
    this.turnover = data[6];
    if(data.length === 10){
      this.cumulativeVolume = data[7];
      this.cumulativeTurnover = data[8];
      this.prevClose = data[9];
    } else {
      this.cumulativeVolume = 0
      this.cumulativeTurnover = 0
      this.prevClose = data[7];
    }
  }
}

export class Stock {
  private symbol: symbol;
  private name: string;
  private records: Record<string, StockRecord>;
  private times: string[]

  constructor(symbol: string, name: string) {
    this.symbol = Symbol.for(symbol);
    this.name = name;
    this.times = [];
    this.records = {};
  }

  getCode() {
    return this.symbol.toString();
  }

  getSymbol() {
    return this.symbol;
  }

  insertForRaw(raw: StockRawRecord) {
    const record = new StockRecord(raw);
    if(this.records[record.time]) return
    this.records[record.time] = record;
    this.insertTimeOrder(record.time)
  }

  private insertTimeOrder(time: string) {
    if (this.times.length === 0) {
      this.times.push(time);
      return;
    }
    const index = this.times.findIndex((t) => t > time);
    if (index === -1) {
      this.times.push(time);
    } else {
      this.times.splice(index, 0, time);
    }
  }

  getName(){
    return this.name
  }

  getDataSet() {
    return this.times.map((time) => this.records[time])
  }

  forEach(cb: (record: StockRecord, time: string) => void){
    for (const time of this.times) {
      cb(this.records[time], time)
    }
  }
}