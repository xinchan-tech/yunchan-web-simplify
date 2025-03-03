import { StockChartInterval } from '@/api'
import { produce } from 'immer'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { chartEvent } from './event'

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
  }[]
  /**
   * 叠加标记
   */
  overlayMark?: {
    mark: string
    title: string
  }

  /**
   * 主图坐标轴
   */
  yAxis: {
    left?: MainYAxis
    right: MainYAxis
  }

  /**
   * 回测模式
   */
  backTest: boolean
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
   * 图表配置
   */
  chartStores: Record<string, ChartStore>
  /**
   * getActiveChart
   */
  getActiveChart: () => ChartStore
}

export const createDefaultChartStore = (chartId: string): ChartStore => {
  return {
    type: ChartType.Candle,
    interval: StockChartInterval.DAY,
    system: 'pro',
    id: chartId,
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
    },
    backTest: false
  }
}

export const useChartManage = create<ChartManageStore>()(
  persist(
    (_set, get) => ({
      viewMode: 'single',
      activeChartId: 'chart-0',
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
  }
}
