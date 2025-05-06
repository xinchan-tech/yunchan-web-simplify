import {
  MessageContent,
  type Channel,
  type ChannelInfo,
  type Message
} from 'wukongimjssdk'

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
  System = '1002',
  ChannelUpdate = 1005,
  Vote = 612
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
  rightHide: boolean
  chatConfig: {
    voteShow: Record<string, { show: boolean; voteId: number }>
  }
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

export enum ChatChannelType {
  Public = '0',
  OnlyManager = '1',
  OnlyOwner = '2'
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
  chatType: ChatChannelType
  tags?: string
  editable: boolean
  maxCount: number
  brief?: string
  isReadNotice: boolean
}

export type ChatMessage =
  | ChatSystemMessage
  | ChatTextMessage
  | ChatImageMessage
  | ChatCmdMessage
  | ChatChannelUpdateMessage
  | ChatVoteMessage
export type ChatMessageTypes<T extends ChatMessageType> = T extends ChatMessageType.Text
  ? ChatTextMessage
  : T extends ChatMessageType.Image
    ? ChatImageMessage
    : T extends ChatMessageType.Cmd
      ? ChatCmdMessage
      : T extends ChatMessageType.ChannelUpdate
        ? ChatChannelUpdateMessage
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
  file?: File
}

export type ChatReplyContent = {
  replyMessageContent: string
  replySenderId: string
  replySenderName: string
  replySenderAvatar: string
  replyMessageId?: string
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

export type ChatChannelUpdateMessage = MessageBase & {
  type: ChatMessageType.ChannelUpdate
  content: string
}

export type ChatVoteMessage = MessageBase & {
  type: ChatMessageType.Vote
  title: string
  voteId: number
}

export interface ChatSession {
  id: string
  channel: ChatChannel
  message?: ChatMessage
  unRead: number
  isMentionMe: boolean
  uid: string
}

export type ChatDraft = {
  key: string
  content: any
  channel: ChatChannel
}

export class VoteMessageContent extends MessageContent {
  cmd!: string
  title!: string
  voteId!: number
  type!: number

  decodeJSON(content: any): void {
    this.cmd = content.cmd
    this.title = content.param.title
    this.voteId = content.param.vote_id
    this.type = +content.type
  }

  encodeJSON(): any {
    return {
      cmd: this.cmd,
      params: {
        title: this.title,
        vote_id: this.voteId
      },
      type: this.type.toString()
    }
  }
}
