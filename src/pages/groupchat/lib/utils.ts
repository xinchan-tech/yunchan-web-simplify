import { WKSDK, type Channel, type Subscriber } from 'wukongimjssdk'
import { SubscriberType } from './model'
import { getChatNameAndAvatar } from '@/api'
import { subscriberCache } from '../cache'

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

  const subscriber = subscribes.find(subscriber => subscriber.uid === userId)

  if (subscriber) {
    return {
      name: subscriber.name,
      avatar: subscriber.avatar
    }
  }

  const userFromCache = await subscriberCache.get(channel.channelID, userId)

  if (userFromCache) {
    return userFromCache
  }

  const r = await getChatNameAndAvatar({ type: '1', id: userId })

  userCache.set(userId, { name: r.name, avatar: r.avatar })

  return {
    name: r.name,
    avatar: r.avatar
  }
}
