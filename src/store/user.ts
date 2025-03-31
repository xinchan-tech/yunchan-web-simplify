import { getUser } from '@/api'
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
  setUser: (user: Partial<User>) => void
  refreshUser: () => Promise<User>
  reset: () => void
}

export const useUser = create<UserStore>()(
  persist(
    (set, get) => ({
      user: undefined,
      setUser: user => set({ user: Object.assign({}, get().user ?? {}, user) as User }),
      reset: () => set({ user: undefined }),
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

        return user
      }
    }),
    {
      name: 'user',
      storage: createJSONStorage(() => localStorage)
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
