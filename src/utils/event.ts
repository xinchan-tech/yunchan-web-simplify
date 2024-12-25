import mitt from 'mitt'

type EventType = 'login' | 'toast' | 'cleanPickerStockMethod' | 'cleanPickerStockFactor' | 'not-login'


type Events = Record<EventType, unknown>

const appEvent = mitt<Events>()

export { appEvent }
