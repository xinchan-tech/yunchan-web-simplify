import type { StockRawRecord } from '@/api'
import mitt from 'mitt'
import { uid } from 'radash'
import { Ws } from '../ws'
import { sysConfig } from '../config'
import { useToken } from '@/store'

const barActionResultParser = (data: any) => {
  const action = data.ev as string
  const [topic, ...raws] = data.b.split(',')
  const rawRecord = raws.map((raw: string, index: number) =>
    index === 0 ? raw : Number.parseFloat(raw as string)
  ) as StockRawRecord

  /**
   * 新版是开高低收
   * 旧版是开收高低
   */
  rawRecord[2] = raws[4]
  rawRecord[3] = raws[2]
  rawRecord[4] = raws[3]

  return {
    action,
    topic: topic as string,
    rawRecord,
    extra: data.d as string
  }
}

const quoteActionResultParser = (data: any) => {
  const action = data.ev as string
  const [topic, ...raws] = data.q.split(',')
  const record = {
    symbol: topic,
    time: Number.parseInt(raws[0]),
    close: Number.parseFloat(raws[1]),
    preClose: Number.parseFloat(raws[2]),
    changePercent: Number.parseFloat(raws[3]),
    percent: (Number.parseFloat(raws[1]) - Number.parseFloat(raws[2])) / Number.parseFloat(raws[2]),
    volume: Number.parseFloat(raws[4]),
    turnover: Number.parseFloat(raws[5])
  }

  return {
    action,
    topic: topic as string,
    record,
    extra: data.d as string
  }
}

const snapshotActionResultParser = (data: any) => {
  const action = data.ev as string
  const {
    symbol,
    w52_high,
    w52_low,
    day_high,
    day_open,
    day_low,
    day_close,
    day_amount,
    day_volume,
    market_cap,
    turnover,
    pe,
    pb,
    pre_close,
    updated,
    ext_updated,
    day_updated,
    ext_price,
    bubble_val,
    bubble_status
  } = data.detail

  return {
    action,
    topic: action as string,
    data: {
      symbol,
      w52High: w52_high,
      w52Low: w52_low,
      dayHigh: day_high,
      dayOpen: day_open,
      dayLow: day_low,
      close: day_close,
      dayAmount: day_amount,
      dayVolume: day_volume,
      marketCap: market_cap,
      turnover,
      pe,
      pb,
      prevClose: pre_close,
      updated,
      extPrice: ext_price,
      extUpdated: ext_updated,
      dayUpdated: day_updated,
      bubbleVal: bubble_val,
      bubbleStatus: bubble_status
    } as {
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
    }
  }
}

const rankActionResultParser = (data: any) => {
  const action = data.ev as string
  const r = data.ls as Record<number, number[]>

  return {
    action,
    topic: action as string,
    data: Object.entries(r).map(([key, value]) => {
      const [symbol, close, percent, volume, turnover, marketValue] = value
      return {
        rank: Number.parseInt(key),
        symbol: String(symbol),
        close: close,
        percent,
        volume,
        turnover,
        marketValue
      }
    })
  }
}

export type StockSubscribeHandler<T extends SubscribeActionType> = T extends 'bar'
  ? (data: ReturnType<typeof barActionResultParser>) => void
  : T extends 'quoteTopic'
    ? (data: ReturnType<typeof quoteActionResultParser>) => void
    : T extends 'quote'
      ? (data: QuoteBuffer) => void 
      : T extends 'rank_subscribe' ? (data: ReturnType<typeof rankActionResultParser>) => void
      : (data: ReturnType<typeof snapshotActionResultParser>) => void 

export type SubscribeActionType = 'bar' | 'quote' | '' | 'snapshot' | 'quoteTopic' | 'rank_subscribe'

type BufferItem = {
  action: string
  data: ReturnType<typeof barActionResultParser> | ReturnType<typeof quoteActionResultParser>
}

/**
 * quote 时间窗口buffer结构
 */
export type QuoteBuffer = Record<string, ReturnType<typeof quoteActionResultParser>>

/**
 * snapshot 时间窗口buffer结构
 */
type SnapshotBuffer = Record<string, ReturnType<typeof snapshotActionResultParser>>
/**
 * 排行榜buffer结构
 */
type RankBuffer = Record<string, ReturnType<typeof rankActionResultParser>>

type RankSortKey = 'Amount' | 'Change' | 'Volume' | 'Close' | 'MarketCap'

class StockSubscribe {
  private static instance: StockSubscribe
  private subscribed = mitt<Record<string, any>>()
  private subscribeTopic: {
    [key: string]: {
      count: number
    }
  }
  private buffer: BufferItem[]
  private bufferHandleLength: number
  private url: string
  private ws: Ws
  private cid: string
  private bufferMax: number
  private quoteBuffer: QuoteBuffer
  private snapshotBuffer: SnapshotBuffer
  private rankBuffer: RankBuffer
  private lastBeat: number

