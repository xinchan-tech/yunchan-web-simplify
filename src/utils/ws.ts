import { useConfig, useToken } from '@/store'
import { client } from 'websocket'

type MessageEvent =
  | 'exist'
  | 'subscribe'
  | 'unsubscribe'
  | 'latest'
  | 'notice'
  | 'alarm'
  | 'chat'
  | 'newMessage'
  | 'shout_order'

export type MessageReceived<T> = {
  event: MessageEvent
  data: T[]
  msg_id: string
  time: number
}

const cache: Map<string, JknWebSocket> = new Map()

type SerializedMessage = string | number | boolean | Record<string, unknown>

export class JknWebSocket {
  private url = ''
  /**
   * ws实例
   */
  private ws: client | null = null
  /**
   * 心跳定时器
   */
  private heartbeatTimer: number | undefined = undefined
  /**
   * 心跳间隔
   */
  private heartbeatInterval = 3 * 1000
  /**
   * 延迟
   */
  public delay: undefined | number

  constructor(url: string) {
    this.url = url
    this.ws = new client()
    this.ws.connect(url)

    this.ws.on('connect', () => {
      console.log('connect')
      cache.set(this.url, this)
      this.startHeartbeat()
    })

    // this.ws.on('error', e => {
    //   console.log(e)
    //   this.closeHeartbeat()
    // })

    // this.ws.on('close', e => {
    //   console.log(e)
    //   cache.delete(this.url)
    //   this.closeHeartbeat()
    // })
  }

  public send(data: SerializedMessage) {
    let _data: string
    if (typeof data === 'object') {
      _data = JSON.stringify(data)
    } else {
      _data = data.toString()
    }
    this.ws?.emit(_data)
  }

  private startHeartbeat() {
    this.closeHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      const start = Date.now().valueOf()
      this.ws?.emit('ping', res => {
        const end = Date.now().valueOf()
        this.heartbeatInterval = end - start
        console.log(res)
      })
    }, this.heartbeatInterval)
  }

  private closeHeartbeat() {
    this.heartbeatTimer && clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = undefined
  }

  public close() {
    this.ws?.close()
    this.ws = null
    this.closeHeartbeat()
  }

  public getIns = () => this.ws

  public static create(url: string){
    if(cache.get(url)) return cache.get(url)!
    console.log(cache.get(url))
    return new JknWebSocket(url)
  }
}
