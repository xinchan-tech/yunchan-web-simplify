import type { Channel, ConnectStatus, Conversation } from 'wukongimjssdk'

export const chatConstants = {
  broadcastChannelId: 'chat-broadcast-channel'
}

export enum ChatMessageType {
  Text = 1,
  Image = 2,
  Audio = 3,
  Video = 4,
  File = 5,
  Location = 6,
  Custom = 7,
  Notification = 8
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
  lastChannel?: Channel
  usersExpanded: boolean
  channel: {
    state: ChatChannelState
    data: Conversation[]
  }
}
