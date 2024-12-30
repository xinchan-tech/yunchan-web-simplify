import { wsManager } from '../ws'
import { nanoid } from 'nanoid'
import mitt from 'mitt'
import { StockRecord, type StockResultRecord } from './stock'
import type { StockRawRecord } from '@/api'

type StockSubscribeHandler = (data: any) => void

class StockManager {
  private subscribed = mitt()
  private subscribeStock = new Map<symbol, { count: number }>()
  private subscribeTopic: string[] = []


  public toStockRecord(data: StockResultRecord) {
    return StockRecord.create(data)
  }

  public toSimpleStockRecord(data: StockRawRecord, symbol?: string, name?: string) {
    return StockRecord.of(symbol ?? '', name ?? '', data)
  }

  public subscribe(code: string | string[], handler: StockSubscribeHandler) {
    const _code = Array.isArray(code) ? code : [code]
    if(_code.length === 0) return
    _code.forEach(item => {
      const codeKey = Symbol.for(item)
      let stock = this.subscribeStock.get(codeKey)
      if (stock) {
        this.subscribeStock.set(Symbol.for(item), { count: stock.count + 1 })
      } else {
        this.subscribeStock.set(Symbol.for(item), { count: 1 })
      }

      stock = this.subscribeStock.get(codeKey)

      this.subscribed.on(item, handler)
    })

    // const ws = wsManager.getActiveWs()

    // if (ws) {
    //   ws.send({
    //     event: 'subscribe',
    //     data: {
    //       symbols: Array.isArray(code) ? code : [code]
    //     },
    //     msg_id: nanoid()
    //   })
    // }
  }

  public unsubscribe(code: string | string[], handler: StockSubscribeHandler) {
    const _code = Array.isArray(code) ? code : [code]

    _code.forEach(item => {
      const codeKey = Symbol.for(item)
      const stock = this.subscribeStock.get(codeKey)
      if (stock) {
        if (stock.count === 1) {
          this.subscribeStock.set(codeKey, { count: 0 })
        } else {
          this.subscribeStock.set(codeKey, { count: stock.count - 1 })
        }
      }

      this.subscribed.off(item, handler)
    })

    setTimeout(() => {
      const unsubscribed = Array.from(this.subscribeStock.entries()).filter(([_, value]) => value.count === 0).map(([key]) => key.description)
      if (unsubscribed.length === 0) return

      // const ws = wsManager.getActiveWs()

      // if (ws) {
      //   ws.send({
      //     event: 'unsubscribe',
      //     data: {
      //       symbols: unsubscribed
      //     },
      //     msg_id: nanoid()
      //   })
      // }
    }, 3000)
  }

  public unsubscribeAll(code: string) {
    this.subscribed.off(code)
    // const ws = wsManager.getActiveWs()
    // if (ws) {
    //   ws.send({
    //     event: 'unsubscribe',
    //     data: {
    //       symbols: [code]
    //     },
    //     msg_id: nanoid()
    //   })
    // }
  }
}

export const stockManager = new StockManager()
