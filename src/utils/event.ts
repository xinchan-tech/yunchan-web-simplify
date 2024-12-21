import mitt from 'mitt'

type EventType = 'login' | 'toast' | 'cleanPickerStockMethod' | 'cleanPickerStockFactor'


type Events = Record<EventType, unknown>

const appEvent = mitt<Events>()

export { appEvent }
