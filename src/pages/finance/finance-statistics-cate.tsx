import { getStockFinancialsStatisticsCate } from '@/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  JknIcon,
  JknRcTable
} from '@/components'
import { useQueryParams } from '@/hooks'
import { useQuery } from '@tanstack/react-query'
import { useUpdateEffect } from 'ahooks'
import Decimal from 'decimal.js'
import { useEffect, useState } from 'react'
import { financeTableColumns } from './finance-table-columns'

export const FinanceStatisticsCate = () => {
  const [queryParams] = useQueryParams<{ symbol: string }>()
  const { symbol } = queryParams ?? 'QQQ'
  const [plateId, setPlateId] = useState<string>()
  const [plates, setPlates] = useState<{ id: string; name: string }[]>([])

  const stockStatisticsCate = useQuery({
    queryKey: [getStockFinancialsStatisticsCate.cacheKey, symbol, plateId],
    queryFn: () => getStockFinancialsStatisticsCate({ symbol, quarter: '2024-2', plate_id: plateId }),
    enabled: !!symbol
  })

  useEffect(() => {
    if (!plateId && stockStatisticsCate.data?.plates) {
      setPlates(stockStatisticsCate.data.plates)
      setPlateId(stockStatisticsCate.data.plates[0].id)
    }
  }, [stockStatisticsCate.data, plateId])

  useUpdateEffect(() => {
    setPlateId(undefined)
    setPlates([])
  }, [symbol])

  return (
    <div className="finance-statistics-table h-full flex flex-col overflow-hidden ">
      <div className="flex items-center py-2 space-x-4 text-sm w-full mt-4 px-4 box-border">
        <div className="flex items-center space-x-2 ">
          <span> 相关板块：</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="text-primary">
                {plates.find(item => item.id === plateId)?.name ?? '--'}
                <JknIcon name="arrow_down" className="w-2 h-2  ml-1" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {plates.map(item => (
                <DropdownMenuItem key={item.id} onClick={() => setPlateId(item.id)}>
                  {item.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <span className="!ml-auto flex items-center space-x-4">
          <span>财报上涨概率：{Decimal.create(stockStatisticsCate.data?.rise_rate).mul(100).toFixed(2)}%</span>
          <span>已发布：{stockStatisticsCate.data?.release_num ?? '-'}</span>
          <span>未发布：{stockStatisticsCate.data?.unrelease_num ?? '-'}</span>
        </span>
      </div>
      <div className="mt-4 flex-1 overflow-hidden">
        <JknRcTable
          isLoading={stockStatisticsCate.isLoading}
          rowKey={row => `${row.symbol}_${row.report_date}`}
          columns={financeTableColumns}
          data={stockStatisticsCate.data?.items ?? []}
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
