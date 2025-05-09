import { nanoid } from "nanoid"

const BROADCAST_CHANNEL_NAME = 'today-chart'

export enum BroadcastChannelMessageType {
  CommunityOpen = 'community-open',
  CommunityClose = 'community-close',
  CommunityMessage = 'community-message',
  CommunityUnRead = 'community-unread',
  FocusCommunity = 'focus-community',
  UserChange = 'user-change',
  TokenChange = 'token-change',
}

type BroadcastChannelMessage = {
  id: string
  channelId: string
  type: BroadcastChannelMessageType
  data: any
}

export class TCBroadcast {
  static instance: TCBroadcast | null = null
  private channel: BroadcastChannel
  private channelId: string

  constructor() {
    this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME)
    this.channelId = nanoid()
  }

  static getBroadcastChannel = () => {
    if (!TCBroadcast.instance) {
      TCBroadcast.instance = new TCBroadcast()
    }
    return TCBroadcast.instance
  }

  static on(type: BroadcastChannelMessageType, callback: (e: MessageEvent<BroadcastChannelMessage>) => void) {
    const instance = TCBroadcast.getBroadcastChannel()
    const handler = (e: MessageEvent<BroadcastChannelMessage>) => {
      if (e.data.type === type) {
        callback(e)
      }
    }

    instance.channel.addEventListener('message', handler)

    return () => {
      instance.channel.removeEventListener('message', handler)
    }
  }

  static send(type: BroadcastChannelMessageType, data: any) {
    const instance = TCBroadcast.getBroadcastChannel()
    const message: BroadcastChannelMessage = {
      id: nanoid(8),
      channelId: instance.channelId,
      type,
      data,
    }
    instance.channel.postMessage(message)
  }

  static onUserChange(callback: (e: MessageEvent<BroadcastChannelMessage>) => void) {
    return TCBroadcast.on(BroadcastChannelMessageType.UserChange, callback)
  }

  static sendUser(user: any) {
    TCBroadcast.send(BroadcastChannelMessageType.UserChange, { user })
  }

  static onTokenChange(callback: (e: MessageEvent<BroadcastChannelMessage>) => void) {
    return TCBroadcast.on(BroadcastChannelMessageType.TokenChange, callback)
  }

  static sendToken(token?: string) {
    TCBroadcast.send(BroadcastChannelMessageType.TokenChange, { token })
  }
}