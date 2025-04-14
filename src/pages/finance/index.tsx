import { getStockBaseCodeInfo } from '@/api'
import { CapsuleTabs } from '@/components'
import { useQueryParams } from '@/hooks'
import { stockUtils } from '@/utils/stock'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { FinanceComparison } from './finance-comparison'
import { FinanceCore } from './finance-core'
import { FinanceStatistics } from './finance-statistics'
import { FinanceStatisticsCate } from './finance-statistics-cate'
import { FinanceValuation } from './finance-valuation'
const stockBaseCodeInfoExtend = [
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
const Finance = () => {
  const [queryParams] = useQueryParams<{ symbol: string }>()
  const { symbol } = queryParams ?? 'QQQ'

  const stockBaseInfo = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, symbol, stockBaseCodeInfoExtend],
    queryFn: () => getStockBaseCodeInfo({ symbol, extend: stockBaseCodeInfoExtend as any }),
    enabled: !!symbol,
    select: data => stockUtils.toStockWithExt(data.stock, { extend: data.extend })
  })

  const [activeTab, setActiveTab] = useState('core')
  return (
    <div className="flex h-full overflow-hidden flex-col">
      <div className="border border-solid border-border py-1 px-2">
        <CapsuleTabs activeKey={activeTab} onChange={setActiveTab}>
          <CapsuleTabs.Tab label="核心财务" value="core" />
          <CapsuleTabs.Tab label="估值泡沫" value="valuation" />
          <CapsuleTabs.Tab label="财报统计" value="statistics" />
          <CapsuleTabs.Tab label="同行对比" value="statisticsCate" />
          <CapsuleTabs.Tab label="财务PK" value="pk" />
        </CapsuleTabs>
      </div>
      <div className="flex-1">
        {{
          core: <FinanceCore stock={stockBaseInfo.data} />,
          valuation: <FinanceValuation stock={stockBaseInfo.data} />,
          statistics: <FinanceStatistics stock={stockBaseInfo.data} />,
          statisticsCate: <FinanceStatisticsCate />,
          pk: <FinanceComparison />
        }[activeTab] ?? null}
      </div>
    </div>
  )
}

export default Finance
