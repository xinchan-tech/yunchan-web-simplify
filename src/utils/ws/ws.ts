import mitt, { type Emitter } from 'mitt'

export type MessageEvent =
  | 'exist'
  | 'subscribe'
  | 'unsubscribe'
  | 'latest'
  | 'notice'
  | 'alarm'
  | 'chat'
  | 'newMessage'
  | 'shout_order'

const sleep = async (ms: number) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}


type SerializedMessage = string | number | boolean | Record<string, unknown>

type WsEvent = 'connect' | 'error' | 'close' | 'message' | 'beat' | '*' 

export class Ws {
  private url = ''
  /**
   * ws实例
   */
  private ws: WebSocket | null = null
  /**
   * 重试次数
   */
  private retryCount = 0
  /**
   * 最大重试次数
   */
  private maxRetryCount = 5
  /**
   * 重试间隔
   */
  private retryInterval = 3 * 1000
  /**
   * 心跳定时器
   */
  private heartbeatTimer: number | undefined = undefined
  /**
   * 心跳间隔
   */
  private heartbeatInterval = 3 * 1000
  /**
   * 最后一次心跳包ID
   */
  private lastHeartbeatId = 0
  /**
   * 延迟
   */
  public delay: undefined | number
  /**
   * event
   */
  private event: Emitter<Record<WsEvent, unknown>>
  /**
   *  手动关闭
   */
  private manualClose = false

  constructor(url: string) {
    this.url = url
    this.event = mitt()
    this.ws = new WebSocket(this.url)
    this.handleEvent()
  }

  private handleEvent() {
    if(!this.ws) return

    const startTime = Date.now().valueOf()
    this.ws.onopen = (ev: Event) => {
      const endTime = Date.now().valueOf()
      this.delay = endTime - startTime
      this.handleOpen()
      this.event.emit('connect', ev)
    }

    this.ws.onmessage = (ev: globalThis.MessageEvent) => {
      if (ev.data === 'pong') {
        this.event.emit('beat', ev)
      } else {
        this.event.emit('message', ev.data as globalThis.MessageEvent<MessageEvent>)
      }
    }

    this.ws.onclose = (ev: CloseEvent) => {
      this.event.emit('close', ev)
      this.closeHeartbeat()
      if (!this.manualClose) {
        this.retryConnect()
      }
    }

    this.ws.onerror = (ev: Event) => {
      this.event.emit('error', ev)
    }
  }

  private handleOpen() {
    this.retryCount = 0
    this.startHeartbeat()
  }

  public async send(data: SerializedMessage) {
    while(this.ws?.readyState !== WebSocket.OPEN){
      await sleep(1 * 100)
    }
    let _data: string
    if (typeof data === 'object') {
      _data = JSON.stringify(data)
    } else {
      _data = data.toString()
    }
    this.ws?.send(_data)
  }

  private startHeartbeat() {
    this.closeHeartbeat()

    this.heartbeatTimer = setInterval(() => {
      const start = Date.now().valueOf()
      this.ws?.send('ping')
      const heartbeatId = ++this.lastHeartbeatId
      const handler = () => {
        if (heartbeatId >= this.lastHeartbeatId) {
          const end = Date.now().valueOf()
          this.delay = end - start
        }
        this.event.off('beat', handler)
      }
      this.event.on('beat', handler)
    }, this.heartbeatInterval)
  }

  private retryConnect() {
    this.retryCount++
    if (this.retryCount > this.maxRetryCount) {
      console.log('重试次数过多，停止重试')
      return
    }
    setTimeout(() => {
      console.log('重连中...')
      this.ws = new WebSocket(this.url)
      this.handleEvent()
    }, this.retryInterval * this.retryCount)
  }

  private closeHeartbeat() {
    this.heartbeatTimer && clearInterval(this.heartbeatTimer)
    this.heartbeatTimer = undefined
  }

  public close() {
    this.closeHeartbeat()
    this.ws?.close()
    this.ws = null
    this.manualClose = true
  }

  public getIns() {
    return this.ws
  }


  public on(event: WsEvent, handler: (params: any) => void) {
    return this.event.on(event, handler)
  }


  public off(event: WsEvent, handler?: (params: any) => void) {
    return this.event.off(event, handler)
  }

  public getEvent() {
    return this.event
  }
}
