import type { getUser } from '@/api'
import type { UserPermission } from '@/utils/util'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type User = Omit<Awaited<ReturnType<typeof getUser>>, 'permission'> & {
  permission: UserPermission
}

interface UserStore {
  user?: User
  setUser: (user: Partial<User>) => void
  reset: () => void
}

export const useUser = create<UserStore>()(
  persist(
    (set, get) => ({
      user: undefined,
      setUser: user => set({ user: Object.assign({}, get().user ?? {}, user) as User }),
      reset: () => set({ user: undefined })
    }),
    {
      name: 'user',
      storage: createJSONStorage(() => sessionStorage)
    }
  )
)
