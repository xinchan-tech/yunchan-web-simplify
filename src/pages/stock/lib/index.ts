import type { StockChartInterval, StockExtend } from '@/api'
import { useQueryParams } from '@/hooks'

export const timeIndex: StockChartInterval[] = [
  -1, 0, -2, 7200, 1, 2, 3, 5, 10, 15, 30, 45, 60, 120, 180, 240, 1440, 10080, 43200, 129600, 259200, 518400
]
export const useSymbolQuery = () => {
  const [queryParams] = useQueryParams<{ symbol: string }>()

  return queryParams.symbol ?? 'QQQ'
}

export const stockBaseCodeInfoExtend: StockExtend[] = [
  'collect',
  'alarm_ai',
  'alarm_all',
  'day_basic',
  'total_share',
  'financials',
  'bubble',
  'stock_before',
  'stock_after'
]

export * from './store'

export * from './utils'
