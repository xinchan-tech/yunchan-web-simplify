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
      token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3d3dy51c2prbi5jb20iLCJpYXQiOjE3MzA2OTI2ODMsImV4cCI6MTczMzI4NDY4MywiaWQiOiI0MTEiLCJ1c2VybmFtZSI6IkRwRnZ3MXphIiwibW9iaWxlIjoiMTU3NzgzNDExMDYifQ.qmVdhzXuG9tgd7vnuxKDOep192DbYF6aIB_DBMYvg3I',
      setToken: (token: string) => set(() => ({ token })),
      removeToken: () => set(() => ({ token: undefined })),
    }),
    {
      name: "token",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
