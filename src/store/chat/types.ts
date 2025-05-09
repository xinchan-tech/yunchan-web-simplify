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
  lastChannelReady: boolean
  usersExpanded: boolean
}


export interface AssetsInfoStore {
  data: any;
  setData: (data: any) => void;
  refreshData: () => void;
}