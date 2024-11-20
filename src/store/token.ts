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
      token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL3d3dy51c2prbi5jb20iLCJpYXQiOjE3MzIwODY1ODAsImV4cCI6MTczNDY3ODU4MCwiaWQiOiI0MTEiLCJ1c2VybmFtZSI6IkRwRnZ3MXphIiwibW9iaWxlIjoiMTU3NzgzNDExMDYifQ.1cPS5SEsdtraS0sTc_2ZGLlZQjiv2pNnRQJPavTEg_0',
      setToken: (token: string) => set(() => ({ token })),
      removeToken: () => set(() => ({ token: undefined })),
    }),
    {
      name: "token",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
)
