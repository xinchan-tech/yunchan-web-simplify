import dayjs from 'dayjs'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StockTrading } from './stock'
import { getTrading } from "@/utils/date"

interface TimeStore {
  usTime: number
  localStamp: number
  setUsTime: (usTime: number) => void
  setLocalStamp: (localStamp: number) => void
  getTrading: () => StockTrading
  isToday: (data: string) => boolean
}

export const useTime = create<TimeStore>()(
  persist(
    (set, get) => ({
      language: 'zh_CN',
      usTime: 0,
      localStamp: 0,
      setUsTime: usTime => {
        set(() => ({ usTime }))
      },
      setLocalStamp: localStamp => {
        set(() => ({ localStamp }))
      },
      getTrading: () => {
        const usTime = dayjs(get().usTime).tz('America/New_York').format('YYYY-MM-DD HH:mm:ss')
        return getTrading(usTime)
      },
      isToday: data => {
        const date = dayjs(data)
        return date.isSame(dayjs(get().usTime).tz('America/New_York'), 'day')
      }
    }),
    {
      name: 'time-store',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
