import mitt, { type Emitter } from 'mitt'
import type { WsSubscribeType } from "./ws"
import { useEffect } from "react"

type Events = {
  login: unknown
  toast: { message: string }
  cleanPickerStockMethod: unknown
  cleanPickerStockFactor: unknown
  notAuth: unknown
  logout: Nullable<boolean>
  alarm: WsSubscribeType['alarm']
}

// useToken.getState().removeToken()
// useUser.getState().reset()


class EventEmitter<T extends Record<string, unknown>> {
  private event: Emitter<T>
  constructor() {
    this.event = mitt<T>()
  }

  on<K extends keyof T>(event: K, fn: (data: T[K]) => void) {
    this.event.on(event, fn)

    return () => {
      this.event.off(event, fn)
    }
  }

  off<K extends keyof T>(event: K, fn?: (data: T[K]) => void) {
    this.event.off(event, fn)
  }

  emit<K extends keyof T>(event: K, data: T[K]) {
    this.event.emit(event, data)
  }

  once<K extends keyof T>(event: K, fn: (data: T[K]) => void) {
    const onceFn = (data: T[K]) => {
      fn(data)
      this.event.off(event, onceFn)
    }

    this.event.on(event, onceFn)

    return () => {
      this.event.off(event, onceFn)
    }
  }

  removeAll() {
    this.event.all.clear()
  }
}

export const createEvent = <T extends Record<string, unknown>>() => {
  return new EventEmitter<T>()
}

const appEvent = createEvent<Events>()

export const useAppEvent = <T extends keyof Events>(event: T, cb: (e: Events[T]) => void) => {
  useEffect(() => {
    const unsubscribe = appEvent.on(event, cb)

    return () => {
      unsubscribe()
    }
  }, [cb, event])
}

export { appEvent, type EventEmitter }
