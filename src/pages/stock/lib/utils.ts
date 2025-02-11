import { StockChartInterval, type StockRawRecord } from '@/api'
import { useTime } from "@/store"
import { getTradingPeriod } from '@/utils/date'
import type { ECOption } from '@/utils/echarts'
import { stockUtils } from '@/utils/stock'
import dayjs, { type Dayjs } from 'dayjs'
import type { EChartsType } from 'echarts/core'
import type { ECBasicOption } from 'echarts/types/dist/shared'
import type { KChartContext } from './ctx'

export const renderUtils = {
  getXAxisIndex: (options: ECOption, index: number) => {
    if (Array.isArray(options.xAxis)) {
      return options.xAxis[index]
    }

    return options.xAxis
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
      return options.grid[index] as {
        left: number
        top: number
        width: number
        height: number
      }
    }
  },

  getGridSize: (chart: EChartsType) => {
    const grid = chart.getOption().grid
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
    if (secondaryIndicatorLen === 0) return [0]

    if (secondaryIndicatorLen <= 3) {
      return Array.from({ length: secondaryIndicatorLen }, (_, i) => 20 * (5 - secondaryIndicatorLen) + 20 * i + 0.4)
    }

    return Array.from({ length: secondaryIndicatorLen }, (_, i) => 40 + (60 / secondaryIndicatorLen) * i + 0.4)
  },

  getStartTime: (usTime: number, time: StockChartInterval) => {
    if (time >= StockChartInterval.DAY || time <= StockChartInterval.INTRA_DAY) return undefined

    return dayjs(usTime)
      .tz('America/New_York')
      .add(-15 * time, 'day')
      .format('YYYY-MM-DD')
  },

  /**
   * 布局策略
   * 1. 无副图 -> 主图占满, 底部留出24显示标签
   * 2. 副图 <= 3 -> 副图占20% * 副图数量
   * 3. 副图 > 3 -> 副图占60%平均分
   * 4. x轴占24
   *
   * 左右留出50px显示标签
   */
  calcGridSize: (size: [number, number], secondaryIndicatorLen: number, hasLeft: boolean) => {
    const Y_AXIS_WIDTH = 70
    const X_AXIS_HEIGHT = 30
    const TOP_OFFSET = 0
    const [width, height] = size

    const gridLeft = hasLeft ? Y_AXIS_WIDTH : 1

    const gridSize = [width - Y_AXIS_WIDTH - gridLeft, height - X_AXIS_HEIGHT - TOP_OFFSET]
    const grid: { left: number; top: number; width: number; height: number; borderColor?: string; show?: boolean }[] =
      []

    if (secondaryIndicatorLen === 0) {
      grid.push({
        left: gridLeft,
        top: TOP_OFFSET,
        width: gridSize[0],
        height: gridSize[1],
        borderColor: '#4a4848'
      })
    } else if (secondaryIndicatorLen <= 3) {
      grid.push({
        show: true,
        left: gridLeft,
        top: TOP_OFFSET,
        width: gridSize[0],
        height: (gridSize[1] * (5 - secondaryIndicatorLen)) / 5,
        borderColor: '#4a4848'
      })

      Array.from({ length: secondaryIndicatorLen }, (_, i) => {
        grid.push({
          show: true,
          left: gridLeft,
          top: (gridSize[1] / 5) * i + grid[0].height + TOP_OFFSET,
          width: gridSize[0],
          height: gridSize[1] / 5,
          borderColor: '#4a4848'
        })
      })
    } else {
      grid.push({
        show: true,
        left: gridLeft,
        top: TOP_OFFSET,
        width: gridSize[0],
        height: gridSize[1] * 0.4,
        borderColor: '#4a4848'
      })

      Array.from({ length: secondaryIndicatorLen }, (_, i) => {
        grid.push({
          show: true,
          left: gridLeft,
          top: ((gridSize[1] * 0.6) / secondaryIndicatorLen) * i + grid[0].height + TOP_OFFSET,
          width: gridSize[0],
          height: (gridSize[1] * 0.6) / secondaryIndicatorLen,
          borderColor: '#4a4848'
        })
      })
    }

    grid.push({
      left: gridLeft,
      top: height - X_AXIS_HEIGHT,
      width: gridSize[0],
      height: 0
    })

    return grid
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
  calcAxisMax: ({ max, min }: { max: number; min: number }) => {
    const diff = max - min
    if (diff < 10) {
      return (max + diff * 0.1).toFixed(1)
    }
    if (diff < 100) {
      return (max + diff * 0.05).toFixed(1)
    }
    return max * 1.1
  },

  /**
   *
   */
  isSameTimeByInterval: (src: Dayjs, target: Dayjs, interval: StockChartInterval) => {
    switch (interval) {
      case StockChartInterval.PRE_MARKET:
      case StockChartInterval.INTRA_DAY:
      case StockChartInterval.AFTER_HOURS:
      case StockChartInterval.ONE_MIN:
        return src.isSame(target, 'minute')
      case StockChartInterval.TWO_MIN:
        return src.add(2, 'minute').isAfter(target)
      case StockChartInterval.THREE_MIN:
        return src.add(3, 'minute').isAfter(target)
      case StockChartInterval.FIVE_MIN:
        return src.add(5, 'minute').isAfter(target)
      case StockChartInterval.TEN_MIN:
        return src.add(10, 'minute').isAfter(target)
      case StockChartInterval.FIFTEEN_MIN:
        return src.add(15, 'minute').isAfter(target)
      case StockChartInterval.THIRTY_MIN:
        return src.add(30, 'minute').isAfter(target)
      case StockChartInterval.FORTY_FIVE_MIN:
        return src.add(45, 'minute').isAfter(target)
      case StockChartInterval.ONE_HOUR:
        return src.isSame(target, 'hour')
      case StockChartInterval.TWO_HOUR:
        return src.add(2, 'hour').isAfter(target)
      case StockChartInterval.THREE_HOUR:
        return src.add(3, 'hour').isAfter(target)
      case StockChartInterval.FOUR_HOUR:
        return src.add(4, 'hour').isAfter(target)
      case StockChartInterval.DAY:
        return src.isSame(target, 'day')
      case StockChartInterval.WEEK:
        return src.isSame(target, 'week')
      case StockChartInterval.MONTH:
        return src.isSame(target, 'month')
      case StockChartInterval.QUARTER:
        return src.quarter() === target.quarter() && src.year() === target.year()
      case StockChartInterval.HALF_YEAR:
        return src.halfYearOfYear() === target.halfYearOfYear() && src.year() === target.year()
      case StockChartInterval.YEAR:
        return src.isSame(target, 'year')

      default:
        return false
    }
  },

  /**
   * 获取zoom刻度坐标
   */
  getScaledZoom: (chart: EChartsType, index = 0): [number, number] | undefined => {
    // @ts-ignore
    return chart.getModel().getComponent('xAxis', index)?.axis.scale.getExtent()
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

  calcXAxisData: (data: any[], interval: StockChartInterval) => {
    if (data.length === 0) {
      return []
    }
    if (
      [StockChartInterval.PRE_MARKET, StockChartInterval.INTRA_DAY, StockChartInterval.AFTER_HOURS].includes(interval)
    ) {
      const r = getTradingPeriod(stockUtils.intervalToTrading(interval)!, dayjs(stockUtils.parseTime(data[0][0])).tz('America/New_York'), 'timestamp').map(item =>{
        return (item as number).toString().slice(0, -3)
      })
    }

    const extLen = Math.max(Math.round(data.length * 0.01), 4)
    // console.log(data[data.length - 1][0]* 1000)
    const startTime = data[data.length - 1][0] * 1000

    const scale = renderUtils.getIntervalScale(interval)
    const xAxisData = Array.from({ length: extLen }, (_, i) => {
      const time = dayjs(+startTime).add((i + 1) * scale, 'millisecond')
      return time.valueOf().toString().slice(0, -3)
    })

    return [...data.map(o => o[0]), ...xAxisData]
  },

  /**
   * 日期格式化
   */
  getDateFormatter: (interval: StockChartInterval) => {
    if (interval <= StockChartInterval.DAY) {
      return 'YYYY-MM-DD HH:mm w'
    }
    return 'YYYY-MM-DD w'
  },

  /**
   * 根据提供的时间找到最接近的时间
   * 必须是有序数组, 使用二分查找
   */
  findNearestTime: (data: StockRawRecord[], time: number, gte?: boolean) => {
    if (data.length === 0) return
    if (data.length === 1) return data[0]

    let left = 0
    let right = data.length - 1

    while (left < right) {
      const mid = Math.floor((left + right) / 2)
      const midTime = +data[mid][0]!

      if (midTime === time) {
        return data[mid]
      }

      if (midTime < time) {
        left = mid + 1
      } else {
        right = mid
      }
    }

    if (gte) {
      return data[left]
    }
    return data[left - 1]
  },

   
}
