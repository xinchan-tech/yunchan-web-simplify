import { type Channel, type Message, WKSDK, type Subscriber } from 'wukongimjssdk'
import { SubscriberType } from './model'
import { type getChannelDetail, getChatNameAndAvatar } from '@/api'
import { subscriberCache } from '../cache'
import { queryClient } from '@/utils/query-client'

export const isChannelOwner = (subscriber?: Subscriber) => {
  return subscriber?.orgData?.type === SubscriberType.ChannelOwner
}

export const isChannelManager = (subscriber?: Subscriber) => {
  return subscriber?.orgData?.type === SubscriberType.ChannelManager
}

export const hasForbidden = (subscriber?: Subscriber) => {
  return subscriber?.orgData?.forbidden === '1'
}

const userCache = new Map<string, { name: string; avatar?: string }>()

export const fetchUserInChannel = async (channel: Channel, userId: string) => {
  const subscribes = WKSDK.shared().channelManager.getSubscribes(channel)

  const subscriber = subscribes.find(subscriber => subscriber.uid === userId) as Nullable<Subscriber>

  if (subscriber) {
    return {
      name: subscriber.name,
      avatar: subscriber.avatar
    }
  }

  const userFromUserCache = await userCache.get(userId)

  if (userFromUserCache) {
    return {
      name: userFromUserCache.name,
      avatar: userFromUserCache.avatar
    }
  }

  const userFromCache = await subscriberCache.get(channel.channelID, userId)

  if (userFromCache) {
    return userFromCache
  }

  const r = await queryClient.ensureQueryData({
    queryKey: [getChatNameAndAvatar.cacheKey, { type: '1', id: userId }],
    queryFn: () => getChatNameAndAvatar({ type: '1', id: userId })
  })

  userCache.set(userId, { name: r.name, avatar: r.avatar })

  return {
    name: r.name,
    avatar: r.avatar
  }
}

export const getUserNameAndAvatarFromMessage = async (message: Message) => {
  const { fromName, fromAvatar } = message.remoteExtra.extra || {}

  if (fromName && fromAvatar) {
    return {
      name: fromName,
      avatar: fromAvatar
    }
  }

  return await fetchUserInChannel(message.channel, message.fromUID)
}

export const getChannelDetailFromChannel = (channel?: Channel) => {
  if (!channel) return
  const info = WKSDK.shared().channelManager.getChannelInfo(channel)

  if (!info) return

  return info.orgData as Awaited<ReturnType<typeof getChannelDetail>>
}

export const isRevokeMessage = (message: Message) => {
  return message.remoteExtra.revoke
}
