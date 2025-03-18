import { chatManager } from '@/store'
import mitt from "mitt"
import { ConnectStatus, type Message, type ConnectStatusListener } from 'wukongimjssdk'

export const connectStatusListener: ConnectStatusListener = (status, reasonCode, connectInfo) => {
  chatManager.setState(status)

  if (status === ConnectStatus.ConnectKick || status === ConnectStatus.ConnectFail) {
    console.warn('Warning: Connection failed or kicked, code: {}, info: {}', reasonCode, connectInfo)
  }
}


export type ChatEvent = {
  mentionUser: {
    userInfo: {
      uid: string
      name: string
    },
    channelId: string
  },
  revokeMessage: {
    channelId: string
    message: Message
  },
  replyMessage: {
    channelId: string
    message: Message
  },
  copyMessage: {
    channelId: string
    message: Message
  }
}

export const chatEvent = mitt<ChatEvent>()

