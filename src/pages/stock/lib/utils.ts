import { StockChartInterval, type StockRawRecord } from '@/api'
import { dateUtils } from '@/utils/date'
import type { StockTrading } from '@/utils/stock'
import type { ChartManageStore, Indicator } from './store'

export const renderUtils = {
  getViewMode: (s: ChartManageStore['viewMode']) => {
    switch (s) {
      case 'single':
        return 1
      case 'double':
        return 2
      case 'double-vertical':
        return 2
      case 'three-left-single':
        return 3
      case 'three-right-single':
        return 3
      case 'three-vertical-top-single':
        return 3
      case 'three-vertical-bottom-single':
        return 3
      case 'four':
        return 4
      case 'six':
        return 6
      case 'nine':
        return 9
      default:
        return 1
    }
  },

  /**
   * 是否是本地计算的指标
   */
  isLocalIndicator: (indicatorId: string) => {
    return indicatorId === '9' || indicatorId === '10'
  },

  /**
   * 是否是远程指标
   */
  isRemoteIndicator: (indicator: Indicator) => {
    return indicator.calcType === 'svr_policy'
  },

  /**
   * 获取刻度间隔
   */
  getIntervalScale: (interval: StockChartInterval): number => {
    switch (interval) {
      case StockChartInterval.PRE_MARKET:
      case StockChartInterval.INTRA_DAY:
      case StockChartInterval.AFTER_HOURS:
      case StockChartInterval.ONE_MIN:
        return 60 * 1000
      case StockChartInterval.TWO_MIN:
        return 2 * 60 * 1000
      case StockChartInterval.THREE_MIN:
        return 3 * 60 * 1000
      case StockChartInterval.FIVE_MIN:
        return 5 * 60 * 1000
      case StockChartInterval.TEN_MIN:
        return 10 * 60 * 1000
      case StockChartInterval.FIFTEEN_MIN:
        return 15 * 60 * 1000
      case StockChartInterval.THIRTY_MIN:
        return 30 * 60 * 1000
      case StockChartInterval.FORTY_FIVE_MIN:
        return 45 * 60 * 1000
      case StockChartInterval.ONE_HOUR:
        return 60 * 60 * 1000
      case StockChartInterval.TWO_HOUR:
        return 2 * 60 * 60 * 1000
      case StockChartInterval.THREE_HOUR:
        return 3 * 60 * 60 * 1000
      case StockChartInterval.FOUR_HOUR:
        return 4 * 60 * 60 * 1000
      case StockChartInterval.DAY:
        return 24 * 60 * 60 * 1000
      case StockChartInterval.WEEK:
        return 7 * 24 * 60 * 60 * 1000
      case StockChartInterval.MONTH:
        return 30 * 24 * 60 * 60 * 1000
      case StockChartInterval.QUARTER:
        return 90 * 24 * 60 * 60 * 1000
      case StockChartInterval.HALF_YEAR:
        return 180 * 24 * 60 * 60 * 1000
      case StockChartInterval.YEAR:
        return 365 * 24 * 60 * 60 * 1000
      default:
        return 0
    }
  },
  /**
   * 根据提供的时间找到最接近的时间
   * 必须是有序数组, 使用二分查找
   */
  findNearestTime: (data: StockRawRecord[], time: number, gte?: boolean) => {
    if (data.length === 0) return
    if (data.length === 1)
      return {
        index: 0,
        data: data[0]
      }

    let left = 0
    let right = data.length - 1

    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      const midTime = +data[mid][0]!

      if (midTime === time) {
        return {
          index: mid,
          data: data[mid]
        }
      }

      if (midTime < time) {
        left = mid + 1
      } else {
        right = mid
      }
    }

    if (gte) {
      return {
        index: left,
        data: data[left]
      }
    }
    return {
      index: left - 1,
      data: data[left - 1]
    }
  },

  /**
   * 判断是否应该更新当前k线图
   */
  shouldUpdateChart: (trading: StockTrading, timeIndex: StockChartInterval) => {
    if (
      [StockChartInterval.PRE_MARKET, StockChartInterval.INTRA_DAY, StockChartInterval.AFTER_HOURS].includes(timeIndex)
    ) {
      return true
    }

    if (trading !== 'intraDay') {
      return false
    }
    return true
  },
  /**
   * 判断是否是分时图
   */
  isTimeIndexChart: (timeIndex: StockChartInterval) =>
    [StockChartInterval.PRE_MARKET, StockChartInterval.AFTER_HOURS, StockChartInterval.INTRA_DAY].includes(timeIndex),
  /**
   * k线获取数据逻辑
   */
  getChartStartDate: (interval: StockChartInterval) => {
    const current = dateUtils.toUsDay(new Date().valueOf())

    if (interval <= StockChartInterval.FOUR_HOUR) {
      return current.add(-1 * 15 * interval, 'd').format('YYYY-MM-DD HH:mm:ss')
    }

    if (interval >= StockChartInterval.HALF_YEAR) {
      return undefined
    }

    return current.add(-1 * 15 * 180, 'd').format('YYYY-MM-DD HH:mm:ss')
  }
}
