import mitt from 'mitt'

type EventType = 'login'

type Events = Record<EventType, unknown>

const appEvent = mitt<Events>()

export {
  appEvent
}