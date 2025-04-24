import {
  getChannelDetail,
  getChannelMembers,
  getChatNameAndAvatar,
  syncChannelMessages,
  syncRecentConversation
} from '@/api'
import to from 'await-to-js'
import WKSDK, {
  Channel,
  ChannelInfo,
  ChannelTypeGroup,
  ChannelTypePerson,
  type Conversation,
  type Message,
  type MessageTask,
  type PullMode,
  Subscriber
} from 'wukongimjssdk'
import { userCache } from '../cache/user'
import { ChannelTransform, ConversationTransform, MessageTransform, SubscriberTransform } from './transform'
import { MediaMessageUploadTask } from './upload-task'
import { channelCache, subscriberCache } from "../cache"
import type { ChatChannel } from "./types"

export const syncChannelInfo = async (chatChannel: ChatChannel) => {
  const channel = new Channel(chatChannel.id, chatChannel.type)
  const channelInfo = new ChannelInfo()
 
  try {
    const params = {
      type: channel.channelType === ChannelTypeGroup ? '2' : '1',
      id: channel.channelID
    }

    const [err, r] = await to(Promise.all([getChatNameAndAvatar(params), getChannelDetail(channel.channelID)]))

    if (err) {
      console.error(err)
      return channelInfo
    }

    const [res, detail] = r

    if (channel.channelType === ChannelTypePerson) {
      channelInfo.title = res?.name || channel.channelID
      channelInfo.logo = res?.avatar ?? ''
      channelInfo.mute = false
      channelInfo.top = false
      channelInfo.orgData = {}
      channelInfo.online = false
      channelInfo.lastOffline = 0
      channelInfo.channel = channel
    } else {
      channelInfo.title = res?.name || channel.channelID
      channelInfo.logo = res?.avatar ?? ''
      channelInfo.mute = false
      channelInfo.top = false
      channelInfo.orgData = {}
      channelInfo.channel = channel
    }
    channelInfo.orgData = detail

    WKSDK.shared().channelManager.setChannleInfoForCache(channelInfo)

    channelCache.updateOrSave(ChannelTransform.toChatChannel(channelInfo))
  } catch (error) {
    console.error(error)
  }

  return channelInfo
}

/**
 * 请求频道资料数据源
 */
const initChannelInfoDataSource = () => {
  WKSDK.shared().config.provider.channelInfoCallback = async (channel: Channel) => {
    const channelInfo = await syncChannelInfo({id: channel.channelID, type: channel.channelType} as any)
    return channelInfo
  }
}

/**
 * 同步频道订阅者数据源
 * 订阅者就是群成员
 */
const initSyncSubscribersDataSource = () => {
  WKSDK.shared().config.provider.syncSubscribersCallback = async (channel: Channel) => {
    const subscribers: Subscriber[] = []

    const [err, res] = await to(getChannelMembers(channel.channelID, 999999))

    if (err) {
      console.error(err)
      return subscribers
    }

    res.items?.forEach(member => {
      const subscriber = new Subscriber()
      subscriber.uid = member.username
      subscriber.name = member.realname
      subscriber.orgData = member
      subscriber.avatar = member.avatar
      subscriber.channel = channel
      subscribers.push(subscriber)
    })

    const chatSubscribers = subscribers.map(SubscriberTransform.toChatSubscriber)

    userCache.updateBatch(
      chatSubscribers.map(member => ({
        uid: member.id,
        name: member.name,
        avatar: member.avatar
      }))
    )
    subscriberCache.updateByChannel(channel.channelID, chatSubscribers)

    return subscribers
  }
}

/**
 * 最近会话数据源
 */
const initSyncConversationsDataSource = () => {
  WKSDK.shared().config.provider.syncConversationsCallback = async () => {
    const resultConversations: Conversation[] = []
    const [err, res] = await to(syncRecentConversation({ uid: WKSDK.shared().config.uid!, msg_count: 20 }))

    if (err) {
      console.log(err)
      return resultConversations
    }

    if (res) {
      res.forEach(v => {
        const conversation = ConversationTransform.toConversation(v)
        resultConversations.push(conversation)
      })
    }

    return resultConversations
  }
}

/**
 * 同步频道消息数据源
 */
const initSyncMessagesDataSource = () => {
  WKSDK.shared().config.provider.syncMessagesCallback = async (
    channel: Channel,
    opts: {
      startMessageSeq: number
      endMessageSeq: number
      limit: number
      pullMode: PullMode
      remoteJump?: boolean
    }
  ) => {
    const [err, res] = await to(
      syncChannelMessages({ ...opts, channelId: channel.channelID, channelType: channel.channelType })
    )

    if (err) {
      console.log(err)
      return []
    }

    const r = new Array<Message>()
    try {
      if (res) {
        res.forEach((msg: any) => {
          r.push(MessageTransform.toMessage(msg))
        })
      }
    } catch (e) {
      console.error(e)
    }

    return r
  }
}

/**
 * 文件上传数据源
 */
const initFileUploadDataSource = () => {
  WKSDK.shared().config.provider.messageUploadTaskCallback = (message: Message): MessageTask => {
    return new MediaMessageUploadTask(message)
  }
}

export const initImDataSource = () => {
  initChannelInfoDataSource()
  initSyncSubscribersDataSource()
  initSyncConversationsDataSource()
  initSyncMessagesDataSource()
  initFileUploadDataSource()
}
