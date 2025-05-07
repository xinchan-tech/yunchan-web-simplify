import { appEvent } from '@/utils/event'
import { produce } from 'immer'
import { chartEvent } from './event'
import { renderUtils } from './utils'
import {
  type ViewMode,
  type ChartStore,
  useKChart,
  type StockChartInterval,
  CoilingIndicatorId,
  type Indicator,
  ChartType,
  MainYAxis,
  type KChartStore
} from '@/store'

export type { ChartStore, StockChartInterval, Indicator, KChartStore }
export { useKChart, MainYAxis, CoilingIndicatorId, ChartType }

export const chartManage = {
  /**
   * 修改存储数据
   */
  setStore: (fn: (store: ChartStore) => void, chart?: string) => {
    useKChart.setState(state => {
      return produce(state, draft => {
        const id = chart || state.activeChartId
        fn(draft.chartStores[id])
      })
    })
  },
  setActiveChart: (chartId: string) => {
    useKChart.setState({
      activeChartId: chartId
    })
  },
  showDrawTool: (show: boolean) => {
    useKChart.setState({
      drawTool: show
    })
  },
  getChart: (chartId: string): Nullable<ChartStore> => {
    const chart = useKChart.getState().chartStores[chartId]
    return chart
  },
  setSymbol: (symbol: string, chartId?: string) => {
    chartManage.setStore(state => {
      state.symbol = symbol
    }, chartId)
    // chartEvent.get().emit('symbolChange', symbol)
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
    setTimeout(() => {
      chartManage.setStore(state => {
        const indicator = state.mainIndicators.find(indicator => +indicator.id === +indicatorId)
        if (!indicator) return
        chartEvent.get().emit('mainIndicatorChange', { type: 'remove', indicator })
        state.mainIndicators = state.mainIndicators.filter(indicator => +indicator.id !== +indicatorId)
      }, chartId)
    }, 10)
  },
  /**
   *
   */
  addSecondaryIndicator: (indicator: Indicator, chartId?: string) => {
    const secondary = useKChart.getState().getActiveChart().secondaryIndicators

    if (secondary.length >= 5) {
      appEvent.emit('toast', { message: '最多只能添加5个附图指标' })
      return
    }
    chartManage.setStore(state => {
      if (state.secondaryIndicators.find(i => i.id === indicator.id)) return
      state.secondaryIndicators.push(indicator)
    }, chartId)
    chartEvent.get().emit('subIndicatorChange', { type: 'add', indicator })
  },
  removeSecondaryIndicator: (indicatorId: string, chartId?: string) => {
    setTimeout(() => {
      chartManage.setStore(state => {
        const indicator = state.secondaryIndicators.find(indicator => +indicator.id === +indicatorId)
        if (!indicator) return
        chartEvent.get().emit('subIndicatorChange', { type: 'remove', indicator })
        state.secondaryIndicators = state.secondaryIndicators.filter(indicator => +indicator.id !== +indicatorId)
      }, chartId)
    }, 10)
  },
  /**
   * 设置主图类型
   */
  setType: (type: ChartType, chartId?: string) => {
    chartEvent.get().emit('chartTypeChange', type)
    chartManage.setStore(state => {
      state.type = type
    }, chartId)
  },
  /**
   * 设置视图模式
   */
  setViewMode: (viewMode: ViewMode) => {
    const currentViewMode = useKChart.getState().viewMode
    if (currentViewMode === viewMode) return

    const currentModeCount = renderUtils.getViewMode(currentViewMode)
    const targetModeCount = renderUtils.getViewMode(viewMode)

    if (currentModeCount === targetModeCount) {
      useKChart.setState({
        viewMode,
        activeChartId: 'chart-0'
      })
      return
    }

    const chartStores = useKChart.getState().chartStores
    const activeChart = useKChart.getState().getActiveChart()
    const newChartStores: typeof chartStores = {}

    const newActive = currentModeCount > targetModeCount ? 'chart-0' : useKChart.getState().activeChartId

    for (let i = 0; i < targetModeCount; i++) {
      const chartId = `chart-${i}`
      newChartStores[chartId] = chartStores[chartId] || { ...activeChart, id: chartId }
    }

    useKChart.setState({
      viewMode,
      activeChartId: newActive,
      chartStores: newChartStores
    })
  },
  setStockOverlay: (symbol: string, name: string, chartId?: string) => {
    const overlayStock = chartId
      ? useKChart.getState().chartStores[chartId].overlayStock
      : useKChart.getState().getActiveChart().overlayStock

    if (overlayStock.some(stock => stock.symbol === symbol)) return

    chartManage.setStore(state => {
      state.overlayStock.push({ symbol, name })
    }, chartId)

    chartEvent.get().emit('stockCompareChange', { type: 'add', symbol })

    chartManage.setYAxis({
      left: useKChart.getState().getActiveChart().yAxis.left,
      right: MainYAxis.Percentage
    })
  },
  removeStockOverlay: (symbol: string, chartId?: string) => {
    chartManage.setStore(state => {
      state.overlayStock = state.overlayStock.filter(stock => stock.symbol !== symbol)
    }, chartId)
    chartEvent.get().emit('stockCompareChange', { type: 'remove', symbol })
  },
  cleanStockOverlay: (chartId?: string) => {
    chartManage.setStore(state => {
      state.overlayStock = []
    }, chartId)
  },
  setMarkOverlay: (mark: string, type: string, chartId?: string) => {
    const m = {
      mark,
      type
    }
    chartEvent.get().emit('markOverlayChange', { type: 'add', params: m as any })
    chartManage.setStore(state => {
      state.overlayMark = m
    }, chartId)
  },
  removeMarkOverlay: (chartId?: string) => {
    chartManage.setStore(state => {
      chartEvent.get().emit('markOverlayChange', { type: 'remove', params: state.overlayMark as any })
      state.overlayMark = undefined
    }, chartId)
  },
  setMode: (mode: 'normal' | 'backTest', chartId?: string) => {
    chartManage.setStore(state => {
      state.mode = mode
    }, chartId)
  },
  addCoiling: (coiling: CoilingIndicatorId, chartId?: string) => {
    const _coiling = useKChart.getState().chartStores[chartId ?? useKChart.getState().activeChartId].coiling

    if (_coiling.includes(coiling)) return

    chartManage.setStore(state => {
      state.coiling.push(coiling)
    }, chartId)
    chartEvent.get().emit('coilingChange', { type: 'add', coiling: [coiling] })
  },
  removeCoiling: (coiling: CoilingIndicatorId, chartId?: string) => {
    const _coiling = useKChart.getState().chartStores[chartId ?? useKChart.getState().activeChartId].coiling

    if (!_coiling.includes(coiling)) return

    chartManage.setStore(state => {
      state.coiling = state.coiling.filter(c => c !== coiling)
    }, chartId)
    chartEvent.get().emit('coilingChange', { type: 'remove', coiling: [coiling] })
  },
  setYAxis: (yAxis: ChartStore['yAxis'], chartId?: string) => {
    chartManage.setStore(state => {
      state.yAxis = yAxis
    }, chartId)
    chartEvent.get().emit('yAxisChange', yAxis)
  }
}
