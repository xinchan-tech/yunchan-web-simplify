import { type StockTrading, useConfig } from '@/store'
import dayjs, { type Dayjs } from 'dayjs'

/**
 * 将小时和分钟转换为数字
 * 16:00 -> 1600
 */
export const hourMinToNum = (str: string) => {
  return Number.parseInt(str.replace(':', ''))
}

export const dateToWeek = (date: Dayjs | string) => {
  const language = useConfig.getState().language
  const weeks =
    language === 'zh_CN'
      ? ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  if (dayjs.isDayjs(date)) {
    return weeks[date.day()]
  }
  return weeks[dayjs(date).day()]
}
export const getTrading = (time: string): StockTrading => {
  const usTime = dayjs(time)
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

  if( usTime.isSameOrAfter(usTime.hour(16).minute(0).second(0)) && usTime.isBefore(usTime.hour(20).minute(0).second(0))){
    return 'afterHours'
  }

  return 'close'
}

/**
 * 根据交易周期获取以分为间隔的时间段
 * @param trading Trading 股票交易周期
 * @param date    日期
 */
export const getTradingPeriod = (trading: StockTrading, date?: string) => {
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

  const day = date ? dayjs(date) : dayjs()
  const start = day.set('hour', startTime[0]).set('minute', startTime[1]).set('second', 0)
  const end = day.set('hour', endTime[0]).set('minute', endTime[1]).set('second', 0)
  return Array.from({ length: end.diff(start, 'minute') }, (_, i) => {
    return start.add(i, 'minute').format('YYYY-MM-DD HH:mm:ss')
  })
}
