import { StockChartInterval } from '@/api'
import type { ECOption } from '@/utils/echarts'
import dayjs from 'dayjs'
import type { ECBasicOption } from 'echarts/types/dist/shared'
import { KChartContext } from './ctx'

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

  getHeightByGridIndex: (options: ECOption, index: number, percent: number, height: number) => {
    const grid = renderUtils.getGridIndex(options, index)
    if (!grid) return 0
    const top = (Number.parseFloat((grid.top as string) ?? '0') * height) / 100
    const bottom = (Number.parseFloat((grid.height as string) ?? '0') * height) / 100 + top

    const offset = ((bottom - top) * (100 - percent)) / 100

    return top + offset
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
  }
}
