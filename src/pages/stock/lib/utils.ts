import { StockChartInterval } from '@/api'
import type { ECOption } from '@/utils/echarts'
import dayjs from 'dayjs'
import type { ECBasicOption } from 'echarts/types/dist/shared'
import type { KChartContext } from './ctx'

export const renderUtils = {
  getXAxisIndex: (options: ECOption, index: number) => {
    if (Array.isArray(options.xAxis)) {
      return options.xAxis[index]
    }
  },
  getYAxisIndex: (options: ECOption, index: number) => {
    if (Array.isArray(options.yAxis)) {
      return options.yAxis[index]
    }
  },
  getSeriesIndex: (options: ECOption, index: number) => {
    if (Array.isArray(options.series)) {
      return options.series[index]
    }
  },
  getGridIndex: (options: ECOption, index: number) => {
    if (Array.isArray(options.grid)) {
      return options.grid[index]
    }
  },
  getTooltipIndex: (options: ECOption, index: number) => {
    if (Array.isArray(options.tooltip)) {
      return options.tooltip[index]
    }
  },
  getZoom: (options: ECBasicOption) => {
    const zoom = options.dataZoom as any[]
    return [zoom?.[0]?.start ?? 90, zoom?.[0]?.end ?? 100]
  },

  calcGridTopByGridIndex: (secondaryIndicatorLen: number) => {
    if(secondaryIndicatorLen === 0) return [0]

    if(secondaryIndicatorLen <= 3) {
      return Array.from({length: secondaryIndicatorLen}, (_, i) => 20 * (5 - secondaryIndicatorLen) + 20 * i + 0.4)
    }

    return Array.from({length: secondaryIndicatorLen}, (_, i) => 40 + (60 / secondaryIndicatorLen) * i + 0.4)
  },

  getStartTime: (usTime: number, time: StockChartInterval) => {
    if (time >= StockChartInterval.DAY || time <= StockChartInterval.INTRA_DAY) return undefined

    return dayjs(usTime)
      .tz('America/New_York')
      .add(-15 * time, 'day')
      .format('YYYY-MM-DD')
  },

  getViewMode: (s: KChartContext['viewMode']) => {
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
   * 计算刻度最大值
   */
  calcAxisMax: ({max, min}: {max: number, min: number}) => {
    const diff = max - min
    if(diff < 10){
      return (max + diff * 0.1).toFixed(1)
    }
    if(diff < 100){
      return (max + diff * 0.05).toFixed(1)
    }
    return max * 1.1
  }
}
