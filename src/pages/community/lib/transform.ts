import { useUser } from '@/store'
import { stringToUint8Array } from '@/utils/string'
import { Buffer } from 'buffer'
import WKSDK, {
  Channel,
  ChannelInfo,
  type CMDContent,
  Conversation,
  Message,
  type MessageContent,
  MessageExtra,
  type MessageImage,
  MessageStatus,
  MessageText,
  Setting,
  Subscriber
} from 'wukongimjssdk'
import {
  type ChatChannel,
  ChatCmdType,
  type ChatMessage,
  ChatMessageType,
  type ChatSession,
  type ChatSubscriber,
  type ChatSystemMessage,
  type ChatTextMessage,
  type ChatVoteMessage,
  type VoteMessageContent
} from './types'
import { fetchUserFromCache } from './utils'

export const MessageTransform = {
  toMessage: (msg: any) => {
    const message = new Message()
    message.messageID = msg.message_idstr
    message.header.reddot = msg.header.red_dot === 1
    message.setting = Setting.fromUint8(msg.setting)
    message.remoteExtra.revoke = msg.revoke === 1
    if (msg.message_extra) {
      // messageExtra.messageID = msg.message_idstr
      message.remoteExtra = MessageTransform.toMessageExtra(msg.message_extra)
    }

    message.clientSeq = msg.client_seq || 0
    message.channel = new Channel(msg.channel_id, msg.channel_type)
    message.messageSeq = msg.message_seq
    message.clientMsgNo = msg.client_msg_no || ''
    message.streamNo = msg.stream_no ?? ''
    message.fromUID = msg.from_uid || ''
    message.timestamp = msg.timestamp
    message.status = MessageStatus.Normal
    message.remoteExtra.extra = {
      fromName: msg.from_name,
      fromAvatar: msg.from_avatar
    }

    const decodedBuffer = Buffer.from(msg.payload, 'base64')
    const jsonStr = decodedBuffer.toString('utf8')
    const contentObj = JSON.parse(jsonStr)

    const messageContent = WKSDK.shared().getMessageContent(contentObj.type)
    messageContent.decode(stringToUint8Array(JSON.stringify(contentObj)))
    message.content = messageContent

    message.isDeleted = msg.is_deleted === 1

    return message
  },
  toMessageExtra: (msgExtra: any) => {
    const messageExtra = new MessageExtra()

    messageExtra.messageID = msgExtra.message_id_str
    messageExtra.messageSeq = msgExtra.message_seq
    messageExtra.readed = msgExtra.readed === 1

    if (msgExtra.readed_at && msgExtra.readed_at > 0) {
      messageExtra.readedAt = new Date(msgExtra.readed_at)
    }

    messageExtra.revoke = msgExtra.revoke === 1
    if (msgExtra.revoker) {
      messageExtra.revoker = msgExtra.revoker
    }
    messageExtra.readedCount = msgExtra.readed_count || 0
    messageExtra.unreadCount = msgExtra.unread_count || 0
    messageExtra.extraVersion = msgExtra.extra_version || 0
    messageExtra.editedAt = msgExtra.edited_at || 0

    const contentEditObj = msgExtra.content_edit

    if (contentEditObj) {
      const contentEditContentType = contentEditObj.type
      const contentEditContent = WKSDK.shared().getMessageContent(contentEditContentType)
      const contentEditPayloadData = stringToUint8Array(JSON.stringify(contentEditObj))
      contentEditContent.decode(contentEditPayloadData)
      messageExtra.contentEditData = contentEditPayloadData
      messageExtra.contentEdit = contentEditContent

      messageExtra.isEdit = true
    }

    return messageExtra
  },
  addContentObj: (message: Message) => {
    if (message.content.contentObj) return message
    if (message.contentType === ChatMessageType.Text) {
      message.content.contentObj = {
        content: message.content.text,
        type: message.contentType
      }
    }

    if (message.contentType === ChatMessageType.Image) {
      message.content.contentObj = {
        url: message.content.url,
        width: message.content.width,
        height: message.content.height,
        type: message.contentType
      }
    }

    if (message.contentType === ChatMessageType.Cmd) {
      message.content.contentObj = {
        cmd: message.content.cmd,
        param: { message_id: message.content.param.message_id },
        type: message.contentType
      }
    }

    return message
  },
  fromJson: (msg: Message) => {
    const message = new Message()
    message.messageID = msg.messageID
    message.header = msg.header
    message.setting = msg.setting
    const messageExtra = new MessageExtra()

    messageExtra.messageID = msg.remoteExtra.messageID
    messageExtra.messageSeq = msg.remoteExtra.messageSeq
    messageExtra.readed = msg.remoteExtra.readed
    messageExtra.readedAt = msg.remoteExtra.readedAt
    messageExtra.readedCount = msg.remoteExtra.readedCount
    messageExtra.unreadCount = msg.remoteExtra.unreadCount
    messageExtra.revoke = msg.remoteExtra.revoke
    messageExtra.revoker = msg.remoteExtra.revoker
    messageExtra.contentEditData = msg.remoteExtra.contentEditData
    messageExtra.contentEdit = msg.remoteExtra.contentEdit
    messageExtra.editedAt = msg.remoteExtra.editedAt
    messageExtra.isEdit = msg.remoteExtra.isEdit
    messageExtra.extra = msg.remoteExtra.extra
    messageExtra.extraVersion = msg.remoteExtra.extraVersion

    message.remoteExtra = messageExtra

    message.clientSeq = msg.clientSeq
    message.messageSeq = msg.messageSeq
    message.channel = new Channel(msg.channel.channelID, msg.channel.channelType)
    message.clientMsgNo = msg.clientMsgNo
    message.streamNo = msg.streamNo
    message.fromUID = msg.fromUID
    message.timestamp = msg.timestamp
    message.status = msg.status
    message.remoteExtra.extra = msg.remoteExtra.extra

    const content = WKSDK.shared().getMessageContent(msg.content.contentObj.type)
    content.decode(stringToUint8Array(JSON.stringify(msg.content.contentObj)))
    message.content = content

    message.isDeleted = msg.isDeleted

    return message
  },
  toChatMessage: async (msg: Message): Promise<ChatMessage> => {
    let message = {
      id: msg.messageID,
      channel: {
        id: msg.channel.channelID,
        type: msg.channel.channelType,
        ownerId: '',
        userNum: 0,
        notice: '',
        inChannel: false
      },
      content: msg.content,
      senderId: msg.fromUID,
      clientSeq: msg.clientSeq,
      senderName: msg.remoteExtra.extra.fromName ?? (await fetchUserFromCache(msg.fromUID))?.name,
      date: msg.timestamp,
      status: msg.status,
      timestamp: msg.timestamp,
      messageSeq: msg.messageSeq
    } as ChatMessage

    if (msg.contentType === ChatMessageType.Cmd) {
      const content = msg.content as CMDContent
      if (content.cmd === ChatCmdType.MessageRevoke) {
        message = {
          ...message,
          content: content.param.message_id,
          type: ChatMessageType.Cmd,
          cmdType: ChatCmdType.MessageRevoke,
          messageId: content.param.message_id
        }
      } else if (content.cmd === ChatCmdType.ChannelUpdate) {
        message = {
          ...message,
          content: content.param.channel_id,
          type: ChatMessageType.Cmd,
          cmdType: ChatCmdType.ChannelUpdate,
          channelId: content.param.channel_id
        }
      } else if (content.cmd === ChatCmdType.SubscriberForbidden) {
        message = {
          ...message,
          content: content.param.uid,
          type: ChatMessageType.Cmd,
          cmdType: ChatCmdType.SubscriberForbidden,
          uid: content.param.uid,
          channelId: content.param.channel_id
        }
      }
    } else if (msg.contentType === ChatMessageType.Text) {
      const content = msg.content as MessageText
      message = {
        ...message,
        content: content.text,
        type: ChatMessageType.Text,
        senderAvatar: (await fetchUserFromCache(msg.fromUID))?.avatar,
        mentionUser: content.mention?.uids?.length
          ? await Promise.all(content.mention.uids.map(s => fetchUserFromCache(s)))
          : [],
        mentionAll: content.mention?.all ?? false,
        revoke: false
      } as ChatTextMessage

      if (content.reply) {
        message.reply = {
          replySenderName: content.reply.fromName,
          replySenderId: content.reply.fromUID,
          replySenderAvatar: '',
          replyMessageType: content.reply.content?.contentType,
          replyMessageContent: content.reply.content?.conversationDigest,
          replyMessageId: content.reply.messageID
        }

        if (message.reply.replyMessageType === ChatMessageType.Image) {
          message.reply.replyMessageContent =
            (content.reply.content as unknown as Nullable<MessageImage>)?.remoteUrl ?? ''
        }
      }
    } else if (msg.contentType === ChatMessageType.Image) {
      const content = msg.content as unknown as MessageImage
      message = {
        ...message,
        content: content.remoteUrl,
        type: ChatMessageType.Image,
        senderAvatar: (await fetchUserFromCache(msg.fromUID))?.avatar,
        width: content.width,
        height: content.height,
        revoke: false,
        file: content.file
      }

      if (content.reply) {
        message.reply = {
          replySenderName: content.reply.fromName,
          replySenderId: content.reply.fromUID,
          replySenderAvatar: '',
          replyMessageType: content.reply.content?.contentType,
          replyMessageContent: content.reply.content?.conversationDigest,
          replyMessageId: content.reply.messageID
        }

        if (message.reply.replyMessageType === ChatMessageType.Image) {
          message.reply.replyMessageContent =
            (content.reply.content as unknown as Nullable<MessageImage>)?.remoteUrl ?? ''
        }
      }
    } else if (msg.contentType === ChatMessageType.ChannelUpdate) {
      message = {
        ...message,
        content: msg.content.content?.content,
        type: ChatMessageType.ChannelUpdate,
        
      } as ChatSystemMessage
    } else if (+msg.contentType === ChatMessageType.Vote) {
      const content = msg.content as VoteMessageContent
      message = {
        ...message,
        content: content.title,
        voteId: content.voteId,
        type: ChatMessageType.Vote
      } as ChatVoteMessage
    }

    return message
  },
  fromChatMessageToContent: (msg: ChatMessage): Nullable<MessageContent> => {
    if (msg.type === ChatMessageType.Text) {
      const contentObj = {
        content: msg.content,
        type: ChatMessageType.Text as number
      }

      const messageContent = WKSDK.shared().getMessageContent(contentObj.type)
      messageContent.decode(stringToUint8Array(JSON.stringify(contentObj)))
      return messageContent
    }

    if (msg.type === ChatMessageType.Image) {
      const contentObj = {
        url: msg.content,
        width: msg.width,
        height: msg.height,
        type: ChatMessageType.Image as number
      }

      const messageContent = WKSDK.shared().getMessageContent(contentObj.type)
      messageContent.decode(stringToUint8Array(JSON.stringify(contentObj)))
      return messageContent
    }

    return
  }
}

