import { WKSDK } from 'wukongimjssdk'
import type { ChatChannel } from './types'
import { queryClient } from '@/utils/query-client'
import { getChatNameAndAvatar } from '@/api'
import { userCache } from '../cache/user'

const sessionUserCache = new Map<string, { name: string; avatar?: string }>()

export const fetchUserFromCache = async (userId: string) => {
  const userFromCache = await sessionUserCache.get(userId)

  if (userFromCache) {
    return userFromCache
  }

  const userFromUserCache = await userCache.get(userId)

  if (userFromUserCache) {
    sessionUserCache.set(userId, { name: userFromUserCache.name, avatar: userFromUserCache.avatar })
    return {
      name: userFromUserCache.name,
      avatar: userFromUserCache.avatar
    }
  }

  const r = await queryClient.ensureQueryData({
    queryKey: [getChatNameAndAvatar.cacheKey, { type: '1', id: userId }],
    queryFn: () => getChatNameAndAvatar({ type: '1', id: userId })
  })

  if (r) {
    sessionUserCache.set(userId, { name: r.name, avatar: r.avatar })

    return {
      name: r?.name,
      avatar: r?.avatar
    }
  }

  return
}
