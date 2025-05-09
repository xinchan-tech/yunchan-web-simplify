import { getUser } from '@/api'
import { TCBroadcast } from '@/utils/broadcast'
import { queryClient } from '@/utils/query-client'
import { AESCrypt } from '@/utils/string'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export type UserPermission = {
  overlayMark: string[]
  backTestTime: number
  stockPoolNum: number
  stockPickGroup: string[]
  stockPickMaxTime: number
  stockPickMaxList: number
  alarmMark: boolean
  alarmEmail: boolean
  textLive: boolean
  vcomment: boolean
  chat: boolean
  stockCompare: boolean
}

type User = Omit<Awaited<ReturnType<typeof getUser>>, 'permission'> & {
  permission: UserPermission
}

interface UserStore {
  user?: User
  loginType?: 'account' | 'wechat' | 'apple' | 'google'
  setLoginType: (type: 'account' | 'wechat' | 'apple' | 'google') => void
  setUser: (user: Partial<User>) => void
  refreshUser: () => Promise<User>
  reset: () => void
  hasAuthorized: () => boolean
  hasLogin: () => boolean
}

export const useUser = create<UserStore>()(
  persist(
    (set, get) => ({
      user: undefined,
      loginType: undefined,
      setUser: user => {
        const u = { user: Object.assign({}, get().user ?? {}, user) as User }
        set(u)
        TCBroadcast.sendUser(u.user)
      },
      reset: () => {
        set({ user: undefined })
        TCBroadcast.sendUser(undefined)
      },
      refreshUser: async () => {
        const res = await queryClient.fetchQuery({
          queryKey: [getUser.cacheKey],
          queryFn: () =>
            getUser({
              extends: ['authorized']
            })
        })

        const permission = parseUserPermission(res.permission)
        const user = {
          ...res,
          permission: permission
        }
        set({ user })
        TCBroadcast.sendUser(user)
        return user
      },
      hasAuthorized: () => {
        const user = get().user

        if (!user) {
          return false
        }

        const { authorized } = user

        if (authorized.length === 0) {
          return false
        }

        return true
      },
      setLoginType: type => set({ loginType: type }),
      hasLogin: () => {
        const user = get().user

        if (!user) {
          return false
        }

        const { username } = user

        if (!username) {
          return false
        }

        return true
      }
    }),
    {
      name: 'user',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return () => {
          const unSub = TCBroadcast.onUserChange(e => {
            // console.log('user change', e.data.data.user)
            useUser.setState({
              user: e.data.data.user
            })
          })

          window.addEventListener('beforeunload', () => {
            unSub()
          })
        }
      }
    }
  )
)

export const parseUserPermission = (str: string) => {
  const permission = AESCrypt.decrypt(str)

  let result: UserPermission = {
    overlayMark: [],
    backTestTime: 0,
    stockPoolNum: 0,
    stockPickGroup: [],
    stockPickMaxTime: 0,
    stockPickMaxList: 0,
    alarmMark: false,
    alarmEmail: false,
    textLive: false,
    vcomment: false,
    chat: false,
    stockCompare: false
  }

  try {
    result = JSON.parse(permission)
  } catch (er) {}

  return result
}
