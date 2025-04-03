import mitt, { type Emitter } from 'mitt'

type Events = {
  login: unknown
  toast: { message: string }
  cleanPickerStockMethod: unknown
  cleanPickerStockFactor: unknown
  logout: unknown
}

// useToken.getState().removeToken()
// useUser.getState().reset()
const appEvent = mitt<Events>()

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

export { appEvent }
