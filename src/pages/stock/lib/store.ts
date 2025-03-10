import { StockChartInterval } from '@/api'
import { produce } from 'immer'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { chartEvent } from './event'
import { renderUtils } from './utils'

type ViewMode =
  | 'single'
  | 'double'
  | 'double-vertical'
  | 'three-left-single'
  | 'three-right-single'
  | 'three-vertical-top-single'
  | 'three-vertical-bottom-single'
  | 'four'
  | 'six'
  | 'nine'

export enum ChartType {
  Candle = 0,
  Area = 1
}

export enum MainYAxis {
  Price = 'price',
  Percentage = 'percentage'
}

export enum CoilingIndicatorId {
  PEN = '1',
  ONE_TYPE = '227',
  TWO_TYPE = '228',
  THREE_TYPE = '229',
  /**
   * 中枢
   */
  PIVOT = '2',
  PIVOT_PRICE = '230',
  PIVOT_NUM = '231',
  /**
   * 反转点
   */
  REVERSAL = '232',
  /**
   * 重叠
   */
  OVERLAP = '233',
  /**
   * 短线
   */
  SHORT_LINE = '234',
  /**
   * 主力
   */
  MAIN = '235'
}

export type Indicator = {
  id: string
  type: string
  name: string
  visible?: boolean
  calcType: string
}

export type ChartStore = {
  id: string
  /**
   * 股票代码
   */
  symbol: string
  /**
   * 模式
   */
  mode: 'normal' | 'backTest'
  /**
   * 主图类型
   */
  type: ChartType
  /**
   * 分时
   */
  interval: StockChartInterval
  /**
   * 缠论系统
   */
  system?: string
  /**
   * 附图的指标，有几个指标就有几个附图
   */
  secondaryIndicators: Indicator[]
  /**
   * 主图的指标
   */
  mainIndicators: Indicator[]
  /**
   * 主图缠论
   */
  coiling: CoilingIndicatorId[]
  /**
   * 叠加股票数据
   */
  overlayStock: {
    symbol: string
    name: string
  }[]
  /**
   * 叠加标记
   */
  overlayMark?: {
    mark: string
    type: string
  }

  /**
   * 主图坐标轴
   */
  yAxis: {
    left?: MainYAxis
    right: MainYAxis
  }
}

interface ChartManageStore {
  /**
   * 视图模式
   */
  viewMode: ViewMode
  /**
   * 当前激活的图表
   */
  activeChartId: string
  /**
   * current
   */
  currentSymbol: string
  /**
   * 图表配置
   */
  chartStores: Record<string, ChartStore>
  /**
   * getActiveChart
   */
  getActiveChart: () => ChartStore
}

export const createDefaultChartStore = (chartId: string, symbol?: string): ChartStore => {
  return {
    type: ChartType.Candle,
    interval: StockChartInterval.DAY,
    system: 'pro',
    mode: 'normal',
    id: chartId,
    symbol: symbol ?? 'QQQ',
    /**
     * 9: 底部信号
     * 10: 买卖点位
     */
    secondaryIndicators: [
      {
        id: '9',
        type: 'system',
        name: '底部信号',
        calcType: 'trade_point'
      },
      {
        id: '10',
        type: 'system',
        name: '买卖点位',
        calcType: 'trade_hdly'
      }
    ],
    mainIndicators: [],
    coiling: [
      CoilingIndicatorId.PEN,
      CoilingIndicatorId.ONE_TYPE,
      CoilingIndicatorId.TWO_TYPE,
      CoilingIndicatorId.THREE_TYPE,
      CoilingIndicatorId.PIVOT
    ],
    overlayStock: [],
    overlayMark: undefined,
    yAxis: {
      right: MainYAxis.Price
    }
  }
}

