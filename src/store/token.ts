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
      token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3d3dy51c2prbi5jb20iLCJpYXQiOjE3MzA4NzU4MzgsImV4cCI6MTczMzQ2NzgzOCwiaWQiOiI0MTEiLCJ1c2VybmFtZSI6IkRwRnZ3MXphIiwibW9iaWxlIjoiMTU3NzgzNDExMDYifQ.nB8Ze8dMI3KLD9AoD97TiGaC2AB_W-BUUiZ3p6EQLoU',
      setToken: (token: string) => set(() => ({ token })),
      removeToken: () => set(() => ({ token: undefined })),
    }),
    {
      name: "token",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
