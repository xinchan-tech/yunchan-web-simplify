import { getUser } from '@/api'
import { queryClient } from '@/utils/query-client'
import { parsePermission, type UserPermission } from '@/utils/util'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

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

        const permission = parsePermission(res.permission)
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
      storage: createJSONStorage(() => sessionStorage)
    }
  )
)
