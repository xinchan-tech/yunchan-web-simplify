import { chatManager } from '@/store'
import mitt from "mitt"
import { ConnectStatus, type ConnectStatusListener } from 'wukongimjssdk'

export const connectStatusListener: ConnectStatusListener = (status, reasonCode, connectInfo) => {
  chatManager.setState(status)

  if (status === ConnectStatus.ConnectKick || status === ConnectStatus.ConnectFail) {
    console.warn('Warning: Connection failed or kicked, code: {}, info: {}', reasonCode, connectInfo)
  }
}


type ChatEvent = {
  mentionUser: {
    userInfo: {
      uid: string
      name: string
    },
    channelId: string
  }
}

export const chatEvent = mitt<ChatEvent>()