export const SubscriberTransform = {
  toSubscriber: (subscriber: Subscriber) => {
    const _subscriber = new Subscriber()
    _subscriber.uid = subscriber.uid
    _subscriber.name = subscriber.name
    _subscriber.avatar = subscriber.avatar
    _subscriber.remark = subscriber.remark
    _subscriber.role = subscriber.role

    _subscriber.version = subscriber.version
    _subscriber.isDeleted = subscriber.isDeleted
    _subscriber.orgData = subscriber.orgData
    _subscriber.status = subscriber.status

    const channel = new Channel(subscriber.channel.channelID, subscriber.channel.channelType)
    _subscriber.channel = channel

    return _subscriber
  },
  toSubscriberObj: (subscriber: Subscriber) => {
    return {
      uid: subscriber.uid,
      name: subscriber.name,
      avatar: subscriber.avatar,
      remark: subscriber.remark,
      role: subscriber.role,
      channel: subscriber.channel,
      version: subscriber.version,
      isDeleted: subscriber.isDeleted,
      orgData: subscriber.orgData,
      status: subscriber.status,
      channelId: subscriber.channel.channelID,
      channelType: subscriber.channel.channelType
    }
  },
  toChatSubscriber: (subscriber: Subscriber): ChatSubscriber => {
    const chatSubscriber: ChatSubscriber = {
      id: subscriber.uid,
      name: subscriber.name,
      avatar: subscriber.avatar,
      channelId: subscriber.channel.channelID,
      type: subscriber.orgData.type,
      hasForbidden: subscriber.orgData.forbidden === '1',
      isManager: subscriber.orgData.type === '1',
      isOwner: subscriber.orgData.type === '2',
      uid: `${subscriber.uid}-${subscriber.channel.channelID}`
    }

    return chatSubscriber
  }
}

