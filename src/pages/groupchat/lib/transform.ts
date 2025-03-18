import { stringToUint8Array } from '@/utils/string'
import { Buffer } from 'buffer'
import WKSDK, { Channel, Message, MessageExtra, MessageStatus, Setting } from 'wukongimjssdk'

export const messageTransform = (msg: any) => {
  const message = new Message()
  message.messageID = msg.message_idstr
  message.header.reddot = msg.header.red_dot === 1
  message.setting = Setting.fromUint8(msg.setting)
  message.remoteExtra.revoke = msg.revoke === 1
  if (msg.message_extra) {
    // messageExtra.messageID = msg.message_idstr
    message.remoteExtra = messageExtraTransform(msg.message_extra)
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
}

export const messageExtraTransform = (msgExtra: any) => {
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
}