  static get() {
    const token = useToken.getState().token || uid(14)
    if (!StockSubscribe.instance) {
      StockSubscribe.instance = new StockSubscribe(`${sysConfig.PUBLIC_BASE_WS_STOCK_URL}?token=${token}`)
    }
    return StockSubscribe.instance
  }

  constructor(url: string) {
    this.url = url
    this.subscribeTopic = {}
    this.cid = uid(16)
    this.buffer = []
    this.bufferHandleLength = 500
    this.bufferMax = 20000
    this.quoteBuffer = {}
    this.snapshotBuffer = {}
    this.rankBuffer = {}
    this.lastBeat = Date.now()

    this.ws = new Ws(`${this.url}&cid=${this.cid}`, {
      beat: true,
      onMessage: ev => {
        const data = JSON.parse(ev.data)
        if (data.ev) {
          if (data.ev === 'snapshot') {
            const parserData = snapshotActionResultParser(data)
            this.snapshotBuffer[parserData.topic] = parserData
            return
          }

          if (data.ev === 'rank') {
            const parserData = rankActionResultParser(data)
            this.rankBuffer[parserData.topic] = parserData
            return
          }
          
          if (data.b) {
            const parserData = barActionResultParser(data)
            this.buffer.push({ action: parserData.topic, data: parserData })
            if (this.buffer.length > this.bufferMax) {
              this.buffer.shift()
            }
          } else {
            const parserData = quoteActionResultParser(data)
            this.quoteBuffer[parserData.topic] = parserData
          }
        }
      },
      onReconnect: () => {
        console.warn('reconnect stock ws')
        this.reSubscribe()
      }
    })
    this.unSubscribeStockIdle()
    this.startBufferHandle()
    this.startCheckWsStatus()
  }

  /**
   * 重新订阅
   */
  private reSubscribe() {
    const quote: string[] = []
    const bar: string[] = []
    for (const [topic, { count }] of Object.entries(this.subscribeTopic)) {
      if (!count) continue

      const [action, symbol] = topic.split(':')

      if (action === 'quote') {
        quote.push(symbol)
      }

      if (action === 'bar') {
        bar.push(symbol)
      }

      if (action === 'snapshot') {
        this.ws.send({
          action: `${action}_subscribe`,
          cid: this.cid,
          params: symbol
        })
      }
    }

    if (quote.length) {
      this.ws.send({
        action: 'quote_add_symbols',
        cid: this.cid,
        params: quote
      })
    }

    if (bar.length) {
      this.ws.send({
        action: 'bar_add_symbols',
        cid: this.cid,
        params: bar
      })
    }
  }

  public subscribe(action: SubscribeActionType, params: string[]) {
    if (action === 'snapshot' && params.length > 0) {
      return this.snapshot(params[0])
    }

    const _action = `${action}_add_symbols`
    const _params: string[] = []

    if (Object.keys(this.subscribeTopic).filter(topic => topic.startsWith('quote')).length > 1000) {
      console.warn('股票价格订阅数大于1000， 取消订阅')
      return () => {}
    }

    params.forEach(symbol => {
      const topic = `${action}:${symbol}`
      if (this.subscribeTopic[topic]) {
        this.subscribeTopic[topic].count++
      } else {
        this.subscribeTopic[topic] = { count: 1 }
        _params.push(symbol)
      }
    })

    if (_params.length > 0) {
      this.ws.send({
        action: _action,
        cid: this.cid,
        params: _params
      })
    }

    return () => {
      this.unsubscribe(action, params)
    }
  }

  public unsubscribe(action: SubscribeActionType, params: string[]) {
    params.forEach(symbol => {
      const topic = `${action}:${symbol}`
      if (this.subscribeTopic[topic]) {
        this.subscribeTopic[topic].count--
      }
    })
  }

  /**
   * 订阅排行榜
   */
  public subscribeRank(params: {key: RankSortKey, sort: OrderSort, limit: string}) {
    const action = 'rank_subscribe'

    this.ws.send({
      action: action,
      cid: this.cid,
      params
    })
  }

  public unsubscribeRank() {
    const action = 'rank_unsubscribe'
    if(!this) return
    this.ws.send({
      action: action,
      cid: this.cid
    })
  }

