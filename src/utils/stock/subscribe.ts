import { Ws } from '../ws'
import mitt from 'mitt'
import type { StockRawRecord } from '@/api'
import { uid } from "radash"

const barActionResultParser = (data: any) => {
  const action = data.ev as string
  const [topic, ...raws] = data.b.split(',')
  const rawRecord = raws.map((raw: string, index: number) => index === 0 ? raw : Number.parseFloat(raw as string)) as StockRawRecord

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


type BufferItem = {action: string, data: ReturnType<typeof barActionResultParser> | ReturnType<typeof quoteActionResultParser>}

/**
 * quote 时间窗口buffer结构
 */
type QuoteBuffer = Record<string, ReturnType<typeof quoteActionResultParser>>

class StockSubscribe {
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
  constructor(url: string) {
    this.url = url
    this.subscribeTopic = {}
    this.cid = uid(16)
    this.buffer = []
    this.bufferHandleLength = 500
    this.bufferMax = 20000
    this.quoteBuffer = {}
    this.ws = new Ws(`${this.url}&cid=${this.cid}`, {
      beat: false,
      onMessage: ev => {
        const data = JSON.parse(ev.data)
        if (data.ev) {
          if(data.b){
            const parserData = barActionResultParser(data) 
            this.buffer.push({action: parserData.topic, data: parserData})
            if(this.buffer.length > this.bufferMax){
              this.buffer.shift()
            }
          }else{
            const parserData = quoteActionResultParser(data)
            this.quoteBuffer[parserData.topic] = parserData
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

    return () => {
      this.off(action, handler)
    }
  }

  public off<T extends SubscribeActionType>(action: T, handler: StockSubscribeHandler<T>) {
    this.subscribed.off(action, handler)
  }

  public onQuoteTopic(topic: string, handler: StockSubscribeHandler<'quote'>) {
    this.subscribed.on(`${topic}:quote`, handler)

    return () => {
      this.offQuoteTopic(topic, handler)
    }
  }

  public offQuoteTopic(topic: string, handler: StockSubscribeHandler<'quote'>) {
    this.subscribed.off(`${topic}:quote`, handler)
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

  /**
   * quote以时间窗口的方式推送
   * 每300ms推送一次
   */
  private startBufferHandle(){
    let count = this.bufferHandleLength
    const quoteBuffer = Object.entries(this.quoteBuffer)
    this.quoteBuffer = {}
    quoteBuffer.forEach(([topic, data]) => {
      this.subscribed.emit(`${topic}:quote`, data)
      this.subscribed.emit(topic, data)
    })
    
    while(count > 0 && this.buffer.length > 0){
      const item = this.buffer.shift()!
     
      this.subscribed.emit(item.data.action, item.data)
      // if(item.data.topic.indexOf('@') === -1){

      //   this.subscribed.emit(`${item.data.topic}:quote`, item.data)
      // }
      // this.bufferMap.delete(item.data.action)
      count--
    }
  
    setTimeout(() => {
      this.startBufferHandle()
    }, 300)
  }
}

const token = uid(14)

export const stockSubscribe = new StockSubscribe(`${import.meta.env.PUBLIC_BASE_WS_STOCK_URL}?token=${token}`)
