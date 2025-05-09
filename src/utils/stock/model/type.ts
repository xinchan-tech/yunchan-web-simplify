import type { StockRawRecord } from "@/api"

export enum SubscribeTopic {
  Bar = 'bar',
  Quote = 'quote',
  QuoteTopic = 'quoteTopic',
  Snapshot = 'snapshot',
  Rank = 'rank',
  Sys = 'sys'
}

export type SubscribeBarType = {
  action: string
  topic: string
  rawRecord: StockRawRecord
  extra: string
  symbol: string
}

export type SubscribeQuoteType = {
  action: string
  topic: string
  record: {
    symbol: string
    time: number
    close: number
    preClose: number
    changePercent: number
    percent: number
    volume: number
    turnover: number
    marketValue: number
  },
  extra: string
  symbol: string
}

export type SubscribeSnapshotType = {
  action: string
  topic?: string
  symbol?: string

  data: Partial<{
    dayAmount: number // 当日成交金额
    close: number // 当日收盘价
    w52High: number // 当日最高价
    dayLow: number // 当日最低价
    dayOpen: number // 当日开盘价
    dayVolume: number // 当日成交量
    marketCap: number // 市值
    pb: number // 市净率
    pe: number // 市盈率
    prevClose: number // 昨日收盘价
    symbol: string // 股票代码
    turnover: number // 换手率
    updated: number // 更新时间戳
    w52Low: number // 52周最低价
    extPrice: number // 扩展价格
    extUpdated: number // 扩展更新时间戳
    dayUpdated: number // 当日更新时间戳
    dayHigh: number
    bubbleVal: number // 泡沫值
    bubbleStatus: number // 泡沫状态
  }>
}

export type SubscribeRankType = {
  action: string
  topic?: string
  symbol?: string
  data: {
    rank: number
    symbol: string
    close: number
    percent: number
    volume: number
    turnover: number
    marketValue: number
    prePercent: number
    afterPercent: number
  }[]
}

export type SubscribeSysType = {
  action: string
  event: string
  status: string
  subscribed: string
}