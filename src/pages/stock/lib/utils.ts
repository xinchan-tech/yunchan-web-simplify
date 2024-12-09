import type { ECOption } from '@/utils/echarts'
import type { KChartContext, KChartState } from './ctx'

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
  cleanSecondaryIndicators: (state: KChartState, mainIndex: number, index: number) => {
    state.state[mainIndex - 1].secondaryIndicatorsData[index - 1] = null
  }
}
