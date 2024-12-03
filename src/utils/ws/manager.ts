import { useServers } from '@/store'
import { Ws } from '.'


export class WsManager {
  private cache: Map<string, Ws>

  constructor() {
    this.cache = new Map()
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
    const ws = this.cache.get(useServers.getState().lastServer.ws)

    if(!ws) return this.create(useServers.getState().lastServer.ws)

    return ws
  }
}

export const wsManager = new WsManager()
