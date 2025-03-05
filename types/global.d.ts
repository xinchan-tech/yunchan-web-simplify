declare type AnyRecord = Record<string, any>

declare module '*.scss'

declare type PageResult<T> = {
  items: T[]
  before: number
  current: number
  first: number
  last: number
  limit: number
  next: number
  previous: number
  total_items: number
  total_nums: number
  total_pages: number
}

declare type NormalizedRecord<T = any> = Record<string, T>

declare type ArrayItem<T> = T extends Array<infer U> ? U : never

declare const __RELEASE_TAG__: string

declare const __RELEASE_VERSION__: string

declare type Optional<T, K extends keyof T> = Omit<T, K> & Partial<T>

declare type RequiredBy<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>

declare type Nullable<T> = T | null

declare type Undefinable<T> = T | undefined

interface Google {
  accounts: any
}

// 扩展 window 对象的类型定义
interface Window {
  google: Google
  AppleID: any

  Module: {
    coiling_calculate: (data: StockRawRecord[], len: number, interval: number) => Promise<CoilingData>
  }

  CoilingModule: () => Promise<Module>

  PolicyModule: () => Promise<{
    libversion: () => string
    policy_execute: (
      fmlData: {
        formula: string
        // symbol 股票代码
        symbal: string
      },
      data: StockRawRecord[],
      interval: number
    ) => Promise<{ data: any[]; status: number}>
  }>
}

/**
 * 缠论相关定义
 */
type CoilingData = {
  divergences: any[]
  status: 0 | 1
  points: CoilingPoint[]
  /**
   * 中枢
   */
  pivots: CoilingPivot[]
  /**
   * 扩展中枢
   */
  expands: CoilingPivotExt[]
  /**
   * 一类买卖点
   */
  class_1_trade_points: CoilingTradePoint[]
  /**
   * 二类买卖点
   */
  class_2_trade_points: CoilingTradePoint[]
  /**
   * 三类买卖点
   */
  class_3_trade_points: CoilingTradePoint[]
}

type CoilingPoint = {
  index: number
  price: number
}

type CoilingTradePoint = {
  /**
   * 0: 卖; 1: 买
   */
  buy: 0 | 1
  /**
   * 买卖点位置，points索引
   */
  index: number
  /**
   * true为大，false为小
   */
  large: boolean
  /**
   * -1: 负; 1: 正
   */
  positive: -1 | 1
  /**
   * 买卖点价格
   */
  price: number
}

type CoilingPivot = {
  /**
   * 中枢的开始位置，points索引
   */
  start: number
  /**
   * 中枢的结束位置，points索引
   */
  end: number
  /**
   * 中枢的顶，points索引
   */
  top: number
  /**
   * 中枢的底，points索引
   */
  bottom: number
  /**
   * 中枢方向（向上或向下）1: 向上; 其他: 向下
   */
  direction: number
  /**
   * 中枢结束方向，1为正向结束，-1为反向结束
   */
  positive: -1 | 1
  /**
   * 中枢标记
   * @link /example/coiling.js
   */
  mark: number
  /**
   * 中枢段数
   */
  segmentNum: number
}

type CoilingPivotExt = Omit<CoilingPivot, 'segmentNum' | 'mark' | 'positive'> & {
  /**
   * 扩展级数
   */
  level: number
}
