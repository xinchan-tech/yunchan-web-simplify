import { Ws } from '../ws'
import mitt from 'mitt'
import type { StockRawRecord } from '@/api'
import { uid } from "radash"

const barActionResultParser = (data: any) => {
  const action = data.ev as string
  const [topic, ...raws] = data.b.split(',')
  const rawRecord = raws.map((raw: string, index: number) => index === 0 ? raw : Number.parseFloat(raw as string)) as StockRawRecord

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
    volume: Number.parseFloat(raws[4]),
    turnover: Number.parseFloat(raws[5]),
  }

  return {
    action,
    topic: topic as string,
    record,
    extra: data.d as string
  }
}



export type StockSubscribeHandler<T extends SubscribeActionType> = T extends 'bar' ? (data: ReturnType<typeof barActionResultParser>) => void : (data: ReturnType<typeof quoteActionResultParser>) => void

export type SubscribeActionType = 'bar' | 'quote'
// export type UnsubscribeAction = 'bar_remove_symbols' | 'quote_remove_symbols'



class StockSubscribe {
  private subscribed = mitt<Record<string, any>>()
  private subscribeTopic: {
    [key: string]: {
      count: number
    }
  }

  private url: string
  private ws: Ws
  private cid: string
  constructor(url: string) {
    this.url = url
    this.subscribeTopic = {}
    this.cid = uid(16)
    this.ws = new Ws(`${this.url}&cid=${this.cid}`, {
      beat: false,
      onMessage: ev => {
        const data = JSON.parse(ev.data)
        if (data.ev) {
         if(data.b){
          const parserData = barActionResultParser(data)
          this.subscribed.emit(parserData.action, parserData)
         }else{
          const parserData = quoteActionResultParser(data)
          this.subscribed.emit(parserData.action, parserData)
         }
        }
      }
    })
    this.unSubscribeStockIdle()
  }

  public subscribe(action: SubscribeActionType, params: string[]) {
    const _action = `${action}_add_symbols`
    const _params: string[] = []
    params.forEach(symbol => {
      const topic = `${action}:${symbol}`
      if (this.subscribeTopic[topic]) {
        this.subscribeTopic[topic].count++
      } else {
        this.subscribeTopic[topic] = { count: 1 }
        _params.push(symbol)
      }
    })

    if(_params.length > 0){
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

  public unsubscribeAll(code: string) {
    this.subscribed.off(code)
  }

  public unSubscribeStockIdle() {
    const cleanTopic: Record<string, string[]> = {}

    for (const [key, value] of Object.entries(this.subscribeTopic)) {
      if (value.count === 0) {
        delete this.subscribeTopic[key]
        const [action, symbol] = key.split(':')
        if(!cleanTopic[action]){
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

    requestIdleCallback(() => {
      this.unSubscribeStockIdle()
    })
  }

  public on<T extends SubscribeActionType>(action: T, handler: StockSubscribeHandler<T>) {
    this.subscribed.on(action, handler)
  }

  public off<T extends SubscribeActionType>(action: T, handler: StockSubscribeHandler<T>) {
    this.subscribed.off(action, handler)
  }
}

export const stockSubscribe = new StockSubscribe(`${import.meta.env.PUBLIC_BASE_WS_STOCK_URL}?token=shipeijun`)
