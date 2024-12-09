import mitt from 'mitt'

type EventType = 'login' | 'toast' | string | 'render-secondary-indicator'


type Events = Record<EventType, unknown>

const appEvent = mitt<Events>()

export { appEvent }
