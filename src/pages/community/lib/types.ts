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
  NotConnect = -1,
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
  ownerId: string
  userNum: number
  notice: string
  inChannel: boolean
  state?: ChatChannelState
}

export type ChatMessage = ChatSystemMessage | ChatTextMessage | ChatImageMessage | ChatCmdMessage
export type ChatMessageTypes<T extends ChatMessageType> = T extends ChatMessageType.Text
  ? ChatTextMessage
  : T extends ChatMessageType.Image
    ? ChatImageMessage
    : T extends ChatMessageType.Cmd
      ? ChatCmdMessage
      : never

export type ChatUser = {
  id: string
  name: string
  avatar: string
}

export type ChatSubscriber = ChatUser & {
  uid: string
  channelId: string
  type: SubscriberType
  hasForbidden: boolean
  isManager: boolean
  isOwner: boolean
}

type MessageBase = {
  id: string
  channel: ChatChannel
  content: string
  senderId: string
  senderName: string
  date: number
  status: Message['status']
  clientSeq: number
  timestamp: number
  messageSeq: number
}

export type ChatSystemMessage = MessageBase & {
  type: ChatMessageType.System
}

export type ChatTextMessage = MessageBase & {
  type: ChatMessageType.Text
  senderAvatar?: string
  mentionUser: ChatUser[]
  mentionAll: boolean
  revoke: boolean
  reply?: ChatReplyContent
}

export type ChatImageMessage = MessageBase & {
  type: ChatMessageType.Image
  senderAvatar?: string
  width: number
  height: number
  revoke: boolean
  reply?: ChatReplyContent
}

export type ChatReplyContent = {
  replyMessageContent: string
  replySenderId: string
  replySenderName: string
  replySenderAvatar: string
  replyMessageId: string
  replyMessageType: ChatMessageType.Image | ChatMessageType.Text
}

export type ChatCmdMessage = MessageBase & { type: ChatMessageType.Cmd } & (
    | {
        cmdType: ChatCmdType.MessageRevoke
        messageId: string
      }
    | {
        cmdType: ChatCmdType.ChannelUpdate
        channelId: string
      }
    | {
        cmdType: ChatCmdType.SubscriberForbidden
        channelId: string
        uid: string
      }
  )

export interface ChatSession {
  id: string
  channel: ChatChannel
  message?: ChatMessage
  unRead: number
  isMentionMe: boolean
  uid: string
}
