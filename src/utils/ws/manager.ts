import type { AlarmType } from '@/api'
// import { AlarmType } from '@/api'
import { sysConfig } from '@/utils/config.ts'
import mitt, { type Emitter } from 'mitt'
import { Ws } from '.'
// import { useToken } from '@/store'
import { createEvent } from '../event'

export type MessageReceived<T> = {
  event: WsEvent
  data: T
  msg_id: string
  time: number
}

const wsProtocol = document.location.protocol === 'https:' ? 'wss' : 'ws'

const wsUrl = `${wsProtocol}://${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}${import.meta.env.PUBLIC_BASE_WS_URL}`

const wsUrlV2 = sysConfig.PUBLIC_BASE_WS_URL_V2

type WsEvent =
  | 'connect'
  | 'error'
  | 'close'
  | 'login'
  | 'message'
  | 'beat'
  | 'exist'
  | 'subscribe'
  | 'unsubscribe'
  | 'latest'
  | 'notice'
  | 'alarm'
  | 'chat'
  | 'newMessage'
  | 'shout_order'
  | 'ack'
  | 'default'
  | 'alarm_v2'
  | 'opinions'

type DefaultEventResult = {
  cluster_name: string
  data: {
    msg: string
  }
  event: 'default'
  fd: number
  msg_id: string
  time: string
}

type LoginEventResult = MessageReceived<{
  msg: string
  token: string
  user: {
    id: number
    user_type: number
  }
}>

type AlarmEventResult = MessageReceived<{
  content: {
    bull: string
    category_ids: number[]
    category_hdly_ids: number[]
    indicators: string
    coiling: any
    symbol: string
    stock_cycle: number
    alarm_time: string
  }
}>

type AckEventResult = MessageReceived<unknown>

type ChatEventResult = MessageReceived<{
  content: string
  from_uid: string
  group_id: number
  type: number
  user_id: string
}>

export type EventResult<T extends WsEvent> = T extends 'default'
  ? DefaultEventResult
  : T extends 'login'
    ? LoginEventResult
    : T extends 'alarm'
      ? AlarmEventResult
      : T extends 'ack'
        ? AckEventResult
        : T extends 'chat'
          ? ChatEventResult
          : MessageReceived<any>

export class WsManager {
  // private url: string
  private ws: Nullable<Ws>
  private event: Emitter<Record<WsEvent, any>>
  constructor(_url: string) {
    // this.url = url
    this.event = mitt<Record<WsEvent, any>>()
    // this.ws = new Ws(this.url, {
    //   onClose: ev => {
    //     this.event.emit('close', ev)
    //   },
    //   onError: ev => {
    //     this.event.emit('error', ev)
    //   },
    //   onMessage: ev => {
    //     const data = JSON.parse(ev.data) as MessageReceived<any>

    //     this.event.emit(data.event, data)
    //   },
    //   onOpen: ev => {
    //     this.event.emit('connect', ev)
    //   }
    // })
  }

  public on<T extends WsEvent>(event: T, handler: (data: EventResult<T>) => void) {
    this.event.on(event, handler)

    return () => {
      this.off(event, handler)
    }
  }

  public off<T extends WsEvent>(event: T, handler: (data: EventResult<T>) => void) {
    this.event.off(event, handler)
  }

  public send(data: any) {
    this.ws?.send(data)
  }
}

type WsMessage = AlarmMessage

type AlarmMessage = {
  event: 'alarm'
  data: {
    id: number
    type: AlarmType
    symbol: string
    stock_cycle: number
    indicators: string
    bull: '0' | '1'
    score_total: number
    alarm_time: number
    hdly: string
    pnl_percent: number
    pnl_price: number
    trigger_price: number
    trigger_type: number
    base_price: number
  }
}

export type WsSubscribeType = {
  alarm: AlarmMessage['data']
}

export class WsV2 {
  private url: string
  private ws: Ws
  static instance: Nullable<WsV2> = null
  private subscribe: ReturnType<typeof createEvent<WsSubscribeType>>

  constructor(token: string) {
    this.url = `${wsUrlV2}?token=${token}`
    this.ws = new Ws(this.url, {
      beat: true,
      onMessage: (ev: MessageEvent<string>) => {
        const data = JSON.parse(ev.data) as WsMessage
        if (data.event === 'alarm') {
          this.subscribe.emit('alarm', data.data)
        } else {
          // this.subscribe.emit(data.event, data.data)
        }
      }
    })
    this.subscribe = createEvent<WsSubscribeType>()
  }

  get token() {
    return this.url.split('?')[1].split('=')[1]
  }

  close() {
    this.ws.close()
  }

  onAlarm(handler: (data: WsSubscribeType['alarm']) => void) {
    return this.subscribe.on('alarm', handler)
  }

  static create(token: string) {
    if (!WsV2.instance) {
      WsV2.instance = new WsV2(token)
      return WsV2.instance
    }

    const ins = WsV2.instance

    if (ins.token !== token) {
      ins.close()
      WsV2.instance = new WsV2(token)
    }

    return WsV2.instance
  }

  static getWs() {
    return WsV2.instance
  }
}

export const wsManager = new WsManager(wsUrl)
