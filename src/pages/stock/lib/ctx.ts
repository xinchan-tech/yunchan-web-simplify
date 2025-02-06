import { StockChartInterval, getStockChart, getStockIndicatorData, getStockTabData } from '@/api'
import { useIndicator, useTime } from '@/store'
import { calcCoiling } from '@/utils/coiling'
import type echarts from '@/utils/echarts'
import { queryClient } from '@/utils/query-client'
import dayjs from 'dayjs'
import { produce } from 'immer'
import mitt from 'mitt'
import { nanoid } from 'nanoid'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { renderUtils } from './utils'

export type ViewMode =
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

type MainChartType = 'line' | 'k-line'

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

/**
 * K线图上下文
 */
export interface KChartContext {
  /**
   * 视图模式
   */
  viewMode: ViewMode

  /**
   * 窗口状态
   */
  state: MainChartState[]

  /**
   * 当前激活的窗口索引
   * 从0开始
   */
  activeChartIndex: number
}

type KChartUtils = {
  // /**
  //  * 设置状态
  //  * @deprecated
  //  */
  // setState: Updater<KChartState>

  /**
   * 设置图表symbol
   * @param params
   * @param params.index 窗口索引, 默认为当前激活的窗口
   * @param params.symbol 股票代码
   * @returns
   */
  setSymbol: (params: { index?: number; symbol: string }) => void

  /**
   * 切换当前激活的窗口
   */
  setActiveChart: (index: StockChartInterval) => void

  /**
   * 修改分时图
   * @param params
   * @param params.index 窗口索引, 默认为当前激活的窗口
   * @param params.timeIndex 分时
   */
  setTimeIndex: (params: { index?: number; timeIndex: StockChartInterval }) => void

  /**
   * 修改缠论系统类型
   * @param params
   * @param params.index 窗口索引, 默认为当前激活的窗口
   * @param params.system 缠论系统
   * @returns
   */
  setMainSystem: (params: { index?: number; system?: string }) => void

  /**
   * 修改主图的指标
   * @param params
   * @param params.index 窗口索引, 默认为当前激活的窗口
   * @param params.indicators 主图指标
   */
  setMainIndicators: (params: { index?: number; indicators: Indicator[] | Indicator }) => void

  /**
   * 切换主图的线型
   * @param params
   * @param params.index 窗口索引, 默认为当前激活的窗口
   * @param params.type 线型
   */
  toggleMainChartType: (params: { index?: number; type?: MainChartType }) => void

  /**
   * 修改主图缠论
   */
  setMainCoiling: (params: { index?: number; coiling: CoilingIndicatorId[] }) => void

  /**
   * 修改附图数量
   * @param params
   * @param params.index 窗口索引, 默认为当前激活的窗口
   * @param params.count 附图数量
   * @param params.indicator 附图指标, 新修改的附图数量大于当前附图数量时，会用这个指标填充，默认为第一个附图指标
   */
  setSecondaryIndicatorsCount: (params: { index?: number; count: number; indicator: Indicator }) => void

  /**
   * 修改附图指标
   * @param params
   * @param params.index 窗口索引, 默认为当前激活的窗口
   * @param params.indicatorIndex 附图索引
   * @param params.indicator 指标
   */
  setSecondaryIndicator: (params: { index?: number; indicatorIndex: number; indicator: Indicator }) => void

  /**
   * 设置主图数据
   */
  setMainData: (params: {
    index?: number
    data?: Awaited<ReturnType<typeof getStockChart>>['history']
    timeIndex?: StockChartInterval
    dateConvert?: boolean
  }) => Promise<void>

  /**
   * 设置指标数据，主图和附图的指标数据都可以设置
   * @param params
   * @param params.index 窗口索引, 默认为当前激活的窗口
   * @param params.indicator 指标
   * @param params.data 数据
   */
  setIndicatorData: (params: { index: number; indicatorId: string; data: any }) => void

  /**
   * 修改视图模式
   */
  setViewMode: (params: { index?: number; viewMode: ViewMode }) => void

  /**
   * 添加股票PK叠加的股票
   */
  addOverlayStock: (params: { index?: number; symbol: string }) => void

  /**
   * 移除股票PK叠加的股票
   */
  removeOverlayStock: (params: { index?: number; symbol: string }) => void

  /**
   * 设置叠加标记
   */
  setOverlayMark: (params: { index?: number; mark: string; type: string; title: string }) => Promise<void>

  /**
   * 设置坐标轴
   */
  setYAxis: (params: { index?: number; yAxis: { left?: MainYAxis; right: MainYAxis } }) => void

  /**
   * 修改指标可见性
   */
  setIndicatorVisible: (params: {
    index?: number
    indicatorId: string
    visible: boolean
    secondaryIndex?: number
  }) => void
}

