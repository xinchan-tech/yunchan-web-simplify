import mitt from 'mitt'

type EventType = 'login' | 'toast' | string

type Events = Record<EventType, unknown>

const appEvent = mitt<Events>()

export {
  appEvent
}