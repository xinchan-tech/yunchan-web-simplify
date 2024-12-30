type SerializedMessage = string | number | boolean | Record<string, unknown>

type WsOptions = {
  onError?: (ev: Event) => void
  onMessage?: (ev: MessageEvent) => void
  onClose?: (ev: CloseEvent) => void
  onOpen?: (ev: Event) => void
  onBeat?: () => void
  beat?: boolean
}

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
   * 延迟
   */
  public delay: undefined | number
  /**
   *  手动关闭
   */
  private manualClose = false
  /**
   * 消息队列
   */
  private messageQueue: SerializedMessage[] = []
  /**
   * 选项
   */
  private options: WsOptions

  constructor(url: string, options?: Partial<WsOptions>) {
    this.url = url
    this.ws = new WebSocket(this.url)
    this.options = options || {}
    this.handleEvent()
    this.startQueueMessage()
  }

  private handleEvent() {
    if (!this.ws) return

    const startTime = Date.now().valueOf()
    this.ws.onopen = (ev: Event) => {
      const endTime = Date.now().valueOf()
      this.delay = endTime - startTime
      this.handleOpen()
      this.options.onOpen?.(ev)
    }

    this.ws.onclose = (ev: CloseEvent) => {
      this.closeHeartbeat()
      if (!this.manualClose) {
        this.retryConnect()
      }

      this.options.onClose?.(ev)
    }

    this.ws.onerror = (ev: Event) => {
      this.options.onError?.(ev)
    }

    this.ws.onmessage = (ev: MessageEvent) => {
      if (ev.data === 'pong') {
        this.options.onBeat?.()
        return
      }
      this.options.onMessage?.(ev)
    }
  }

  private handleOpen() {
    this.retryCount = 0
    if(!this.options.beat) return
    this.startHeartbeat()
  }

  public send(data: SerializedMessage) {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      this.messageQueue.push(data)
      return
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
      this.ws?.send('ping')
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

  private startQueueMessage() {
    // 使用requestIdleCallback处理消息队列
    if (this.ws?.readyState !== WebSocket.OPEN) {
      requestIdleCallback(() => {
        this.startQueueMessage()
      })
      return
    }
    if (this.messageQueue.length === 0) {
      requestIdleCallback(() => {
        this.startQueueMessage()
      })
      return
    }

    const message = this.messageQueue.shift()
    if (message) {
      this.send(message)
    }
    requestIdleCallback(() => {
      this.startQueueMessage()
    })
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
}
