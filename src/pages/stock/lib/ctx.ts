import { type getStockChart, type getStockTabList, StockChartInterval } from '@/api'
import type echarts from '@/utils/echarts'
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
   * 附图指标，多窗口模式下新建的窗口附图数量根据这个值来确定
   * 正常情况下应该与第一个窗口的附图指标一致
   * TODO: 该值应持久化到本地存储
   */
  secondaryIndicators: Indicator[]

  /**
   * 设置状态
   * @deprecated
   */
  setState: Updater<KChartState>

  /**
   * 获取当前激活的窗口或者切换当前激活的窗口
   */
  activeChart: (index?: StockChartInterval) => MainChartState

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
  setMainCoiling: (params: { index?: number; coiling: string[] }) => void

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
  setMainData: (params: { index?: number; data?: Awaited<ReturnType<typeof getStockChart>> }) => void

  /**
   * 设置指标数据，主图和附图的指标数据都可以设置，多个窗口时不需要指定窗口索引
   * @param params
   * @param params.indicator 指标
   * @param params.data 数据
   */
  setIndicatorData: (params: { indicator: Indicator; data: any }) => void

  /**
   * 获取指标数据
   */
  getIndicatorData: (params: { indicator: Indicator }) => IndicatorData

  /**
   * 修改视图模式
   */
  setViewMode: (params: { index?: number; viewMode: ViewMode }) => void

  /**
   * 添加股票PK叠加的股票
   */
  addOverlayStock: (params: { index?: number, symbol: string}) => void

  /**
   * 移除股票PK叠加的股票
   */
  removeOverlayStock: (params: { index?: number, symbol: string }) => void

  /**
   * 设置叠加标记
   */
  setOverlayMark: (params: { index?: number, mark: string, type: string, title: string }) => Promise<void>
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
 * 指标缓存
 */
export type IndicatorCache = WeakMap<Indicator, IndicatorData>

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
  mainCoiling: string[]
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
}

export const KChartContext = createContext<KChartContext>({} as unknown as KChartContext)

export type KChartState = Pick<KChartContext, 'activeChartIndex' | 'state' | 'secondaryIndicators' | 'viewMode'>

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
export const createDefaultChartState = (opts: { symbol?: string; index: number }): MainChartState => ({
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
  secondaryIndicators: [
    { id: '9', type: 'system', timeIndex: StockChartInterval.DAY, symbol: opts.symbol ?? 'QQQ' },
    { id: '10', type: 'system', timeIndex: StockChartInterval.DAY, symbol: opts.symbol ?? 'QQQ' }
  ],
  mainIndicators: {},
  mainCoiling: ['1', '227', '228', '229'],
  mainData: {
    history: [],
    coiling_data: [],
    md5: ''
  },
  overlayStock: [],
  overlayMark: undefined
})

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
