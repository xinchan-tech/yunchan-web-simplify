import { type getStockChart, type getStockTabList, StockChartInterval } from '@/api'
import type echarts from '@/utils/echarts'
import mitt, { Emitter } from 'mitt'
import { nanoid } from 'nanoid'
import { createContext, useContext } from 'react'
import type { Updater } from 'use-immer'

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

  /**
   * 设置状态
   * @deprecated
   */
  setState: Updater<KChartState>

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
   * 叠加标记列表
   */
  overMarkList: Awaited<ReturnType<typeof getStockTabList>>

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
  setMainSystem: (params: { index?: number; system: string }) => void

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
    data?: Awaited<ReturnType<typeof getStockChart>>
    dateConvert?: boolean
  }) => void

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
  system: string
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
  mainData: Awaited<ReturnType<typeof getStockChart>>
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

export const KChartContext = createContext<KChartContext>({} as unknown as KChartContext)

export type KChartState = Pick<KChartContext, 'activeChartIndex' | 'state' | 'viewMode'>

export const useKChartContext = () => {
  return useContext(KChartContext)
}

/**
 * 创建默认的图表状态
 * @param opts
 * @param opts.symbol 股票代码
 * @param opts.index 窗口索引
 * @returns 图表实例状态
 *
 */
export const createDefaultChartState = (opts: { symbol?: string; index: number }): ArrayItem<KChartState['state']> => {
  const defaultState = JSON.parse(localStorage.getItem('k-chart-state') ?? 'null') as ArrayItem<
    KChartState['state']
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
      coiling_data: undefined,
      md5: ''
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
