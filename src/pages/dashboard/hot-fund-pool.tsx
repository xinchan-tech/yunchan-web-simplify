import { getCollectHot } from "@/api"
import { CapsuleTabs, JknTable, type JknTableProps } from "@/components"
import { useStock } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { cn } from "@/utils/style"
import { useRequest, useSize } from "ahooks"
import dayjs from "dayjs"
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

  const query = useRequest(getCollectHot, {
    cacheKey: 'collectHot',
    pollingInterval: 30 * 1000,
    defaultParams: [
      { extend: ['total_share'] },
    ],
    onSuccess: (data) => {
      const d = data.find(v => v.type === HotType)
      if (!d) return

      for (const s of d.stocks) {
        s.stock[0] = dayjs(s.stock[0]).hour(15).minute(59).second(0).format('YYYY-MM-DD HH:mm:ss')
        stock.insertRaw(s.symbol, s.stock)
      }

    }
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
      header: '名称代码', accessorKey: 'name', sorter: true, showSorterTooltip: false,
      width: '25%',
      cell: ({row, table}) => (
        <div className="overflow-hidden w-full">
          <div className="text-secondary">{row.original.code}</div>
          <div className="text-tertiary text-xs text-ellipsis overflow-hidden whitespace-nowrap w-full">{row.getValue('name')}</div>
        </div>
      )

    },
    {
      header: '现价', accessorKey: 'price', sorter: true, align: 'right', showSorterTooltip: false, width: '17%',
      cell: ({row}) => <span className={cn(row.getValue<number>('percent') >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {numToFixed(row.getValue<number>('price'))}
      </span>
    },
    {
      header: '涨跌幅', accessorKey: 'percent', sorter: true, align: 'right', showSorterTooltip: false, width: '22%',
      cell: ({row}) => (
        <div className={cn(row.getValue<number>('percent') >= 0 ? 'bg-stock-up' : 'bg-stock-down', 'h-full rounded-sm w-16 text-center px-1 py-0.5 float-right')}>
          {row.getValue<number>('percent') > 0 ? '+' : null}{`${numToFixed(row.getValue<number>('percent') * 100, 2)}%`}
        </div>
      )
    },
    {
      header: '成交额', accessorKey: 'turnover', sorter: true, align: 'right', showSorterTooltip: false, width: '17%',
      cell: ({row}) => <span className={cn(row.getValue<number>('percent') >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {priceToCnUnit(row.getValue<number>('turnover') * 10000, 2)}
      </span>
    },
    {
      header: '总市值', accessorKey: 'marketValue', sorter: true, align: 'right', showSorterTooltip: false, width: '19%',
      cell: ({row}) => <span className={cn(row.getValue<number>('percent') >= 0 ? 'text-stock-up' : 'text-stock-down')}>
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
      <div className="h-[calc(100%-38px)]" ref={tableContainer}>
        <div>
          <JknTable  columns={columns} data={data} key="code" sortDirections={['descend', 'ascend']} scroll={{
            y: tableSize?.height ? tableSize.height - 32 : 0
          }} pagination={false} />
        </div>
      </div>
    </div>
  )
}

export default TopList