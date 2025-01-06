import mitt, { type Emitter } from 'mitt'
import { Ws } from '.'

export type MessageReceived<T> = {
  event: WsEvent
  data: T
  msg_id: string
  time: number
}

const wsUrl = `ws://${window.location.hostname}${window.location.port ? `:${window.location.port}` : ''}${import.meta.env.PUBLIC_BASE_WS_URL}`

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
type EventResult<T extends WsEvent> = T extends 'default'
  ? DefaultEventResult
  : T extends 'login'
    ? LoginEventResult
    : MessageReceived<any>

export class WsManager {
  private url: string
  private ws: Ws
  private event: Emitter<Record<WsEvent, any>>
  constructor(url: string) {
    this.url = url
    this.event = mitt<Record<WsEvent, any>>()
    this.ws = new Ws(this.url, {
      onClose: ev => {
        this.event.emit('close', ev)
      },
      onError: ev => {
        this.event.emit('error', ev)
      },
      onMessage: ev => {
        const data = JSON.parse(ev.data) as MessageReceived<any>

        this.event.emit(data.event, data)
      },
      onOpen: ev => {
        this.event.emit('connect', ev)
      }
    })
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
    this.ws.send(data)
  }
}

export const wsManager = new WsManager(wsUrl)
