import dayjs, { type Dayjs } from 'dayjs'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { StockTrading } from './stock'

type Language = 'zh_CN' | 'en'

let timer: number | null = null
let localTimestamp = 0

interface ConfigStore {
  language: Language
  hasSelected: boolean
  usTime: number
  setUsTime: (usTime: number) => void
  setHasSelected: () => void
  getTrading: () => StockTrading
  setLanguage: (language: Language) => void
}

export const useConfig = create<ConfigStore>()(
  persist(
    (set, get) => ({
      language: 'zh_CN',
      usTime: 0,
      setUsTime: usTime => {
        if (timer) {
          clearTimeout(timer)
        }

        localTimestamp = new Date().valueOf()
        set(() => ({ usTime: usTime * 1000 }))

        timer = setInterval(() => {
          set(() => {
            const now = new Date().valueOf()

            return {
              usTime: usTime * 1000 + (now - localTimestamp)
            }
          })
        }, 1000)
      },
      hasSelected: false,
      setLanguage: language => set(() => ({ language })),
      setHasSelected: () => set(() => ({ hasSelected: true })),
      getTrading: () => {
        const usTime = dayjs(get().usTime).tz('America/New_York')
        //         盘前交易时间（Premarket Trading）：

        // 4:00 AM - 9:30 AM 美国东部时间
        // 盘中交易时间（Regular Market Hours）：

        // 9:30 AM - 4:00 PM 美国东部时间
        // 盘后交易时间（After-hours Trading）：

        // 4:00 PM - 8:00 PM 美国东部时间
        if (usTime.isAfter(usTime.hour(4).minute(0)) && usTime.isBefore(usTime.hour(9).minute(30))) {
          return 'preMarket'
        } 
        
        if (usTime.isAfter(usTime.hour(9).minute(30)) && usTime.isBefore(usTime.hour(16).minute(0))) {
          return 'intraDay'
        } 

        return 'afterHours'
      }
    }),
    { name: 'config', storage: createJSONStorage(() => localStorage) }
  )
)
