import { getCollectHot } from "@/api"
import { CapsuleTabs, JknTable, ScrollArea, StockView, type JknTableProps } from "@/components"
import { useStock } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { cn } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import { useSize } from "ahooks"
import { useMemo, useRef } from "react"

type TableData = {
  key: string
  code: string
  name: string
  price: number,
  percent: number,
  turnover: number,
  marketValue: number,
  date: string
}

// type 1: 最热关注
const HotType = 0

const TopList = () => {
  const stock = useStock()
  const tableContainer = useRef<HTMLDivElement>(null)
  const tableSize = useSize(tableContainer)

  const query = useQuery({
    queryKey: [getCollectHot.cacheKey],
    queryFn: () => getCollectHot({ extend: ['total_share'] }),
    refetchInterval: 30 * 1000
  })

  const data = useMemo(() => {
    const d: TableData[] = []
    const codes: [string, number, string][] = query.data?.find(v => v.type === HotType)?.stocks.map(v => [v.symbol, v.extend.total_share as number, v.name]) ?? []
    for (const [code, share, name] of codes) {
      const lastData = stock.getLastRecordByTrading(code, 'intraDay')
      if (!lastData) continue
      d.push({
        key: code,
        code: code,
        name: name,
        price: lastData.close,
        percent: lastData.percent,
        turnover: lastData.turnover,
        marketValue: share * lastData.close,
        date: lastData.time
      })
    }

    return d
  }, [stock, query.data])

  const columns: JknTableProps<TableData>['columns'] = [
    {
      header: '名称代码', accessorKey: 'name', meta: { width: '24%' },
      cell: ({ row }) => <StockView code={row.original.code} name={row.getValue('name')} />

    },
    {
      header: '现价', accessorKey: 'price', meta: { align: 'right', width: '17%' },
      cell: ({ row }) => <span className={cn(row.getValue<number>('percent') >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {numToFixed(row.getValue<number>('price'))}
      </span>
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right', width: '21%' },
      cell: ({ row }) => (
        <div className={cn(row.getValue<number>('percent') >= 0 ? 'bg-stock-up' : 'bg-stock-down', 'h-full rounded-sm w-16 text-center px-1 py-0.5 float-right')}>
          {row.getValue<number>('percent') > 0 ? '+' : null}{`${numToFixed(row.getValue<number>('percent') * 100, 2)}%`}
        </div>
      )
    },
    {
      header: '成交额', accessorKey: 'turnover', meta: { align: 'right', width: '20%' },
      cell: ({ row }) => <span className={cn(row.getValue<number>('percent') >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {priceToCnUnit(row.getValue<number>('turnover'), 2)}
      </span>
    },
    {
      header: '总市值', accessorKey: 'marketValue', meta: { align: 'right', width: '19%' },
      cell: ({ row }) => <span className={cn(row.getValue<number>('percent') >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {priceToCnUnit(row.getValue<number>('marketValue'), 2)}
      </span>
    },
  ]
  return (
    <div className="w-full h-full">
      <div className="border-style-primary px-1 py-2">
        <CapsuleTabs activeKey="hot">
          <CapsuleTabs.Tab value="hot" label={<span>热度金池</span>} />
        </CapsuleTabs>
      </div>
      <ScrollArea className="h-[calc(100%-38px)]">
        <div>
          <JknTable rowKey="code" columns={columns} data={data} />
        </div>
      </ScrollArea>
    </div>
  )
}

export default TopList