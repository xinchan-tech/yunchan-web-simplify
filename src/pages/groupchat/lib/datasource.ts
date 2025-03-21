import { getChannelMembers, getChatNameAndAvatar, syncChannelMessages, syncRecentConversation } from '@/api'
import to from 'await-to-js'
import WKSDK, {
  type Channel,
  ChannelInfo,
  ChannelTypeGroup,
  ChannelTypePerson,
  type Conversation,
  type Message,
  type MessageTask,
  type PullMode,
  Subscriber
} from 'wukongimjssdk'
import { ConversationTransform, MessageTransform } from './transform'
import { MediaMessageUploadTask } from './upload-task'

/**
 * 请求频道资料数据源
 */
const initChannelInfoDataSource = () => {
  WKSDK.shared().config.provider.channelInfoCallback = async (channel: Channel) => {
    const channelInfo = new ChannelInfo()

    try {
      const params = {
        type: channel.channelType === ChannelTypeGroup ? '2' : '1',
        id: channel.channelID
      }

      const [err, res] = await to(getChatNameAndAvatar(params))

      if (err) {
        console.log(err)
        return channelInfo
      }

      if (channel.channelType === ChannelTypePerson) {
        channelInfo.title = res.name || channel.channelID
        channelInfo.logo = res.avatar
        channelInfo.mute = false
        channelInfo.top = false
        channelInfo.orgData = {}
        channelInfo.online = false
        channelInfo.lastOffline = 0
        channelInfo.channel = channel
      } else {
        channelInfo.title = res.name || channel.channelID
        channelInfo.logo = res.avatar
        channelInfo.mute = false
        channelInfo.top = false
        channelInfo.orgData = {}
        channelInfo.channel = channel
      }

      // channelInfo.detail = detail
    } catch (error) {
      console.error(error)
    }

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

    const [err, res] = await to(getChannelMembers(channel.channelID, 100))

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
      // subscriber.userType = member.type as SubscriberType
      // subscriber.forbidden = member.forbidden === '1'
      subscribers.push(subscriber)
    })

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

    console.log(resultConversations, 'resultConversations')

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
