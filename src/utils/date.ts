import { useConfig, useTime } from '@/store'
import dayjs, { type Dayjs } from 'dayjs'
import type { StockTrading } from './stock'

/**
 * 将小时和分钟转换为数字
 * 16:00 -> 1600
 */
export const hourMinToNum = (str: string) => {
  return Number.parseInt(str.replace(':', ''))
}

export const dateToWeek = (date: Dayjs | string, unit = '星期') => {
  const language = useConfig.getState().language
  const weeks =
    language === 'zh_CN'
      ? ['日', '一', '二', '三', '四', '五', '六'].map(item => unit + item)
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (dayjs.isDayjs(date)) {
    return weeks[date.day()]
  }
  return weeks[dayjs(date).day()]
}

/**
 * @deprecated
 * @param time 时间
 * @returns
 */
export const getTrading = (time: string): StockTrading => {
  const usTime = dayjs(time)

  if (time.length === 10) {
    return 'intraDay'
  }
  // 盘前交易时间（Premarket Trading）：

  // 4:00 AM - 9:30 AM 美国东部时间
  // 盘中交易时间（Regular Market Hours）：

  // 9:30 AM - 4:00 PM 美国东部时间
  // 盘后交易时间（After-hours Trading）：

  // 4:00 PM - 8:00 PM 美国东部时间
  if (
    usTime.isSameOrAfter(usTime.hour(4).minute(0).second(0)) &&
    usTime.isBefore(usTime.hour(9).minute(30).second(0))
  ) {
    return 'preMarket'
  }

  if (
    usTime.isSameOrAfter(usTime.hour(9).minute(30).second(0)) &&
    usTime.isBefore(usTime.hour(16).minute(0).second(0))
  ) {
    return 'intraDay'
  }

  if (
    usTime.isSameOrAfter(usTime.hour(16).minute(0).second(0)) &&
    usTime.isBefore(usTime.hour(20).minute(0).second(0))
  ) {
    return 'afterHours'
  }

  return 'close'
}

/**
 * 根据交易周期获取以分为间隔的时间段
 * @param trading Trading 股票交易周期
 * @param date    日期
 */
export const getTradingPeriod = (trading: StockTrading, date?: string | Dayjs, format?: 'str' | 'timestamp') => {
  let startTime = [9, 30]
  let endTime = [16, 0]

  switch (trading) {
    case 'afterHours':
      startTime = [16, 0]
      endTime = [20, 0]
      break
    case 'preMarket':
      startTime = [4, 0]
      endTime = [9, 30]
      break
    default:
      break
  }

  const day = date ? (dayjs.isDayjs(date) ? date : dayjs(date)) : dayjs(useTime.getState().getCurrentUsTime())
  const start = day.set('hour', startTime[0]).set('minute', startTime[1]).set('second', 0)
  const end = day.set('hour', endTime[0]).set('minute', endTime[1]).set('second', 0)
  const r = Array.from({ length: end.diff(start, 'minute') }, (_, i) => {
    return format === 'timestamp'
      ? start.add(i, 'minute').valueOf()
      : start.add(i, 'minute').format('YYYY-MM-DD HH:mm:ss')
  })

  return r
}

/**
 * 根据时间获取上一交易日期
 */
export const getPrevTradingDay = (date?: string | Dayjs) => {
  const day = dayjs.isDayjs(date) ? date : dayjs(date)
  let c = 0

  while (c < 99) {
    const d = day.subtract(c, 'day') as Dayjs
    if (!dateUtils.isMarketOpen(d)) {
      c++
      continue
    }
    return d
  }
  return day
}

/**
 * 获取最近的交易日期
 */
export const getLatestTradingDay = (date?: string | Dayjs) => {
  const day = dayjs.isDayjs(date) ? date : dayjs(date)

  if (day.day() !== 0 && day.day() !== 6 && day.hour() >= 4) {
    return day
  }
  return getPrevTradingDay(day)
}

/**
 * 获取前几个交易日
 */
export const getPrevTradingDays = (date?: string | Dayjs, count = 1) => {
  const day = dayjs.isDayjs(date) ? date : dayjs(date)
  // 防止死循环
  let c = 0
  const r = []

  while (c < 99 && r.length < count) {
    const d = day.subtract(c, 'day') as Dayjs
    if (!dateUtils.isMarketOpen(d)) {
      c++
      continue
    }
    c++
    r.unshift(d.format('YYYY-MM-DD'))
  }

  return r
}

export const dateUtils = {
  toUsDay: (date: any): Dayjs => {
    let d: Dayjs | undefined = undefined
    if (dayjs.isDayjs(date)) {
      d = date
    } else if (typeof date === 'string') {
      return dayjs(date).local().tz('America/New_York', true)
    } else if (typeof date === 'number') {
      if (date.toString().length === 10) {
        d = dayjs(date * 1000)
      } else {
        d = dayjs(date)
      }
    }

    if (!d) {
      throw new Error('Invalid date')
    }

    return d.tz('America/New_York')
  },
  /**
   * 是否休市
   */
  isMarketOpen: (date?: string | Dayjs) => {
    const day = dayjs.isDayjs(date) ? date : dayjs(date)
    if (day.day() === 0 || day.day() === 6) {
      return false
    }

    // 元旦
    if (day.month() === 0 && day.date() === 1) {
      return false
    }

    // 马丁·路德·金纪念日（每年1月的第三个星期一）
    if (day.month() === 0 && day.day() === 1 && day.date() >= 15 && day.date() <= 21) {
      return false
    }

    // 总统日（每年2月的第三个星期一）
    if (day.month() === 1 && day.day() === 1 && day.date() >= 15 && day.date() <= 21) {
      return false
    }

    // 耶稣受难日（复活节前的星期五，通常在3月或4月）
    if (day.month() === 3 && day.day() === 5 && day.date() >= 15 && day.date() <= 21) {
      return false
    }

    // 阵亡将士纪念日（每年5月的最后一个星期一）
    if (day.month() === 4 && day.day() === 1 && day.date() >= 25) {
      return false
    }

    // 六月节（Juneteenth，6月19日）
    if (day.month() === 5 && day.date() === 19) {
      return false
    }

    // 美国独立日（7月4日）
    if (day.month() === 6 && day.date() === 4) {
      return false
    }

    // 劳工日（每年9月的第一个星期一）
    if (day.month() === 8 && day.day() === 1 && day.date() <= 7) {
      return false
    }

    // 感恩节（每年11月的第四个星期四）
    if (day.month() === 10 && day.day() === 4 && day.date() >= 22 && day.date() <= 28) {
      return false
    }

    // 圣诞节（12月25日）
    if (day.month() === 11 && day.date() === 25) {
      return false
    }

    return true
  }
}
