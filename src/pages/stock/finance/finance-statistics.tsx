import { getStockFinancialsStatistics } from "@/api"
import { JknIcon, JknRcTable, NumSpan, StockSelect } from "@/components"
import { useQueryParams } from "@/hooks"
import { useStockList } from "@/store"
import type { StockRecord } from "@/utils/stock"
import { useQuery } from "@tanstack/react-query"
import Decimal from "decimal.js"
import { financeTableColumns } from "./finance-table-columns"

interface FinanceStatisticsProps {
  stock?: StockRecord
}


export const FinanceStatistics = (props: FinanceStatisticsProps) => {
  const [queryParams, setQueryParams] = useQueryParams<{ symbol: string }>()
  const { symbol } = queryParams ?? 'QQQ'

  const stockStatistics = useQuery({
    queryKey: [getStockFinancialsStatistics.cacheKey, symbol],
    queryFn: () => getStockFinancialsStatistics(symbol),
    enabled: !!symbol
  })

  const { listMap } = useStockList()

  const stockIcon = listMap[symbol]

  // const columns = useMemo(() => {
  //  return 
  // }, [])

  return (
    <div className="px-12 finance-statistics-table h-full flex flex-col overflow-hidden ">
      <div className="flex items-center py-2 space-x-4 text-sm w-full mt-12">
        <div className="flex items-center space-x-2 ">
          <JknIcon stock={stockIcon?.[0]} className="w-8 h-8" />
          <span>{stockIcon?.[1]}</span>
        </div>
        <NumSpan value={props.stock?.close} isPositive={props.stock?.isUp} decimal={3} />
        <NumSpan value={props.stock?.percentAmount} isPositive={props.stock?.isUp} decimal={3} symbol />
        <NumSpan value={Decimal.create(props.stock?.percent).mul(100)} isPositive={props.stock?.isUp} decimal={2} symbol percent />

        <span className="!ml-auto text-tertiary text-xs flex items-center space-x-4">
          <span>更新时间：{stockStatistics.data?.latest_date}</span>
          <StockSelect placeholder="搜索股票" onChange={v => setQueryParams({ symbol: v })} />
        </span>
      </div>
      <div className="mt-8 flex-1 overflow-hidden">
        <JknRcTable  isLoading={stockStatistics.isLoading} rowKey={(row) => `${row.symbol}_${row.report_date}`} columns={financeTableColumns} data={stockStatistics.data?.items ?? []} />
      </div>
      <style jsx>{`
        .finance-statistics-table :global(.jkn-rc-table .rc-table-body .rc-table-cell) {
          padding: 0;
        }
      `}</style>
    </div>
  )
}