import { StockChartInterval } from "@/api"
import dayjs from "dayjs"

/**
 * 盘中时间线
 */
const inCategory = (() => {
  /**
   * 9:30 - 15:90取每分钟
   */
  const start = dayjs().set('hour', 9).set('minute', 30).set('second', 0)
  const end = dayjs().set('hour', 16).set('minute', 0).set('second', 0)
  return Array.from({ length: end.diff(start, 'minute') }, (_, i) => {
    return start.add(i, 'minute').format('YYYY-MM-DD HH:mm:ss')
  })
})()

/**
 * 盘后时间线
 */
const afterCategory = (() => {
  const start = dayjs().set('hour', 16).set('minute', 0).set('second', 0)
  const end = dayjs().set('hour', 20).set('minute', 0).set('second', 0)
  return Array.from({ length: end.diff(start, 'minute') }, (_, i) => {
    return start.add(i, 'minute').format('YYYY-MM-DD HH:mm:ss')
  })
})()


export const getStockChartCategory = (interval: StockChartInterval) => {
  switch (+interval) {
    case StockChartInterval.IN:
      return inCategory
    case StockChartInterval.AFTER:
      return afterCategory
    default:
      return inCategory
  }
}