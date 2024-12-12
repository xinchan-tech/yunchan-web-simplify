import { type getStockChart, type getStockIndicatorData, StockChartInterval } from '@/api'
import type echarts from '@/utils/echarts'
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
   * 该值应持久化到本地存储
   */
  secondaryIndicators: string[]

  /**
   * 设置状态
   */
  setState: Updater<KChartState>

  /**
   * 获取当前激活的窗口或者切换当前激活的窗口
   */
  activeChart: (index?: StockChartInterval) => MainChartState

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
  setMainIndicators: (params: { index?: number; indicators: Indicator[] | Indicator}) => void

  /**
   * 设置主图指标数据
   */
  setMainIndicatorData: (params: { index?: number; id: string; data: any[] }) => void

  /**
   * 获取主图指标数据
   */
  getMainIndicatorData: (params: { index?: number; id: string }) => any

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
}

/**
 * 指标
 */
export type Indicator = {
  id: string
  type: string
  timeIndex: StockChartInterval
  symbol: string
}

/**
 * 指标数据
 */
export type IndicatorData = string[] | {name: string, draw?: string, data: string[] | NormalizedRecord<any>, style: {
  color?: string
  linethick: number
  style_type?: string
}}[] | undefined

/**
 * 指标缓存
 */
export type IndicatorCache = WeakMap<Indicator, IndicatorData>

/**
 * K线图实例状态
 * 一个实例对应一个窗口
 */
type MainChartState = {
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
  secondaryIndicators: string[]
  /**
   * 附图指标数据, 一定要是长度为5的数组，分别对应5个附图
   */
  secondaryIndicatorsData: (Awaited<ReturnType<typeof getStockIndicatorData>>['result'] | null)[]
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
}

export type KChartState = Pick<KChartContext, 'activeChartIndex' | 'state' | 'secondaryIndicators' | 'viewMode'>

export const KChartContext = createContext<KChartContext>({} as unknown as KChartContext)

export const useKChartContext = () => {
  return useContext(KChartContext)
}

/**
 * 创建默认的图表状态
 */
export const createDefaultChartState = (): MainChartState => ({
  symbol: 'QQQ',
  type: 'k-line',
  timeIndex: StockChartInterval.DAY,
  system: 'pro',
  getChart: () => undefined,
  /**
   * 9: 底部信号
   * 10: 买卖点位
   */
  secondaryIndicators: ['9', '10'],
  secondaryIndicatorsData: [null, null, null, null, null],
  mainIndicators: {},
  mainCoiling: ['1', '227', '228', '229'],
  mainData: {
    history: [],
    coiling_data: [],
    md5: ''
  }
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
