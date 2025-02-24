import {
  StockChartInterval,
  type StockRawRecord,
  getStockChart,
  getStockChartV2,
  getStockIndicatorData,
  getStockTabData
} from '@/api'
import { useIndicator } from '@/store'
import { calcCoiling } from '@/utils/coiling'
import type echarts from '@/utils/echarts'
import { queryClient } from '@/utils/query-client'
import { stockUtils } from '@/utils/stock'
import dayjs from 'dayjs'
import { produce } from 'immer'
import { nanoid } from 'nanoid'
import { mapValues } from 'radash'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { renderUtils } from './utils'
import { dateUtils } from '@/utils/date'

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
   * 批量设置指标数据
   * @param params
   * @returns
   */
  setIndicatorsData: (params: { index: number; data: { indicatorId: string; data: any }[] }) => void

  /**
   * 清除所有指标数据
   * @param params
   * @returns
   */
  clearIndicatorsData: (params: { index: number }) => void

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

  /**
   * 设置回测
   */
  setBackTest: (params: { index?: number; backTest?: boolean }) => void

  /**
   *
   */
  addBackTestMark: (params: {
    index?: number
    type: '买入' | '卖出'
    time: string
    count: number
    price: number
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
  formula?: string
  data?: IndicatorData
  /**
   * 计算类型： =svr_policy 是从后端获取
   */
  calcType: string
}

/**
 * 指标数据
 */
export type IndicatorData =
  | (
      | IndicatorDataLine
      | IndicatorDataDrawGradient
      | IndicatorDataDrawStickLine
      | IndicatorDataDrawText
      | IndicatorDataDrawNumber
      | IndicatorDataDrawRectRel
      | IndicatorDataDrawIcon
      | IndicatorDataDrawBand
    )[]
  | undefined
type DrawFunc = '' | 'STICKLINE' | 'DRAWTEXT' | 'DRAWGRADIENT' | 'DRAWNUMBER' | 'DRAWRECTREL' | 'DRAWICON' | 'DRAWBAND'
type IndicatorDataBase<T extends DrawFunc> = {
  draw: T
  color: string
  linethick: number
  name?: string
  style_type?: string
}

type IndicatorDataLine = IndicatorDataBase<''> & {
  data: number[]
}
type IndicatorDataDrawStickLine = IndicatorDataBase<'STICKLINE'> & {
  draw_data: Record<number, [number, number, number, number]>
}
type IndicatorDataDrawText = IndicatorDataBase<'DRAWTEXT'> & {
  draw_data: {
    x: number
    y: number
    drawY: number
    text: string
    offsetX: number
    offsetY: number
  }[]
}
/**
 * 一个渐变的多边形
 * 值类型为 [startX, endX, minY, maxY, [number, number][], color1, color2]
 * startX: 多边形起始x轴坐标
 * endX: 多边形结束x轴坐标
 * minY: 多边形最小y轴坐标
 * maxY: 多边形最大y轴坐标
 * [number, number][]: 多边形的点，每个点是一个数组，第一个元素是x轴坐标，第二个元素是y轴坐标
 * color1: 颜色1
 * color2: 颜色2
 */
type IndicatorDataDrawGradient = IndicatorDataBase<'DRAWGRADIENT'> & {
  draw_data: [number, number, number, number, [number, number][], string, string][]
}
type IndicatorDataDrawNumber = IndicatorDataBase<'DRAWNUMBER'> & {
  draw_data: {
    x: number
    y: number
    drawY: number
    number: number
    offsetX: number
    offsetY: number
  }[]
}
type IndicatorDataDrawBand = IndicatorDataBase<'DRAWBAND'> & {
  draw_data: {
    polygonIndex: number
    x: number
    y: number
    polygon?: {
      color: string
      points: {
        x: number
        drawY: number
      }[]
    }
  }[]
}
/**
 * 一个固定位置的矩形
 * 值类型为 [leftTopX, leftTopY, rightBottomX, rightBottomY, color]
 * leftTopX: 矩形左上角x轴坐标
 * leftTopY: 矩形左上角y轴坐标
 * rightBottomX: 矩形右下角x轴坐标
 * rightBottomY: 矩形右下角y轴坐标
 * color: 颜色
 */
type IndicatorDataDrawRectRel = IndicatorDataBase<'DRAWRECTREL'> & {
  draw_data: Record<number, [number, number, number, number, string]>
}
type IndicatorDataDrawIcon = IndicatorDataBase<'DRAWICON'> & {
  draw_data: {
    x: number
    y: number
    drawY: number
    icon: number
    offsetX: number
    offsetY: number
  }[]
}

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
    data: StockRawRecord[]
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

  /**
   * 回测模式
   */
  backTest: boolean

  /**
   * 回测买卖点mark的标记
   */
  backTestMark?: {
    type: '买入' | '卖出'
    time: string
    count: number
    price: number
  }[]
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
            name: '底部信号',
            calcType: 'trade_point'
          },
          {
            id: '10',
            type: 'system',
            timeIndex: StockChartInterval.DAY,
            symbol: opts.symbol ?? 'QQQ',
            key: nanoid(),
            name: '买卖点位',
            calcType: 'trade_hdly'
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
    },
    backTest: false,
    backTestMark: []
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
              mainIndicators: mapValues(r.mainIndicators, value => ({
                ...value,
                data: undefined
              })) as any,
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
            if (isTimeIndexChart(timeIndex)) {
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

    if (isTimeIndexChart(state.timeIndex) && type === 'k-line') return

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

    // const startTime =
    //   useKChartStore.getState().state[index ?? useKChartStore.getState().activeChartIndex].mainData.history[0]?.[0]

    const interval = useKChartStore.getState().state[index ?? useKChartStore.getState().activeChartIndex].timeIndex

    const params = {
      ticker: symbol,
      interval: interval
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
                  data: data.history.map(item => [
                    dateUtils.toUsDay(item[0]).valueOf().toString().slice(0, -3),
                    ...item.slice(1)
                  ]) as any
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
  setIndicatorsData: ({ index, data }) => {
    // console.log("🚀 ~ data:", data)

    useKChartStore.setState(state => {
      const _state = produce(state.state, draft => {
        const s = draft[index ?? state.activeChartIndex]

        data.forEach(({ indicatorId, data }) => {
          const indicators = []
          if (s.mainIndicators[indicatorId]) {
            indicators.push(s.mainIndicators[indicatorId])
          }

          indicators.push(...s.secondaryIndicators.filter(i => i.id === indicatorId))

          if (indicators.length === 0) return

          indicators.forEach(indicator => {
            indicator.data = data
          })
        })
      })

      return {
        state: _state
      }
    })
  },
  setSecondaryIndicator: ({ index, indicatorIndex, indicator }) => {
    const queryKey = [
      getStockIndicatorData.cacheKey,
      { symbol: indicator.symbol, cycle: indicator.timeIndex, id: indicator.id, db_type: indicator.type }
    ] as any[]

    if (!useIndicator.getState().isDefaultIndicatorParams(indicator.id)) {
      queryKey.push(useIndicator.getState().getIndicatorQueryParams(indicator.id))
    }

    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            draft.secondaryIndicators[indicatorIndex] = indicator
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
  },
  setBackTest: ({ index, backTest }) => {
    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            draft.backTest = backTest === undefined ? !draft.backTest : backTest
          })
        }
        return item
      })
    }))
  },
  addBackTestMark: params => {
    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === (params.index ?? state.activeChartIndex)) {
          return produce(item, draft => {
            if (!draft.backTestMark) {
              draft.backTestMark = [params]
            } else {
              draft.backTestMark.push(params)
            }
          })
        }
        return item
      })
    }))
  },
  clearIndicatorsData: ({ index }) => {
    useKChartStore.setState(state => ({
      state: state.state.map(item => {
        if (item.index === index) {
          return produce(item, draft => {
            Object.values(draft.mainIndicators).forEach(v => {
              v.data = undefined
            })

            draft.secondaryIndicators.forEach(v => {
              v.data = undefined
            })
          })
        }
        return item
      })
    }))
  }
}
