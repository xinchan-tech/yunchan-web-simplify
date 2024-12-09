import { type getStockChart, type getStockIndicatorData, StockChartInterval } from '@/api'
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

type MainChartState = {
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
  mainIndicators: string[]
  /**
   * 主图数据
   */
  mainData: Awaited<ReturnType<typeof getStockChart>>
}

export interface KChartContext {
  viewMode: ViewMode
  state: MainChartState[]
  activeChartIndex: number
  /**
   * 附图指标，多窗口模式下新建的窗口附图数量根据这个值来确定
   * 正常情况下应该与第一个窗口的附图指标一致
   * 该值应持久化到本地存储
   */
  secondaryIndicators: string[]

  setState: Updater<KChartState>
}

export type KChartState = Omit<KChartContext, 'setState'>

export const KChartContext = createContext<KChartContext>({} as unknown as KChartContext)

export const useKChartContext = () => {
  return useContext(KChartContext)
}

/**
 *
 */
export const createDefaultChartState = (): MainChartState => ({
  type: 'k-line',
  timeIndex: StockChartInterval.DAY,
  system: 'pro',
  /**
   * 9: 底部信号
   * 10: 买卖点位
   */
  secondaryIndicators: ['9', '10'],
  secondaryIndicatorsData: [null, null, null, null, null],
  mainIndicators: ['1', '227', '228', '229'],
  mainData: {
    history: [],
    coiling_data: [],
    md5: ''
  }
})


/**
 * 判断是否是分时图
 */
export const isTimeIndexChart = (timeIndex: StockChartInterval) => [StockChartInterval.PRE_MARKET, StockChartInterval.AFTER_HOURS, StockChartInterval.INTRA_DAY, StockChartInterval.FIVE_DAY].includes(timeIndex)