export const ConversationTransform = {
  toConversation: (v: any) => {
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
      const m = v.recents.find((r: any) => {
        const _m = MessageTransform.toMessage(r)

        if (_m.contentType !== ChatMessageType.Cmd) {
          return true
        }

        if (_m.content.cmd === ChatCmdType.MessageRevoke) {
          return true
        }

        return false
      })

      // const r = v.recents.find(r => r.)
      const message = MessageTransform.toMessage(m ?? v.recents[0])
      message.channel = conversation.channel
      conversation.lastMessage = message
    }

    return conversation
  },
  /**
   * conversation 转成 conversation实例
   * 在 cache 中用
   */
  toConversationCls: (conversation: Conversation) => {
    const con = new Conversation()
    con.channel = new Channel(conversation.channel.channelID, conversation.channel.channelType)
    con.unread = conversation.unread
    con.timestamp = conversation.timestamp
    const channelInfo = new ChannelInfo()
    channelInfo.title = conversation.channelInfo?.title ?? ''
    channelInfo.logo = conversation.channelInfo?.logo ?? ''
    channelInfo.channel = con.channel
    channelInfo.orgData = conversation.channelInfo?.orgData

    WKSDK.shared().channelManager.setChannleInfoForCache(channelInfo)
    const message = new Message()

    if (conversation.lastMessage) {
      message.fromUID = conversation.lastMessage.fromUID
      message.messageID = conversation.lastMessage.messageID
      message.clientSeq = conversation.lastMessage.clientSeq
      message.messageSeq = conversation.lastMessage.messageSeq
      message.clientMsgNo = conversation.lastMessage.clientMsgNo
      message.streamNo = conversation.lastMessage.streamNo
      message.timestamp = conversation.lastMessage.timestamp
      message.status = conversation.lastMessage.status
      message.remoteExtra = conversation.lastMessage.remoteExtra
      message.setting = conversation.lastMessage.setting
      message.header = conversation.lastMessage.header
      message.isDeleted = conversation.lastMessage.isDeleted
      message.remoteExtra.extra = conversation.lastMessage.remoteExtra.extra
      message.clientSeq = conversation.lastMessage.clientSeq

      const messageContent = WKSDK.shared().getMessageContent(conversation.lastMessage.content.contentObj.type)
      messageContent.decode(stringToUint8Array(JSON.stringify(conversation.lastMessage.content.contentObj)))

      message.content = messageContent
    } else {
      message.content = new MessageText()
    }
    message.channel = con.channel
    con.lastMessage = message

    return con
  },

  toConversationObj: (v: Conversation) => {
    return {
      ...v,
      channelInfo: {
        title: v.channelInfo?.title,
        logo: v.channelInfo?.logo,
        channel: v.channelInfo?.channel,
        online: v.channelInfo?.online,
        lastOffline: v.channelInfo?.lastOffline,
        mute: v.channelInfo?.mute,
        top: v.channelInfo?.top,
        orgData: v.channelInfo?.orgData
      }
    }
  },
  toSession: async (v: Conversation) => {
    const channel: ChatChannel = {
      id: v.channel.channelID,
      name: v.channelInfo?.title ?? '',
      avatar: v.channelInfo?.logo ?? '',
      type: v.channel.channelType,
      ownerId: '',
      userNum: 0,
      notice: '',
      inChannel: false,
      editable: false,
      maxCount: 0,
      isReadNotice: false
    }

    const session: ChatSession = {
      id: v.channel.channelID,
      channel: channel,
      unRead: v.unread,
      isMentionMe: false,
      uid: useUser.getState().user!.username
    }

    if (v.lastMessage) {
      const user = useUser.getState().user?.username
      const message = await MessageTransform.toChatMessage(v.lastMessage)
      session.message = message
      if (message.type === ChatMessageType.Text) {
        session.isMentionMe = message.mentionUser?.some(u => u.id === user) || message.mentionAll || false
      }
    }

    return session
  }
}

export const ChannelTransform = {
  toChatChannel: (channel: ChannelInfo): ChatChannel => {
    return {
      id: channel.channel.channelID,
      name: channel.title,
      avatar: channel.logo,
      type: channel.channel.channelType,
      ownerId: channel.orgData.owner,
      userNum: channel.orgData.total_user,
      notice: channel.orgData.notice,
      inChannel: channel.orgData.in_channel === 1,
      tags: channel.orgData.tags,
      editable: channel.orgData.editable,
      maxCount: channel.orgData.max_num,
      brief: channel.orgData.brief,
      isReadNotice: channel.orgData.is_notice_read === 1,
    }
  }
}
