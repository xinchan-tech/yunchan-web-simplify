import mitt from 'mitt'

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

export { appEvent }
