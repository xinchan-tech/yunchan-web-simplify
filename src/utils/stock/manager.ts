import { wsManager } from '../ws'
import { nanoid } from 'nanoid'
import mitt from 'mitt'
import { StockRecord, type StockResultRecord } from './stock'

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

  public subscribe(code: string, handler: StockSubscribeHandler) {
    this.subscribed.on(code, handler)

    const ws = wsManager.getActiveWs()

    if (ws) {
      ws.send({
        event: 'subscribe',
        data: {
          symbols: [code]
        },
        msg_id: nanoid()
      })
    }
  }

  public unsubscribe(code: string, handler: StockSubscribeHandler) {
    this.subscribed.off(code, handler)

    if (this.subscribed.all.get(code)?.length === 0) {
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
