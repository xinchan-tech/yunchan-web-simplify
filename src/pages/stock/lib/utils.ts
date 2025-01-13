import { StockChartInterval } from '@/api'
import type { ECOption } from '@/utils/echarts'
import dayjs, { type Dayjs } from 'dayjs'
import type { ECBasicOption } from 'echarts/types/dist/shared'
import type { KChartContext } from './ctx'
import type { EChartsType } from "echarts/core"
import { getTradingPeriod } from "@/utils/date"
import { stockUtils } from "@/utils/stock"

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
      return options.grid[index]
    }
  },

  getGridSize: (chart: EChartsType, index = 0) => {
    const grid = chart.getOption().grid

    console.log(grid)
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
    const X_AXIS_HEIGHT = 24
    const TOP_OFFSET = 10
    const [width, height] = size
  
    const gridLeft = hasLeft ? Y_AXIS_WIDTH: 0
  
    const gridSize = [
      width - Y_AXIS_WIDTH - gridLeft,
      height - X_AXIS_HEIGHT - TOP_OFFSET
    ]

    const grid: {left: number, top: number, width: number, height: number}[] = []

    if(secondaryIndicatorLen === 0) {
      grid.push({
        left: gridLeft,
        top: TOP_OFFSET,
        width: gridSize[0],
        height: gridSize[1]
      })
    }else if(secondaryIndicatorLen <= 3){
      grid.push({
        left: gridLeft,
        top: TOP_OFFSET,
        width: gridSize[0],
        height: gridSize[1] * (5 - secondaryIndicatorLen) / 5
      })

      Array.from({ length: secondaryIndicatorLen }, (_) => {
        grid.push({
          left: gridLeft,
          top: grid.reduce((acc, cur) => acc + cur.height, 0),
          width: gridSize[0],
          height: gridSize[1] / 5
        })
      })
    }else {
      grid.push({
        left: gridLeft,
        top: TOP_OFFSET,
        width: gridSize[0],
        height: gridSize[1] * 0.4
      })

      Array.from({ length: secondaryIndicatorLen }, (_) => {
        grid.push({
          left: gridLeft,
          top: grid.reduce((acc, cur) => acc + cur.height, 0),
          width: gridSize[0],
          height: gridSize[1] / 5
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
    switch(interval) {
      case StockChartInterval.PRE_MARKET:
      case StockChartInterval.INTRA_DAY:
      case StockChartInterval.AFTER_HOURS:
      case StockChartInterval.ONE_MIN:
        return src.isSame(target, 'minute')
      case StockChartInterval.TWO_MIN:
        return src.add(2, 'minute').isAfter(target)
      case StockChartInterval.FIVE_MIN:
        return src.add(5, 'minute').isAfter(target)
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
      default:
        return false
    }
  },

  /**
   * 获取zoom刻度坐标
   */
  getScaledZoom: (chart: EChartsType, index = 0): [number, number] => {
    // @ts-ignore
    return chart.getModel().getComponent('xAxis', index).axis.scale.getExtent()
  },

  /**
   * 获取刻度间隔
   */
  getIntervalScale: (interval: StockChartInterval): number => {
    switch(interval) {
      case StockChartInterval.PRE_MARKET:
      case StockChartInterval.INTRA_DAY:
      case StockChartInterval.AFTER_HOURS:
      case StockChartInterval.ONE_MIN:
        return 60 * 1000
      case StockChartInterval.TWO_MIN:
        return 2 * 60 * 1000
      case StockChartInterval.FIVE_MIN:
        return 5 * 60 * 1000
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
      case StockChartInterval.YEAR:
        return 365 * 24 * 60 * 60 * 1000
      default:
        return 0
    }
  },

  calcXAxisData: (data: any[], interval: StockChartInterval) => {
    if(data.length === 0){
      return []
    }
    if([StockChartInterval.PRE_MARKET, StockChartInterval.INTRA_DAY, StockChartInterval.AFTER_HOURS].includes(interval)) {
      return getTradingPeriod(stockUtils.intervalToTrading(interval)!, dayjs(+data[0][0])).map(item => dayjs(item).valueOf())
    }

 
    const extLen = Math.round(data.length * 0.01)
    
    const startTime = data[data.length - 1][0]
    const scale = renderUtils.getIntervalScale(interval)
    const xAxisData = Array.from({ length: extLen }, (_, i) => {
      const time = dayjs(startTime).add((i + 1) * scale, 'millisecond')
      return time.valueOf()
    })
    console.log()
    return [...data.map(o => o[0]), ...xAxisData]
  }
}
