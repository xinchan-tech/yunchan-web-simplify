import { wsManager } from '../ws'
import { nanoid } from 'nanoid'
import mitt from 'mitt'
import { StockRecord, type StockResultRecord } from './stock'
import type { StockRawRecord } from '@/api'

type StockSubscribeHandler = (data: any) => void

class StockManager {
  private subscribed = mitt()
  // private cache: Map<string, Stock> = new Map()

  constructor() {
    const ws = wsManager.getActiveWs()
    if (ws) {
      ws.on('message', (data: any) => {
        console.log(data)
      })
    }
  }

  public toStockRecord(data: StockResultRecord) {
    return StockRecord.create(data)
  }

  public toSimpleStockRecord(data: StockRawRecord, symbol?: string, name?: string) {
    return StockRecord.of(symbol ?? '', name ?? '', data)
  }

  public subscribe(code: string | string[], handler: StockSubscribeHandler) {
    Array.isArray(code) ? code.forEach(item => this.subscribed.on(item, handler)) : this.subscribed.on(code, handler)

    const ws = wsManager.getActiveWs()

    if (ws) {
      ws.send({
        event: 'subscribe',
        data: {
          symbols: Array.isArray(code) ? code : [code]
        },
        msg_id: nanoid()
      })
    }
  }

  public unsubscribe(code: string | string[], handler: StockSubscribeHandler) {
    // biome-ignore lint/complexity/noForEach: <explanation>
    Array.isArray(code) ? code.forEach(item => this.subscribed.off(item, handler)) : this.subscribed.off(code, handler)

    if (Array.isArray(code)) {
      const unsubscribed = code.filter(item => this.subscribed.all.get(item)?.length === 0)

      if (unsubscribed.length === 0) return
      setTimeout(() => {
        const unsubscribed = code.filter(item => this.subscribed.all.get(item)?.length === 0)
        if (unsubscribed.length === 0) return

        const ws = wsManager.getActiveWs()

        if (ws) {
          ws.send({
            event: 'unsubscribe',
            data: {
              symbols: unsubscribed
            },
            msg_id: nanoid()
          })
        }
      })
    } else {
      if (this.subscribed.all.get(code)?.length === 0) {
        setTimeout(() => {
          // 再次判断是否有订阅者
          if (this.subscribed.all.get(code) && this.subscribed.all.get(code)!.length > 0) return
          const ws = wsManager.getActiveWs()
          if (ws) {
            ws.send({
              event: 'unsubscribe',
              data: {
                symbols: [code]
              },
              msg_id: nanoid()
            })
          }
        }, 3000)
      }
    }
  }

  public unsubscribeAll(code: string) {
    this.subscribed.off(code)
    const ws = wsManager.getActiveWs()
    if (ws) {
      ws.send({
        event: 'unsubscribe',
        data: {
          symbols: [code]
        },
        msg_id: nanoid()
      })
    }
  }
}

export const stockManager = new StockManager()
