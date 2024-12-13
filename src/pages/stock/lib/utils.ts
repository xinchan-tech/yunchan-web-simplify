import { StockChartInterval } from "@/api"
import type { ECOption } from '@/utils/echarts'
import dayjs from "dayjs"
import type { ECBasicOption } from "echarts/types/dist/shared"

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
    if(!grid) return 0
    const top = Number.parseFloat(grid.top as string ?? '0') * height / 100
    const bottom = Number.parseFloat(grid.height as string ?? '0') * height / 100 + top

    const offset = (bottom - top) * (100 - percent) / 100
 
    return top + offset
  },

  getStartTime: (usTime: number, time: StockChartInterval) => {
    if (time >= StockChartInterval.DAY || time <= StockChartInterval.INTRA_DAY) return undefined
  
    return dayjs(usTime).tz('America/New_York').add(-15 * time, 'day').format('YYYY-MM-DD')
  }
}