/**
 * 指标
 */
export type Indicator = {
  id: string
  type: string
  timeIndex: StockChartInterval
  symbol: string
  start_at?: string
  key: string
  name: string
  visible?: boolean
  data?: IndicatorData
}

/**
 * 指标数据
 */
export type IndicatorData =
  | string[]
  | {
      name: string
      draw?: string
      data: string[] | NormalizedRecord<any>
      style: {
        color?: string
        linethick: number
        style_type?: string
      }
    }[]
  | undefined

/**
 * 坐标轴
 */
type MainYAxis = 'price' | 'percent'

/**
 * K线图实例状态
 * 一个实例对应一个窗口
 */
type MainChartState = {
  id: string
  index: number
  /**
   * 股票代码
   */
  symbol: string
  /**
   * 主图类型
   */
  type: MainChartType
  /**
   * 分时
   */
  timeIndex: StockChartInterval
  /**
   * 缠论系统
   */
  system?: string
  /**
   * 附图的指标，有几个指标就有几个附图
   */
  secondaryIndicators: Indicator[]
  // /**
  //  * 附图指标数据, 一定要是长度为5的数组，分别对应5个附图
  //  */
  // secondaryIndicatorsData: (Awaited<ReturnType<typeof getStockIndicatorData>>['result'] | null)[]
  /**
   * 主图的指标
   */
  mainIndicators: NormalizedRecord<Indicator>
  /**
   * 主图缠论
   */
  mainCoiling: CoilingIndicatorId[]
  /**
   * 主图数据
   */
  mainData: {
    history: Awaited<ReturnType<typeof getStockChart>>['history']
    coilingData?: CoilingData
  }
  /**
   * chart实例
   */
  getChart: () => echarts.ECharts | undefined
  /**
   * 叠加股票数据
   */
  overlayStock: {
    symbol: string
    data: Awaited<ReturnType<typeof getStockChart>>
  }[]
  /**
   * 叠加标记
   */
  overlayMark?: {
    mark: string
    title: string
    data?: any[]
  }

  /**
   * 主图坐标轴
   */
  yAxis: {
    left?: MainYAxis
    right: MainYAxis
  }
}

/**
 * 创建默认的图表状态
 * @param opts
 * @param opts.symbol 股票代码
 * @param opts.index 窗口索引
 * @returns 图表实例状态
 *
 */
export const createDefaultChartState = (opts: { symbol?: string; index: number }): ArrayItem<
  KChartContext['state']
> => {
  const defaultState = JSON.parse(localStorage.getItem('k-chart-state') ?? 'null') as ArrayItem<
    KChartContext['state']
  > | null
  return {
    symbol: opts.symbol ?? 'QQQ',
    type: 'k-line',
    id: nanoid(),
    index: opts.index,
    timeIndex: StockChartInterval.DAY,
    system: 'pro',
    getChart: () => undefined,
    /**
     * 9: 底部信号
     * 10: 买卖点位
     */
    secondaryIndicators: defaultState?.secondaryIndicators
      ? [...defaultState.secondaryIndicators.map(item => ({ ...item, key: nanoid() }))]
      : [
          {
            id: '9',
            type: 'system',
            timeIndex: StockChartInterval.DAY,
            symbol: opts.symbol ?? 'QQQ',
            key: nanoid(),
            name: '底部信号'
          },
          {
            id: '10',
            type: 'system',
            timeIndex: StockChartInterval.DAY,
            symbol: opts.symbol ?? 'QQQ',
            key: nanoid(),
            name: '买卖点位'
          }
        ],
    mainIndicators: {},
    mainCoiling: defaultState?.mainCoiling
      ? [...defaultState.mainCoiling]
      : [
          CoilingIndicatorId.PEN,
          CoilingIndicatorId.ONE_TYPE,
          CoilingIndicatorId.TWO_TYPE,
          CoilingIndicatorId.THREE_TYPE,
          CoilingIndicatorId.PIVOT
        ],
    mainData: {
      history: [],
      coilingData: undefined
    },
    overlayStock: [],
    overlayMark: undefined,
    yAxis: {
      right: 'price'
    }
  }
}

/**
 * 判断是否是分时图
 */
export const isTimeIndexChart = (timeIndex: StockChartInterval) =>
  [
    StockChartInterval.PRE_MARKET,
    StockChartInterval.AFTER_HOURS,
    StockChartInterval.INTRA_DAY,
    StockChartInterval.FIVE_DAY
  ].includes(timeIndex)

export const chartEvent = {
  event: mitt(),
  create() {
    this.event = mitt()
    return this.event
  }
}

