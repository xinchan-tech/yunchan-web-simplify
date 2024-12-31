import { CapsuleTabs } from "@/components"
import { useState } from "react"
import { FinanceCore } from "./finance-core"
import { FinanceValuation } from "./finance-valuation"
import { stockBaseCodeInfoExtend } from "../lib"
import { useQueryParams } from "@/hooks"
import { useQuery } from "@tanstack/react-query"
import { getStockBaseCodeInfo } from "@/api"
import { stockManager } from "@/utils/stock"
import { FinanceStatistics } from "./finance-statistics"
import { FinanceStatisticsCate } from "./finance-statistics-cate"
import { FinanceComparison } from "./finance-comparison"

export const Finance = () => {
  const [queryParams] = useQueryParams<{ symbol: string }>()
  const { symbol } = queryParams ?? 'QQQ'

  const stockBaseInfo = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, symbol, stockBaseCodeInfoExtend],
    queryFn: () => getStockBaseCodeInfo({ symbol, extend: stockBaseCodeInfoExtend }),
    enabled: !!symbol,
    select: data => stockManager.toSimpleStockRecord(data.stock)
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
        {
          {
            core: <FinanceCore stock={stockBaseInfo.data} />,
            valuation: <FinanceValuation stock={stockBaseInfo.data} />,
            statistics: <FinanceStatistics stock={stockBaseInfo.data} />,
            statisticsCate: <FinanceStatisticsCate />,
            pk: <FinanceComparison />
          }[activeTab] ?? null
        }
      </div>
    </div>
  )
}
