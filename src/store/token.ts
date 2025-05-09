import { TCBroadcast } from '@/utils/broadcast'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface TokenStore {
  token?: string
  setToken: (token: string) => void
  removeToken: () => void
}

export const useToken = create<TokenStore>()(
  persist(
    set => ({
      token: '',
      setToken: (token: string) => {
        set(() => ({ token }))
        TCBroadcast.sendToken(token)
      },
      removeToken: () => {
        set(() => ({ token: undefined }))
        TCBroadcast.sendToken(undefined)
      }
    }),
    {
      name: 'token',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => {
        return () => {
          const unSub = TCBroadcast.onTokenChange(e => {
            useToken.setState({
              token: e.data.data.token
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
