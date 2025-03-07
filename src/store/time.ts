import { getTrading } from '@/utils/date'
import { type StockTrading, stockUtils } from '@/utils/stock'
import dayjs from 'dayjs'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface TimeStore {
  /**
   * 获取到服务器的时间戳，不会实时更新
   * 通过localStamp的偏移值来计算当前的美东时间
   */
  usTime: number
  localStamp: number
  setUsTime: (usTime: number) => void
  setLocalStamp: (localStamp: number) => void
  getTrading: () => StockTrading
  isToday: (data: string | number) => boolean
  /**
   * 获取实时的美东时间
   */
  getCurrentUsTime: () => number
  /**
   *
   * 用来判断是否是最新的一个交易周期
   * @deprecated 需要判断休市时间
   * @param date 日期
   * @returns
   */
  isLastTrading: (trading: StockTrading, date?: string) => boolean
}

export const useTime = create<TimeStore>((set, get) => ({
  usTime: dayjs().tz('America/New_York').valueOf(),
  localStamp: dayjs().valueOf(),
  setUsTime: usTime => {
    set(() => ({ usTime }))
  },
  setLocalStamp: localStamp => {
    set(() => ({ localStamp }))
  },
  getTrading: () => {
    const usTime = dayjs(get().usTime).tz('America/New_York').valueOf()

    return stockUtils.getTrading(usTime)
  },
  isToday: data => {
    const date = dayjs(data)
    return date.isSame(dayjs(get().usTime).tz('America/New_York'), 'day')
  },
  getCurrentUsTime: () => {
    return dayjs(new Date().valueOf() - get().localStamp + get().usTime)
      .tz('America/New_York')
      .valueOf()
  },
  isLastTrading: (trading, date) => {
    if (!date) return false
    const currentTimeStamp = new Date().valueOf()
    const lastUsTime = currentTimeStamp - get().localStamp + get().usTime
    const lastUsDay = dayjs(lastUsTime).tz('America/New_York')
    if (trading === 'preMarket') {
      //如果是4点后，判断是否是今天的盘前
      if (lastUsDay.isAfter(lastUsDay.hour(4).minute(0).second(0))) {
        return dayjs(date).isSame(lastUsDay, 'day')
      }
      //如果是4点前，判断是否是昨天的盘前
      return dayjs(date).isSame(lastUsDay.subtract(1, 'day'), 'day')
    }

    if (trading === 'intraDay') {
      //如果是9点半后，判断是否是今天的盘中
      if (lastUsDay.isAfter(lastUsDay.hour(9).minute(30).second(0))) {
        return dayjs(date).isSame(lastUsDay, 'day')
      }
      //如果是9点半前，判断是否是昨天的盘中
      return dayjs(date).isSame(lastUsDay.subtract(1, 'day'), 'day')
    }

    if (trading === 'afterHours' || trading === 'close') {
      //如果是16点后，判断是否是今天的盘后
      if (lastUsDay.isAfter(lastUsDay.hour(16).minute(0).second(0))) {
        return dayjs(date).isSame(lastUsDay, 'day')
      }

      //凌晨4点前，盘后时间应该是昨天
      if (lastUsDay.isBefore(lastUsDay.hour(4).minute(0).second(0))) {
        return dayjs(date).isSame(lastUsDay.subtract(1, 'day'), 'day')
      }
      //如果是16点前，判断是否是昨天的盘后
      return dayjs(date).isSame(lastUsDay.subtract(1, 'day'), 'day')
    }

    return false
  }
}))
