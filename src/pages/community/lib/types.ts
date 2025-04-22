import type { Channel, ChannelInfo, ConnectStatus, Conversation, Message } from 'wukongimjssdk'

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
  state: ChatConnectStatus
  config: ChatConfig
  channel?: ChatChannel
  usersExpanded: boolean
}

export enum SubscriberType {
  ChannelOwner = '2',
  ChannelManager = '1',
  ChannelMember = '0'
}

export enum ChatConnectStatus {
  Disconnect = 0,
  Connected = 1,
  Connecting = 2,
  ConnectFail = 3,
  ConnectKick = 4,
  Syncing = 5,
  SyncingFail = 6
}

export interface ChatChannel {
  id: Channel['channelID']
  name: ChannelInfo['title']
  avatar: ChannelInfo['logo']
  type: Channel['channelType']
  state?: ChatChannelState
}

export type ChatMessage = ChatSystemMessage | ChatTextMessage | ChatImageMessage | ChatCmdMessage

type ChatUser = {
  id: string
  name: string
  avatar: string
}

type ChatSubscriber = ChatUser & {
  channelId: string
  type: SubscriberType
  hasForbidden: boolean
  isManager: boolean
}

type MessageBase = {
  id: string
  channel: ChatChannel
  content: string
  senderId: string
  senderName: string
  date: number
  status: Message['status']
}

export type ChatSystemMessage = MessageBase & {
  type: ChatMessageType.System
}

export type ChatTextMessage = MessageBase & {
  type: ChatMessageType.Text
  senderAvatar: string
  mentionUser: ChatUser[]
  mentionAll: boolean
}

export type ChatImageMessage = MessageBase & {
  type: ChatMessageType.Image
  senderAvatar: string
}

export type ChatCmdMessage = MessageBase & {
  type: ChatMessageType.Cmd
  cmdType: ChatCmdType
}


export interface ChatSession {
  id: string
  channel: ChatChannel
  message?: ChatMessage
  unRead: number
  isMentionMe: boolean
}