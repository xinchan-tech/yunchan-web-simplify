import dayjs from 'dayjs'
import { create } from 'zustand'

import type { StockTrading } from './stock'




interface TimeStore {
  usTime: number
  setUsTime: (usTime: number) => void
  getTrading: () => StockTrading
  isToday: (data: string) => boolean
}

export const useTime = create<TimeStore>()((set, get) => ({
  language: 'zh_CN',
  usTime: 0,
  setUsTime: usTime => {
    set(() => ({ usTime }))
  },
  getTrading: () => {
    const usTime = dayjs(get().usTime).tz('America/New_York')
    // 盘前交易时间（Premarket Trading）：

    // 4:00 AM - 9:30 AM 美国东部时间
    // 盘中交易时间（Regular Market Hours）：

    // 9:30 AM - 4:00 PM 美国东部时间
    // 盘后交易时间（After-hours Trading）：

    // 4:00 PM - 8:00 PM 美国东部时间
    if (usTime.isAfter(usTime.hour(4).minute(0).second(0)) && usTime.isBefore(usTime.hour(9).minute(30).second(0))) {
      return 'preMarket'
    }

    if (usTime.isAfter(usTime.hour(9).minute(30).second(0)) && usTime.isBefore(usTime.hour(16).minute(0).second(0))) {
      return 'intraDay'
    }

    return 'afterHours'
  },
  isToday: data => {
    const date = dayjs(data)
    console.log(date.format('YYYY-MM-DD HH:mm:ss'))
    return date.isSame(dayjs(get().usTime).tz('America/New_York'), 'day')
  }
}))
