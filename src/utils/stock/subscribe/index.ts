import { useToken } from '@/store'
import { uid } from 'radash'
import { sysConfig } from '../../config'
import { Ws } from '../../ws'
import { type SubscribeEvent, subscribeEvent } from './event'
import type { SubscribeBuffer } from '../model/buff'
import { BarBuffer } from '../model/bar'
import { QuoteBuffer } from '../model/quote'
import { SnapshotBuffer } from '../model/snapshot'
import { RankBuffer } from '../model/rank'
import { SubscribeTopic } from '../model/type'
import { SysBuffer } from "../model/sys"

type RankSortKey = 'Amount' | 'Change' | 'Volume' | 'Close' | 'MarketCap'

export * from '../model/type'

class StockSubscribe {
  private static instance: StockSubscribe
  private subscribed = subscribeEvent
  private subscribeTopic: {
    [key: string]: {
      count: number
    }
  }
  private url: string
  private ws: Ws
  private cid: string
  private lastBeat: number

  private buffer: SubscribeBuffer[]
  private sysBuffer: SysBuffer

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
    this.lastBeat = Date.now()
    this.buffer = [
      new BarBuffer(this.subscribed),
      new QuoteBuffer(this.subscribed),
      new SnapshotBuffer(this.subscribed),
      new RankBuffer(this.subscribed)
    ]
    this.sysBuffer = new SysBuffer(this.subscribed)

    this.ws = new Ws(`${this.url}&cid=${this.cid}`, {
      beat: true,
      onMessage: ev => {
        const data = JSON.parse(ev.data)
        if (data.ev) {
          this.buffer.forEach(item => {
            if (item.isEqual(data)) {
              item.parser(data)
            }
          })
        }else if(data.event){
          this.sysBuffer.parser(data)
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

  public subscribe(action: SubscribeTopic, params: string[]) {
    if (action === SubscribeTopic.Snapshot && params.length > 0) {
      return this.snapshot(params[0])
    }
    // console.log('subscribe', action, params)
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

  public unsubscribe(action: SubscribeTopic, params: string[]) {
    params.forEach(symbol => {

      const topic = `${action}:${symbol}`
      // console.log(params, action, this.subscribeTopic[topic], topic, this.subscribeTopic)
      if (this.subscribeTopic[topic]) {
        this.subscribeTopic[topic].count--
      }
    })
  }

  /**
   * 订阅排行榜
   */
  public subscribeRank(params: { key: RankSortKey; sort: OrderSort; limit: string }) {
    const action = 'rank_subscribe'
    this.ws.send({
      action: action,
      cid: this.cid,
      params
    })
  }

  public unsubscribeRank() {
    const action = 'rank_unsubscribe'
    if (!this) return
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
      this.cleanSnapshot(symbol)
    }
  }

  /**
   * 清除快照订阅，不发送ws
   */
  private cleanSnapshot(symbol: string) {
    const topic = `snapshot:${symbol}`
    if (this.subscribeTopic[topic]) {
      this.subscribeTopic[topic].count--
    }
  }

  /**
   * 取消快照订阅
   */
  public unsubscribeSnapshot() {
    Object.keys(this.subscribeTopic).forEach(key => {
      if (key.startsWith('snapshot')) {
        delete this.subscribeTopic[key]
      }
    })

    this.ws.send({
      action: 'snapshot_unsubscribe',
      cid: this.cid
    })
  }

  /**
   * 取消所有订阅
   * @param code
   */
  public unsubscribeAll(code: SubscribeTopic) {
    this.subscribed.off(code)
  }

  public on<T extends SubscribeTopic>(action: T, handler: (data: SubscribeEvent[T]) => void) {
    this.subscribed.on(action, handler)

    return () => {
      this.off(action, handler)
    }
  }

  public off<T extends SubscribeTopic>(action: T, handler: (data: SubscribeEvent[T]) => void) {
    this.subscribed.off(action, handler)
  }

  /**
   * 单独订阅某个股票的quote
   * @returns cancelTopic
   */
  public onQuoteTopic(symbol: string, handler: (data: SubscribeEvent[SubscribeTopic.QuoteTopic]) => void) {
    const cancel = this.subscribe(SubscribeTopic.Quote, [symbol])
    this.subscribed.on(`quote:${symbol}` as SubscribeTopic.QuoteTopic, handler)

    return () => {
      this.offQuoteTopic(symbol, handler)
      cancel()
    }
  }

  public offQuoteTopic(symbol: string, handler: (data: SubscribeEvent[SubscribeTopic.QuoteTopic]) => void) {
    this.subscribed.off(`quote:${symbol}` as SubscribeTopic.QuoteTopic, handler)
  }

  private unSubscribeStockIdle() {
    const cleanTopic: Record<string, string[]> = {}

    for (const [key, value] of Object.entries(this.subscribeTopic)) {
      if (value.count <= 0) {
        delete this.subscribeTopic[key]
        const [action, symbol] = key.split(':')
        if (action === SubscribeTopic.Snapshot) {
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
    try {
      this.buffer.forEach(item => {
        item.handle()
      })
    }catch (e) {
      console.error(e)
    }

    setTimeout(() => {
      this.startBufferHandle()
    }, 100)
  }
}

export const stockSubscribe = StockSubscribe.get()
window.stockSubscribe = stockSubscribe
