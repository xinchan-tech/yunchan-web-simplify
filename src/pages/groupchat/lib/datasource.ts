import { getChatNameAndAvatar, getChannelMembers, syncChannelMessages, syncRecentConversation } from '@/api'
import { Buffer } from 'buffer'
import to from 'await-to-js'
import WKSDK, {
  Channel,
  ChannelInfo,
  ChannelTypeGroup,
  ChannelTypePerson,
  Conversation,
  Message,
  MessageExtra,
  MessageStatus,
  type MessageTask,
  type PullMode,
  Setting
} from 'wukongimjssdk'
import { chatManager } from '@/store'
import { ChatChannelState } from '@/store/chat/types'
import { stringToUint8Array } from '@/utils/string'
import { messageTransform } from './transform'
import { ChatSubscriber, type SubscriberType } from './modal'
import { MediaMessageUploadTask } from './upload-task'

/**
 * 请求频道资料数据源
 */
const initChannelInfoDataSource = () => {
  WKSDK.shared().config.provider.channelInfoCallback = async (channel: Channel) => {
    const channelInfo = new ChannelInfo()

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
      channelInfo.title = res?.name || channel.channelID
      channelInfo.logo = res?.avatar
      channelInfo.mute = false
      channelInfo.top = false
      channelInfo.orgData = {}
      channelInfo.online = false
      channelInfo.lastOffline = 0
      channelInfo.channel = channel
    } else {
      channelInfo.title = res?.name || channel.channelID
      channelInfo.logo = res?.avatar
      channelInfo.mute = false
      channelInfo.top = false
      channelInfo.orgData = {}
      channelInfo.channel = channel
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
    const subscribers: ChatSubscriber[] = []

    const [err, res] = await to(getChannelMembers(channel.channelID))

    if (err) {
      console.log(err)
      return subscribers
    }

    res.items?.forEach(member => {
      const subscriber = new ChatSubscriber()
      subscriber.uid = member.username
      subscriber.name = member.realname
      subscriber.orgData = member
      subscriber.avatar = member.avatar
      subscriber.channel = channel
      subscriber.userType = member.type as SubscriberType
      subscriber.forbidden = member.forbidden === '1'
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
    chatManager.setChannelState(ChatChannelState.Fetching)
    const [err, res] = await to(syncRecentConversation({ uid: WKSDK.shared().config.uid!, msg_count: 20 }))

    if (err) {
      console.log(err)
      chatManager.setChannelState(ChatChannelState.Fetching)
      return resultConversations
    }

    chatManager.setChannelState(ChatChannelState.Fetched)

    if (res) {
      res.forEach(v => {
        const conversation = new Conversation()
        conversation.channel = new Channel(v.channel_id, v.channel_type)
        conversation.unread = v.unread || 0
        conversation.timestamp = v.timestamp || 0
        const channelInfo = new ChannelInfo()
        channelInfo.title = v.channel_name
        channelInfo.logo = v.channel_avatar
        channelInfo.channel = conversation.channel
        WKSDK.shared().channelManager.setChannleInfoForCache(channelInfo)

        if (v.recents.length) {
          const message = new Message()
          const lastRecord = v.recents[0]

          message.messageID = lastRecord.message_idstr
          message.header.reddot = lastRecord.header.red_dot === 1
          message.setting = Setting.fromUint8(lastRecord.setting)
          message.remoteExtra.revoke = lastRecord.revoke === 1
          message.clientSeq = lastRecord.client_seq || 0
          message.channel = new Channel(lastRecord.channel_id, lastRecord.channel_type)
          message.messageSeq = lastRecord.message_seq
          message.clientMsgNo = lastRecord.client_msg_no || ''
          message.streamNo = lastRecord.stream_no ?? ''
          message.fromUID = lastRecord.from_uid || ''
          message.timestamp = lastRecord.timestamp
          message.status = MessageStatus.Normal

          const decodedBuffer = Buffer.from(lastRecord.payload, 'base64')
          const jsonStr = decodedBuffer.toString('utf8')
          const contentObj = JSON.parse(jsonStr)
          const messageContent = WKSDK.shared().getMessageContent(contentObj.type)

          messageContent.decode(stringToUint8Array(JSON.stringify(contentObj)))
          message.content = messageContent

          conversation.lastMessage = message

          if (lastRecord.message_extra) {
            const messageExtra = new MessageExtra()
            // messageExtra.messageID = lastRecord.message_idstr
            message.remoteExtra = messageExtra
          }
        }

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
          r.push(messageTransform(msg))
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
