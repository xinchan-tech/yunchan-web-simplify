import { useServers } from '@/store'
import { Ws, type MessageEvent } from '.'
import { nanoid } from "nanoid"

export type MessageReceived<T> = {
  event: MessageEvent
  data: T[]
  msg_id: string
  time: number
}

export class WsManager {
  private cache: Map<string, Ws>
  private subscribed: Map<string, number>

  constructor() {
    this.cache = new Map()
    this.subscribed = new Map()
  }

  get(url: string) {
    return this.cache.get(url)
  }

  create(url: string) {
    if (this.cache.get(url)) return this.cache.get(url)!
    const ws = new Ws(url)
    this.cache.set(url, ws)
    return ws
  }

  async test(url: string): Promise<number | undefined> {
    return new Promise(resolve => {
      if (this.cache.get(url)) {
        const ws = this.cache.get(url)
        resolve(ws?.delay)
      } else {
        const ws = this.create(url)
        ws?.on('connect', () => {
          resolve(ws.delay)
          ws.off('*')
          ws.close()
          this.cache.delete(url)
        })
      }
    })
  }

  async testAll() {
    return await Promise.all(Array.from(this.cache.keys()).map(async url => this.test(url)))
  }

  getActiveWs() {
    return this.cache.get(useServers.getState().lastServer.ws)
  }

  subscribe(symbols: string[], vol?: string[]) {
    for (const symbol of symbols) {
      if (!this.subscribed.get(symbol)) {
        this.subscribed.set(symbol, 0)
      }
      this.subscribed.set(symbol, this.subscribed.get(symbol)! + 1)
    }

    const ws = this.getActiveWs()

    if(!ws){
      return
    }

    ws.send({
      event: 'subscribe',
      data: {
        symbols,
        vol
      },
      msg_id: nanoid()
    })

    const event = ws.getEvent()

    if(event){
      const handlers = event.all.get('message')
      if(handlers?.some(handler => handler === this.handleSubscribe))return
      event.on('message', this.handleSubscribe)
    }
    
  }


  private handleSubscribe(data: any) {
    const _data = data as MessageReceived<unknown>

    if (_data.event === 'subscribe') {
      console.log(_data)
    }
  }

  unsubscribe() {

  }
  
}

export const wsManager = new WsManager()
