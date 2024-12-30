import { getCollectHot } from "@/api"
import { CapsuleTabs, JknTable, type JknTableProps, NumSpan, StockView } from "@/components"
import { type StockRecord, stockManager } from "@/utils/stock"
import { useQuery } from "@tanstack/react-query"
import Decimal from "decimal.js"
import { useMemo } from "react"


// type 1: 最热关注
const HotType = 0

const TopList = () => {
  const query = useQuery({
    queryKey: [getCollectHot.cacheKey],
    queryFn: () => getCollectHot({ extend: ['total_share'] }),
    refetchInterval: 30 * 1000
  })

  const data = useMemo(() => query.data?.find(v => v.type === HotType)?.stocks.map(v => stockManager.toStockRecord(v)[0]) ?? [], [query.data])

  const columns: JknTableProps<StockRecord>['columns'] = [
    {
      header: '名称代码', accessorKey: 'name', meta: { width: '24%' },
      cell: ({ row }) => <StockView code={row.original.code} name={row.getValue('name')} />

    },
    {
      header: '现价', accessorKey: 'close', meta: { align: 'right', width: '17%' },
      cell: ({ row }) => <NumSpan blink value={Decimal.create(row.getValue<number>('close')).toFixed(2)} isPositive={row.original.isUp} align="right" />
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right', width: '20%' },
      cell: ({ row }) => (
        <div className="inline-block">
          <NumSpan block className="py-1 w-20" decimal={2} value={`${row.getValue<number>('percent') * 100}`} percent isPositive={row.getValue<number>('percent') >= 0} symbol />
        </div>
      )
    },
    {
      header: '成交额', accessorKey: 'turnover', meta: { align: 'right', width: '20%' },
      cell: ({ row }) => <NumSpan unit decimal={2} value={row.getValue('turnover')} isPositive={row.getValue<number>('percent') >= 0} />
    },
    {
      header: '总市值', accessorKey: 'marketValue', meta: { align: 'right', width: '19%' },
      cell: ({ row }) => Decimal.create(row.getValue('marketValue')).toDecimalPlaces(2).toShortCN()
    },
  ]
  return (
    <div className="w-full h-full">
      <div className="border-style-primary px-1 py-2">
        <CapsuleTabs activeKey="hot">
          <CapsuleTabs.Tab value="hot" label={<span>热度金池</span>} />
        </CapsuleTabs>
      </div>
      <div className="h-[calc(100%-38px)]">
        <JknTable rowKey="code" columns={columns} data={data} />
      </div>
    </div>
  )
}

export default TopList