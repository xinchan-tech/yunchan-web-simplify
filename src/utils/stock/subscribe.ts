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


type BufferItem = {action: string, data: ReturnType<typeof barActionResultParser> | ReturnType<typeof quoteActionResultParser>, dirty: boolean}

class StockSubscribe {
  private subscribed = mitt<Record<string, any>>()
  private subscribeTopic: {
    [key: string]: {
      count: number
    }
  }
  private buffer: BufferItem[]
  private bufferMap: Map<string, BufferItem>
  private bufferHandleLength: number
  private url: string
  private ws: Ws
  private cid: string
  private bufferMax: number
  constructor(url: string) {
    this.url = url
    this.subscribeTopic = {}
    this.cid = uid(16)
    this.buffer = []
    this.bufferMap = new Map()
    this.bufferHandleLength = 10
    this.bufferMax = 2000
    this.ws = new Ws(`${this.url}&cid=${this.cid}`, {
      beat: false,
      onMessage: ev => {
        const data = JSON.parse(ev.data)
        if (data.ev) {
          const parserData = data.b ? barActionResultParser(data): quoteActionResultParser(data)
          if(this.bufferMap.has(parserData.topic)){
            const _old = this.bufferMap.get(parserData.topic)!
            _old.data = parserData
            // const _new = {action: parserData.topic, data: parserData, dirty: false}
            // this.bufferMap.set(parserData.topic, _new)
            // this.buffer.push(_new)
          }else{
            const _new = {action: parserData.topic, data: parserData, dirty: false}

            if(this.buffer.length >= this.bufferMax){
              const first = this.buffer.shift()
              this.bufferMap.delete(first!.data.topic)
            }

            this.bufferMap.set(parserData.topic, _new)
            this.buffer.push(_new)
          }
        }
      }
    })
    this.unSubscribeStockIdle()
    this.startBufferHandle()
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

  public on<T extends SubscribeActionType>(action: T, handler: StockSubscribeHandler<T>) {
    this.subscribed.on(action, handler)
  }

  public off<T extends SubscribeActionType>(action: T, handler: StockSubscribeHandler<T>) {
    this.subscribed.off(action, handler)
  }

  private unSubscribeStockIdle() {
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

    requestAnimationFrame(() => {
      this.unSubscribeStockIdle()
    })
  }

  private startBufferHandle(){
    let count = this.bufferHandleLength
    while(count > 0 && this.buffer.length > 0){
      const item = this.buffer.shift()!
     
      this.subscribed.emit(item.data.action, item.data)
      this.bufferMap.delete(item.data.action)
      count--
    }

    requestAnimationFrame(() => {
      this.startBufferHandle()
    })
  }

 
}

export const stockSubscribe = new StockSubscribe(`${import.meta.env.PUBLIC_BASE_WS_STOCK_URL}?token=shipeijun`)
