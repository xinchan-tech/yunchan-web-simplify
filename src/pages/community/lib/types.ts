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
  Notification = 8,

  Cmd = 99,
  System = '1002'
}

export enum ChatCmdType {
  MessageRevoke = 'messageRevoke',
  ChannelUpdate = 'channelUpdate',
  SubscriberForbidden = 'forbidden'
}

export interface ChatConfig {
  addr: string
  deviceFlag: number
  timezone: 'local' | 'us'
  timeFormat: 'ago' | 'time'
}

export enum ChatChannelState {
  Fetching = 0,
  Fetched = 1,
  FetchError = 2
}

export interface ChatStore {
  state: ConnectStatus
  config: ChatConfig
  channel?: Channel
  usersExpanded: boolean
}

export enum SubscriberType {
  ChannelOwner = '2',
  ChannelManager = '1',
  ChannelMember = '0'
}
