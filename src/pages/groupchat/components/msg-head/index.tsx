import { ContextMenu, ContextMenuTrigger } from '@/components'
import { useChatNoticeStore, useGroupChatShortStore } from '@/store/group-chat-new'
import { cn } from '@/utils/style'
import { useEffect, useMemo, useState } from 'react'
import WKSDK, { type Message, Channel, ChannelTypePerson, MessageStatus } from 'wukongimjssdk'
import {
  getTimeFormatStr,
  judgeIsUserInSyncChannelCache,
  setPersonChannelCache,
  setUserInSyncChannelCache
} from '../../chat-utils'
import { useMemberSetting } from '../../hooks'
import ChatAvatar from '../chat-avatar'

const MsgHead = (props: { message: Message; type: 'left' | 'right' }) => {
  const { message, type } = props
  const subscribers = useGroupChatShortStore(state => state.subscribers)

  const { renderContextMenu } = useMemberSetting()
  const { updateForceUpdateAvatarId, forceUpdateAvatarId } = useChatNoticeStore()
  // 群成员
  const member = useMemo(() => {
    let result = null
    if (subscribers instanceof Array && subscribers.length > 0) {
      const target = subscribers.find(item => item.uid === message.fromUID)
      if (target) {
        result = target
      }
    }
    return result
  }, [subscribers, message])
  const [channelInfo, setChannelInfo] = useState<{
    name: string
    avatar: string
    uid: string
  }>({
    name: '',
    avatar: '',
    uid: ''
  })

  useEffect(() => {
    if (forceUpdateAvatarId > 1) {
      const temp = WKSDK.shared().channelManager.getChannelInfo(new Channel(message.fromUID, ChannelTypePerson))
      if (temp) {
        setChannelInfo({
          name: temp.title,
          avatar: temp.logo,
          uid: temp.channel.channelID
        })
      }
    }
  }, [forceUpdateAvatarId])
  useEffect(() => {
    if (message) {
      const temp = WKSDK.shared().channelManager.getChannelInfo(new Channel(message.fromUID, ChannelTypePerson))
      if (temp) {
        setChannelInfo({
          name: temp.title,
          avatar: temp.logo,
          uid: temp.channel.channelID
        })
      } else {
        if (judgeIsUserInSyncChannelCache(message.fromUID)) {
          return
        }

        setUserInSyncChannelCache(message.fromUID, true)

        setPersonChannelCache(message.fromUID).then(() => {
          const temp = WKSDK.shared().channelManager.getChannelInfo(new Channel(message.fromUID, ChannelTypePerson))
          if (temp) {
            setChannelInfo({
              name: temp.title,
              avatar: temp.logo,
              uid: temp.channel.channelID
            })
            updateForceUpdateAvatarId()
          }

          setUserInSyncChannelCache(message.fromUID, false)
        })
      }
    }
  }, [message])

  const getMessageStatus = () => {
    if (!message.send) {
      return ''
    }
    if (message.status === MessageStatus.Fail) {
      return '发送失败'
    }
    if (message.status === MessageStatus.Wait) {
      return '发送中'
    }

    return '已发送'
  }

  return (
    <div className="relative">
      <div className={cn('absolute user-name text-nowrap', type === 'left' ? 'left-name' : 'right-name')}>
        {channelInfo.name}
        {/* {type === "left" && (
          <span className="ml-2 text-gray-400">
            {getTimeStringAutoShort2(message.timestamp * 1000, true)}
          </span>
        )} */}
        <span className="ml-2 text-tertiary">{getTimeFormatStr(message.timestamp * 1000)}</span>
      </div>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div>
            <ChatAvatar data={channelInfo || {}} radius="8px" />
          </div>
        </ContextMenuTrigger>
        {member && renderContextMenu(member)}
      </ContextMenu>

      <div>
        <div className="text-xs mt-2 text-gray-500">{getMessageStatus()}</div>
      </div>
      <style jsx>
        {`
          .user-name {
            font-size: 14px;
            min-width: 100px;
            top: 0;
            display: flex;
            align-items: center;
          }
          .left-name {
            left: 58px;
            text-align: left;
          }
          .right-name {
            right: 58px;
            text-align: right;
          }
        `}
      </style>
    </div>
  )
}

export default MsgHead
