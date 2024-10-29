import { create } from "zustand"
import { createJSONStorage, persist } from "zustand/middleware"

interface TokenStore {
  token?: string
  setToken: (token: string) => void
  removeToken: () => void
}

export const useToken = create<TokenStore>()(
  persist(
    (set) => ({
      token: undefined,
      setToken: (token: string) => set(() => ({ token })),
      removeToken: () => set(() => ({ token: undefined })),
    }),
    {
      name: "token",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
