import type { ConnectStatus, Conversation } from 'wukongimjssdk'

export const chatConstants = {
  broadcastChannelId: 'chat-broadcast-channel'
}

export interface ChatConfig {
  addr: string
  deviceFlag: number
}

export enum ChatChannelState {
  Fetching = 0,
  Fetched = 1,
  FetchError = 2
}

export interface ChatStore {
  state: ConnectStatus
  config: ChatConfig
  channel: {
    state: ChatChannelState
    data: Conversation[]
  }
}