export const useKChartStore = create<KChartContext>()(
  persist(
    (_, __) => ({
      activeChartIndex: 0,
      viewMode: 'single',
      state: [createDefaultChartState({ index: 0, symbol: 'QQQ' })]
    }),
    {
      name: 'k-chart',
      storage: createJSONStorage(() => localStorage),
      partialize: state => {
        const r = state.state[0]

        return {
          activeChartIndex: 0,
          viewMode: 'single',
          state: [
            {
              type: r.type,
              id: r.id,
              index: r.index,
              timeIndex: r.timeIndex,
              system: r.system,
              secondaryIndicators: r.secondaryIndicators.map(item => ({
                ...item,
                data: undefined
              })),
              mainIndicators: r.mainIndicators,
              mainCoiling: r.mainCoiling,
              mainData: {
                history: [],
                coiling_data: undefined,
                md5: ''
              },

              overlayStock: [],
              overlayMark: undefined,
              yAxis: r.yAxis
            }
          ]
        }
      }
    }
  )
)

export const kChartUtils: KChartUtils = {
  setSymbol: ({ index, symbol }) => {
    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            draft.symbol = symbol
          })
        }
        return item
      })
    }))
  },
  setTimeIndex: ({ index, timeIndex }) => {
    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            draft.timeIndex = timeIndex
            if(isTimeIndexChart(timeIndex)) {
              draft.type = 'line'
            }

            Object.values(draft.mainIndicators).forEach(v => {
              v.timeIndex = timeIndex
              v.data = undefined
            })

            draft.secondaryIndicators.forEach(v => {
              v.timeIndex = timeIndex
              v.data = undefined
            })
          })
        }
        return item
      })
    }))
  },
  toggleMainChartType: ({ index, type }) => {
    const state = useKChartStore.getState().state[index ?? useKChartStore.getState().activeChartIndex]
    if (type && state.type === type) return

    if(isTimeIndexChart(state.timeIndex) && type === 'k-line') return

    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            draft.type = draft.type === 'k-line' ? 'line' : 'k-line'
          })
        }
        return item
      })
    }))
  },
  setMainIndicators: ({ index, indicators }) => {
    const _indicators = Array.isArray(indicators) ? indicators : [indicators]
    const _indicatorsMap: NormalizedRecord<Indicator> = {}
    const chart = useKChartStore.getState().state[index ?? useKChartStore.getState().activeChartIndex]
    _indicators.forEach(indicator => {
      _indicatorsMap[indicator.id] = chart.mainIndicators[indicator.id] ?? indicator
    })

    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            draft.mainIndicators = _indicatorsMap
          })
        }
        return item
      })
    }))
  },
  setMainSystem: ({ index, system }) => {
    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            draft.system = system
          })
        }
        return item
      })
    }))
  },
  setOverlayMark: async ({ index, mark, type, title }) => {
    const chart = useKChartStore.getState().state[index ?? useKChartStore.getState().activeChartIndex]

    if (chart.overlayMark?.mark === mark) return

    if (mark) {
      queryClient
        .ensureQueryData({
          queryKey: [getStockTabData.cacheKey, { type, mark, symbol: chart.symbol }],
          queryFn: () => getStockTabData({ param: { [type]: [mark] }, ticker: chart.symbol, start: '2010-01-01' }),
          revalidateIfStale: true
        })
        .then(r => {
          useKChartStore.setState(state => ({
            state: state.state.map(item => {
              if (item.index === (index ?? state.activeChartIndex)) {
                return produce(item, draft => {
                  draft.overlayMark = {
                    mark,
                    title,
                    data: r[type]
                  }
                })
              }
              return item
            })
          }))
        })
    }

    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            draft.overlayMark = {
              mark,
              title
            }
          })
        }
        return item
      })
    }))
  },
  setMainCoiling: ({ index, coiling }) => {
    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            draft.mainCoiling = coiling
          })
        }
        return item
      })
    }))
  },
  addOverlayStock: ({ index, symbol }) => {
    const chart = useKChartStore.getState().state[index ?? useKChartStore.getState().activeChartIndex]
    if (chart.overlayStock.some(item => item.symbol === symbol)) return
    const startTime = renderUtils.getStartTime(useTime.getState().getCurrentUsTime(), chart.timeIndex)
    const params = {
      start_at: startTime,
      ticker: symbol,
      interval: chart.timeIndex,
      gzencode: true
    }

    queryClient
      .ensureQueryData({
        queryKey: [getStockChart.cacheKey, { symbol }],
        queryFn: () => getStockChart(params)
      })
      .then(data => {
        useKChartStore.setState(state => ({
          state: state.state.map(item => {
            if (item.index === (index ?? state.activeChartIndex)) {
              return produce(item, draft => {
                draft.overlayStock.push({
                  symbol,
                  data
                })
              })
            }
            return item
          })
        }))
      })
  },
  setViewMode: ({ viewMode }) => {
    useKChartStore.setState(state => {
      const count = renderUtils.getViewMode(viewMode)
      let newState: typeof state.state | null = null

      if (count > state.state.length) {
        const activeChart = state.state[state.activeChartIndex]
        newState = [
          ...state.state,
          ...Array.from({ length: count - state.state.length }, (_, i) =>
            createDefaultChartState({ index: state.state.length + i, symbol: activeChart.symbol })
          )
        ]
      } else if (count < state.state.length) {
        newState = state.state.slice(0, count)
      }

      if (newState) {
        return {
          viewMode,
          state: newState
        }
      }

      return {
        viewMode
      }
    })
  },
  setMainData: async ({ index, data, dateConvert, timeIndex }) => {
    const history = data ? (dateConvert ? data.map(v => [dayjs(v[0]).valueOf().toString(), ...v.slice(1)]) : data) : []
    let coilingData = undefined

    if (data?.length && timeIndex !== undefined) {
      coilingData = await calcCoiling(data, timeIndex)
    }
 
    useKChartStore.setState(s => ({
      state: produce(s.state, draft => {
        const item = draft.find(item => item.index === (index ?? s.activeChartIndex))
        if (item) {
          item.mainData = {
            history: history as any,
            coilingData
          }
        }
      })
    }))
    // useKChartStore.setState(state => ({
    //   state: state.state.map(item => {
    //     if (item.index === (index ?? state.activeChartIndex)) {
    //       const newD = produce(item, draft => {
    //         draft.mainData = data
    //           ? dateConvert
    //             ? ({
    //               ...data,
    //               history: data.history.map(v => [dayjs(v[0]).valueOf().toString(), ...v.slice(1)])
    //             } as any)
    //             : data
    //           : {
    //             history: [],
    //             coiling_data: undefined,
    //             md5: ''
    //           }
    //       })
    //       return newD
    //     }
    //     return item
    //   })
    // }))
  },
  setIndicatorData: ({ index, indicatorId, data }) => {
    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            const indicators = []

            if (draft.mainIndicators[indicatorId]) {
              indicators.push(draft.mainIndicators[indicatorId])
            }

            indicators.push(...draft.secondaryIndicators.filter(i => i.id === indicatorId))

            if (indicators.length === 0) return

            indicators.forEach(indicator => {
              indicator.data = data
            })
          })
        }
        return item
      })
    }))
  },
  setSecondaryIndicator: ({ index, indicatorIndex, indicator }) => {
    const queryKey = [
      getStockIndicatorData.cacheKey,
      { symbol: indicator.symbol, cycle: indicator.timeIndex, id: indicator.id, db_type: indicator.type }
    ] as any[]

    if (!useIndicator.getState().isDefaultIndicatorParams(indicator.id)) {
      queryKey.push(useIndicator.getState().getIndicatorQueryParams(indicator.id))
    }

    const queryData = queryClient.getQueryData(queryKey) as { id: string; data: any[] }

    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            if (queryData) {
              draft.secondaryIndicators[indicatorIndex] = { ...indicator, data: queryData.data }
              queryClient.invalidateQueries({ queryKey })
            } else {
              draft.secondaryIndicators[indicatorIndex] = indicator
            }
          })
        }
        return item
      })
    }))
  },
  removeOverlayStock: ({ index, symbol }) => {
    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            draft.overlayStock = draft.overlayStock.filter(item => item.symbol !== symbol)
          })
        }
        return item
      })
    }))
  },
  setActiveChart: index => {
    useKChartStore.setState(() => ({
      activeChartIndex: index
    }))
  },
  setIndicatorVisible: ({ index, indicatorId, visible, secondaryIndex }) => {
    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            if (secondaryIndex !== undefined) {
              draft.secondaryIndicators[secondaryIndex].visible = visible
            } else {
              draft.mainIndicators[indicatorId].visible = visible
            }
          })
        }
        return item
      })
    }))
  },
  setSecondaryIndicatorsCount: ({ index, count, indicator }) => {
    const state = useKChartStore.getState().state[index ?? useKChartStore.getState().activeChartIndex]

    if (state.secondaryIndicators.length === count) return

    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            if (draft.secondaryIndicators.length > count) {
              draft.secondaryIndicators = draft.secondaryIndicators.slice(0, count)
            } else {
              for (let i = draft.secondaryIndicators.length; i < count; i++) {
                draft.secondaryIndicators.push({ ...indicator, key: nanoid() })
              }
            }
          })
        }
        return item
      }),
      activeChartIndex: 0
    }))
  },
  setYAxis: ({ index, yAxis }) => {
    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            draft.yAxis = yAxis
          })
        }
        return item
      })
    }))
  }
}
