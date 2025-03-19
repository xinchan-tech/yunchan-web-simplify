import type { getChannelDetail } from "@/api"
import { ChannelInfo, MessageText, Subscriber } from 'wukongimjssdk'

export enum SubscriberType {
  ChannelOwner = '2',
  ChannelManager = '1',
  ChannelMember = '0'
}

export class ChatSubscriber extends Subscriber {
  public forbidden = false
  public userType: SubscriberType = SubscriberType.ChannelMember


  get isChannelOwner() {
    return this.userType === SubscriberType.ChannelOwner
  }

  get isChannelManager() {
    return this.userType === SubscriberType.ChannelManager
  }
  
}

export const isMessageText = (message: any): message is MessageText => {
  return message instanceof MessageText
}

export class ChatChannelInfo extends ChannelInfo {
  public detail: Awaited<ReturnType<typeof getChannelDetail>> | null = null
}