  /**
   * 订阅快照
   * @param symbol
   * @returns
   */
  private snapshot(symbol: string) {
    const action = 'snapshot'
    const topic = `${action}:${symbol}`

    if (this.subscribeTopic[topic]) {
      this.subscribeTopic[topic].count++
    } else {
      this.subscribeTopic[topic] = { count: 1 }
      this.ws.send({
        action: `${action}_subscribe`,
        cid: this.cid,
        params: symbol
      })
    }

    return () => {
      this.unsubscribeSnapshot(symbol)
    }
  }

  /**
   * 取消快照订阅
   */
  private unsubscribeSnapshot(symbol: string) {
    const topic = `snapshot:${symbol}`
    if (this.subscribeTopic[topic]) {
      this.subscribeTopic[topic].count--
    }

    if (this.subscribeTopic[topic].count <= 0) {
      delete this.subscribeTopic[topic]
      this.ws.send({
        action: 'snapshot_unsubscribe',
        cid: this.cid,
        params: symbol
      })
    }
  }

  /**
   * 取消所有订阅
   * @param code
   */
  public unsubscribeAll(code: string) {
    this.subscribed.off(code)
  }

  public on<T extends SubscribeActionType>(action: T, handler: StockSubscribeHandler<T>) {
    this.subscribed.on(action, handler)

    return () => {
      this.off(action, handler)
    }
  }

  public off<T extends SubscribeActionType>(action: T, handler: StockSubscribeHandler<T>) {
    this.subscribed.off(action, handler)
  }

  /**
   * 单独订阅某个股票的quote
   * @returns cancelTopic
   */
  public onQuoteTopic(symbol: string, handler: StockSubscribeHandler<'quoteTopic'>) {
    this.subscribe('quote', [symbol])
    this.subscribed.on(`${symbol}:quote`, handler)

    return () => {
      this.offQuoteTopic(symbol, handler)
      this.unsubscribe('quote', [symbol])
    }
  }

  public offQuoteTopic(topic: string, handler: StockSubscribeHandler<'quoteTopic'>) {
    this.subscribed.off(`${topic}:quote`, handler)
  }

  private unSubscribeStockIdle() {
    const cleanTopic: Record<string, string[]> = {}

    for (const [key, value] of Object.entries(this.subscribeTopic)) {
      if (value.count <= 0) {
        delete this.subscribeTopic[key]
        const [action, symbol] = key.split(':')
        if (action === 'snapshot') {
          // 手动取消
          // this.ws.send({
          //   action: 'snapshot_unsubscribe',
          //   cid: this.cid,
          //   params: symbol
          // })
          continue
        }

        if (!cleanTopic[action]) {
          cleanTopic[action] = []
        }
        cleanTopic[action].push(symbol)
      }
    }

    Object.entries(cleanTopic).forEach(([action, symbols]) => {
      this.ws.send({
        action: `${action}_remove_symbols`,
        cid: this.cid,
        params: symbols
      })
    })

    requestAnimationFrame(() => {
      this.unSubscribeStockIdle()
    })
  }

  private startCheckWsStatus() {
    const current = Date.now()
    if (current > this.lastBeat + 1000 * 60 * 1) {
      if (this.ws.status === 'error' || this.ws.status === 'close') {
        console.warn(`ws beat check status ${this.ws.status}`)
        this.ws.reconnect()
      }
      this.lastBeat = current
    }

    requestAnimationFrame(() => {
      this.startCheckWsStatus()
    })
  }

  /**
   * quote以时间窗口的方式推送
   * 每300ms推送一次
   */
  private startBufferHandle() {
    let count = this.bufferHandleLength
    const quoteBuffer = this.quoteBuffer
    this.quoteBuffer = {}

    while (count > 0 && this.buffer.length > 0) {
      const item = this.buffer.shift()!

      this.subscribed.emit(item.data.action, item.data)
      // if(item.data.topic.indexOf('@') === -1){

      //   this.subscribed.emit(`${item.data.topic}:quote`, item.data)
      // }
      // this.bufferMap.delete(item.data.action)
      count--
    }

    Object.entries(quoteBuffer).forEach(([topic, data]) => {
      this.subscribed.emit(`${topic}:quote`, data)
    })
    this.subscribed.emit('quote', quoteBuffer)

    const snapshotBuffer = Object.entries(this.snapshotBuffer)
    this.snapshotBuffer = {}
    snapshotBuffer.forEach(([topic, data]) => {
      this.subscribed.emit(topic, data)
    })

    const rankBuffer = Object.entries(this.rankBuffer)
    this.rankBuffer = {}
    rankBuffer.forEach(([topic, data]) => {
      this.subscribed.emit(topic, data)
    })

    setTimeout(() => {
      this.startBufferHandle()
    }, 300)
  }
}

export const stockSubscribe = StockSubscribe.get()
window.stockSubscribe = stockSubscribe
