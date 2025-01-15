import mitt from 'mitt'

type EventType = 'login' | 'toast' | 'cleanPickerStockMethod' | 'cleanPickerStockFactor' | 'not-login'


type Events = Record<EventType, any>

const appEvent = mitt<Events>()

export { appEvent }