export const useChartManage = create<ChartManageStore>()(
  persist(
    (_set, get) => ({
      viewMode: 'single',
      activeChartId: 'chart-0',
      currentSymbol: 'QQQ',
      chartStores: {
        'chart-0': createDefaultChartStore('chart-0')
      },
      getActiveChart: () => {
        return get().chartStores[get().activeChartId]
      }
    }),
    {
      name: 'chart-manage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)

export const chartManage = {
  /**
   * 修改存储数据
   */
  setStore: (fn: (store: ChartStore) => void, chart?: string) => {
    useChartManage.setState(state => {
      return produce(state, draft => {
        const id = chart || state.activeChartId
        fn(draft.chartStores[id])
      })
    })
  },
  /**
   * 设置分时
   */
  setInterval: (interval: StockChartInterval, chartId?: string) => {
    chartEvent.get().emit('intervalChange', interval)
    chartManage.setStore(state => {
      state.interval = interval
    }, chartId)
  },
  /**
   * 设置系统
   */
  setSystem: (system: string | undefined, chartId?: string) => {
    chartManage.setStore(state => {
      state.system = system
      if (system) {
        const coiling = [
          CoilingIndicatorId.PEN,
          CoilingIndicatorId.ONE_TYPE,
          CoilingIndicatorId.TWO_TYPE,
          CoilingIndicatorId.THREE_TYPE,
          CoilingIndicatorId.PIVOT
        ]
        state.coiling = coiling
        chartEvent.get().emit('coilingChange', { type: 'add', coiling })
      } else {
        chartEvent.get().emit('coilingChange', { type: 'remove', coiling: state.coiling })
        state.coiling = []
      }
    }, chartId)
  },
  /**
   * 设置缠论
   */
  setCoiling: (coiling: CoilingIndicatorId, chartId?: string) => {
    chartManage.setStore(state => {
      const _coiling = state.coiling
      const index = _coiling.indexOf(coiling)
      if (index > -1) {
        _coiling.splice(index, 1)
        chartEvent.get().emit('coilingChange', { type: 'remove', coiling: [coiling] })
      } else {
        _coiling.push(coiling)
        chartEvent.get().emit('coilingChange', { type: 'add', coiling: [coiling] })
      }
    }, chartId)
  },
  /**
   * 添加主图指标
   */
  addMainIndicator: (indicator: Indicator, chartId?: string) => {
    chartManage.setStore(state => {
      state.mainIndicators.push(indicator)
    }, chartId)
    chartEvent.get().emit('mainIndicatorChange', { type: 'add', indicator })
  },
  removeMainIndicator: (indicatorId: string, chartId?: string) => {
    chartManage.setStore(state => {
      const indicator = state.mainIndicators.find(indicator => indicator.id === indicatorId)
      if (!indicator) return
      chartEvent.get().emit('mainIndicatorChange', { type: 'remove', indicator })
      state.mainIndicators = state.mainIndicators.filter(indicator => indicator.id !== indicatorId)
    }, chartId)
  },
  /**
   *
   */
  addSecondaryIndicator: (indicator: Indicator, chartId?: string) => {
    chartManage.setStore(state => {
      if (state.secondaryIndicators.find(i => i.id === indicator.id)) return
      state.secondaryIndicators.push(indicator)
    }, chartId)
    chartEvent.get().emit('subIndicatorChange', { type: 'add', indicator })
  },
  removeSecondaryIndicator: (indicatorId: string, chartId?: string) => {
    chartManage.setStore(state => {
      const indicator = state.secondaryIndicators.find(indicator => indicator.id === indicatorId)
      if (!indicator) return
      chartEvent.get().emit('subIndicatorChange', { type: 'remove', indicator })
      state.secondaryIndicators = state.secondaryIndicators.filter(indicator => indicator.id !== indicatorId)
    }, chartId)
  },

  /**
   * 设置主图类型
   */
  setType: (type: ChartType, chartId?: string) => {
    chartManage.setStore(state => {
      state.type = type
    }, chartId)
  },
  /**
   * 设置视图模式
   */
  setViewMode: (viewMode: ViewMode) => {
    const currentViewMode = useChartManage.getState().viewMode
    const active = useChartManage.getState().getActiveChart()
    if (currentViewMode === viewMode) return

    const currentModeCount = renderUtils.getViewMode(currentViewMode)
    const targetModeCount = renderUtils.getViewMode(viewMode)

    if (currentModeCount === targetModeCount) {
      useChartManage.setState({
        viewMode
      })
      return
    }

    const chartStores = useChartManage.getState().chartStores
    const newChartStores: typeof chartStores = {}

    for (let i = 0; i < targetModeCount; i++) {
      const chartId = `chart-${i}`
      newChartStores[chartId] = chartStores[chartId] || createDefaultChartStore(chartId, active.symbol)
    }

    useChartManage.setState({
      viewMode,
      chartStores: newChartStores
    })
  },
  setStockOverlay: (symbol: string, name: string, chartId?: string) => {
    const overlayStock = chartId
      ? useChartManage.getState().chartStores[chartId].overlayStock
      : useChartManage.getState().getActiveChart().overlayStock

    if (overlayStock.some(stock => stock.symbol === symbol)) return

    chartManage.setStore(state => {
      state.overlayStock.push({ symbol, name })
    }, chartId)
  },
  removeStockOverlay: (symbol: string, chartId?: string) => {
    chartManage.setStore(state => {
      state.overlayStock = state.overlayStock.filter(stock => stock.symbol !== symbol)
    }, chartId)
  },
  setMarkOverlay: (mark: string, type: string, chartId?: string) => {
    chartManage.setStore(state => {
      state.overlayMark = {
        mark,
        type
      }
    }, chartId)
  },
  removeMarkOverlay: (chartId?: string) => {
    chartManage.setStore(state => {
      state.overlayMark = undefined
    }, chartId)
  },
  setMode: (mode: 'normal' | 'backTest', chartId?: string) => {
    chartManage.setStore(state => {
      state.mode = mode
    }, chartId)
  }
}
