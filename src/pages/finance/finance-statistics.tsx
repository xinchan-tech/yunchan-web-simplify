import { getStockFinancialsStatistics } from '@/api'
import { JknIcon, TcRcTable, StockSelect, SubscribeSpan } from '@/components'
import { useQueryParams } from '@/hooks'
import { useStockList } from '@/store'
import { type StockWithExt, stockUtils } from '@/utils/stock'
import { useQuery } from '@tanstack/react-query'
import { financeTableColumns } from './finance-table-columns'

interface FinanceStatisticsProps {
  stock?: StockWithExt
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
        {!props.stock ? (
          '--'
        ) : (
          <>
            <SubscribeSpan.Price
              trading="intraDay"
              symbol={props.stock.symbol}
              initValue={props.stock.close}
              initDirection={stockUtils.isUp(props.stock)}
              decimal={3}
            />
            <SubscribeSpan.Percent
              type="amount"
              trading="intraDay"
              symbol={props.stock.symbol}
              initValue={props.stock.close - props.stock.prevClose}
              initDirection={stockUtils.isUp(props.stock)}
              decimal={3}
            />
            <SubscribeSpan.Percent
              trading="intraDay"
              symbol={props.stock.symbol}
              initValue={stockUtils.getPercent(props.stock)}
              initDirection={stockUtils.isUp(props.stock)}
              decimal={3}
            />
          </>
        )}

        <span className="!ml-auto text-tertiary text-xs flex items-center space-x-4">
          <span>更新时间：{stockStatistics.data?.latest_date}</span>
          <StockSelect placeholder="搜索股票" onChange={v => setQueryParams({ symbol: v })} />
        </span>
      </div>
      <div className="mt-8 flex-1 overflow-hidden">
        <TcRcTable
          isLoading={stockStatistics.isLoading}
          rowKey={row => `${row.symbol}_${row.report_date}`}
          columns={financeTableColumns}
          data={stockStatistics.data?.items ?? []}
        />
      </div>
      <style jsx>{`
        .finance-statistics-table :global(.jkn-rc-table .rc-table-body .rc-table-cell) {
          padding: 0;
        }
      `}</style>
    </div>
  )
}
