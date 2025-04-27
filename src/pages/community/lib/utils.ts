import { WKSDK } from 'wukongimjssdk'
import type { ChatChannel } from './types'
import { queryClient } from '@/utils/query-client'
import { getChatNameAndAvatar } from '@/api'
import { userCache } from '../cache/user'
import { dateUtils } from "@/utils/date"
import dayjs from "dayjs"

const sessionUserCache = new Map<string, { name: string; avatar?: string, }>()

export const fetchUserFromCache = async (userId: string) => {
  const userFromCache = await sessionUserCache.get(userId)

  if (userFromCache) {
    return {
      ...userFromCache,
      id: userId
    }
  }

  const userFromUserCache = await userCache.get(userId)

  if (userFromUserCache) {
    sessionUserCache.set(userId, { name: userFromUserCache.name, avatar: userFromUserCache.avatar })
    return {
      name: userFromUserCache.name,
      id: userId,
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
      id: userId,
      avatar: r?.avatar
    }
  }

  return
}

export const formatTimeStr = (timestamp: number, format: {timezone: string, format: string} ): string => {
  let time = dayjs(timestamp)

  if (format.timezone === 'us') {
    time = dateUtils.toUsDay(time)
  }

  return (format.format === 'ago' ? dateUtils.dateAgo(time) : `${time.format('YYYY-MM-DD HH:mm:ss')}`) + (format.timezone === 'us' ? ' [美东]': '')
}
