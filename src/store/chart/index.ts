import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { useUser } from "../user"

export enum StockChartInterval {
  /**
   * 0：盘中分时图，-1：盘前分时图，-2：盘后分时图，小于1440-任意分钟的分钟线, 1440-日线, 7200：5日分时图, 10080-周线, 43200-月线,
   * 129600-季线, 259200-半年线
   */
  INTRA_DAY = 0,
  PRE_MARKET = -1,
  AFTER_HOURS = -2,
  FIVE_DAY = 7200,
  ONE_MIN = 1,
  TWO_MIN = 2,
  THREE_MIN = 3,
  FIVE_MIN = 5,
  TEN_MIN = 10,
  FIFTEEN_MIN = 15,
  THIRTY_MIN = 30,
  FORTY_FIVE_MIN = 45,
  ONE_HOUR = 60,
  TWO_HOUR = 120,
  THREE_HOUR = 180,
  FOUR_HOUR = 240,
  DAY = 1440,
  WEEK = 10080,
  MONTH = 43200,
  QUARTER = 129600,
  HALF_YEAR = 259200,
  YEAR = 518400
}

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

export enum ChartType {
  Candle = 0,
  Area = 1,
  /**
   * 美国线
   */
  AmericanLine = 2,
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

export interface ChartManageStore {
  userId?: string
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
   * 画线工具
   */
  drawTool: boolean
  /**
   * toolBar
   */
  drawToolBar: {
    icon: string
    label: string
  }[]
  /**
   * getActiveChart
   */
  getActiveChart: () => ChartStore
}

export const createDefaultChartStore = (chartId: string, symbol?: string): ChartStore => {
  return {
    type: ChartType.Candle,
    interval: StockChartInterval.DAY,
    system: '302',
    mode: 'normal',
    id: chartId,
    symbol: symbol ?? 'QQQ',
    /**
     * 9: 底部信号
     * 10: 买卖点位
     */
    secondaryIndicators: [
      {
        calcType: 'trade_hdly',
        id: 9 as unknown as string,
        name: '海底捞月',
        type: 'system'
      }
    ],
    mainIndicators: [
      {
        id: 302 as unknown as string,
        name: '缠论AI专业系统',
        type: 'system',
        calcType: ''
      },
      {
        id: 241 as unknown as string,
        name: '黄蓝梯子(短线版)',
        type: 'system',
        calcType: 'local_policy'
      }
    ],
    overlayStock: [],
    coiling: [
      CoilingIndicatorId.PEN,
      CoilingIndicatorId.ONE_TYPE,
      CoilingIndicatorId.TWO_TYPE,
      CoilingIndicatorId.THREE_TYPE,
      CoilingIndicatorId.PIVOT
    ],
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
      userId: undefined,
      currentSymbol: 'QQQ',
      drawTool: false,
      drawToolBar: [],
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

useUser.subscribe(state => {
  console.log('user state changed', state)
  const userId = state.user?.username

  if(!userId) return

  const chartManage = useChartManage.getState()

  if(!chartManage.userId){
    useChartManage.setState({
      userId
    })
  }

})