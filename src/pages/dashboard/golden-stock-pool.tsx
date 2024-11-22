import { Button, CapsuleTabs, JknTable, type JknTableProps, ScrollArea, StockView } from "@/components"
import { useCollectCates, useStock, useToken } from "@/store"
import { appEvent } from "@/utils/event"
import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { getStockCollects } from "@/api"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { cn } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"

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

const GoldenStockPool = () => {
  const { collects, refresh } = useCollectCates()
  const [type, setType] = useState(collects[0].id)
  const { token } = useToken()
  const stock = useStock()
  const { t } = useTranslation()

  const query = useQuery({
    queryKey: [getStockCollects.cacheKey, type],
    refetchInterval: 30 * 1000,
    queryFn: () => getStockCollects({
      cate_id: +type,
      extend: ['total_share', 'basic_index', 'day_basic', 'alarm_ai', 'alarm_all', 'financials', 'thumbs', 'stock_after', 'stock_before'],
      limit: 300
    })
  })

  const data = useMemo(() => {
    const d: TableData[] = []
    if (!query.data) return d

    for (const { stock: _stock, name, symbol, extend } of query.data.items) {
      const lastData = stock.getLastRecordByTrading(symbol, 'intraDay')
  
      d.push({
        key: symbol,
        code: symbol,
        name: name,
        price: lastData?.close ?? 0,
        percent: lastData?.percent ?? 0,
        turnover: lastData?.turnover ?? 0,
        marketValue: (extend?.total_share as number ?? 0) * (lastData?.close ?? 0),
        date: lastData?.time ?? '-'
      })
    }

    return d
  }, [stock, query.data])

  const onLogin = () => {
    appEvent.emit('login')
  }

  const columns: JknTableProps<TableData>['columns'] = [
    {
      accessorKey: 'name',
      header: '名称代码',
      meta: { width: '30%' },
      cell: ({ row }) => (
        <StockView code={row.original.code} name={row.getValue('name')} />
      )
    },
    {
      header: '现价', accessorKey: 'price', meta: { align: 'right', width: '17%'}, 
      cell: ({ row }) => <span className={cn(row.original.percent >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {numToFixed(row.getValue('price'))}
      </span>
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right', width: '20%'}, 
      cell: ({ row }) => (
        <div className={cn(row.original.percent >= 0 ? 'bg-stock-up' : 'bg-stock-down', 'h-full rounded-sm w-16 text-center px-1 py-0.5 float-right')}>
          {row.getValue<number>('percent') > 0 ? '+' : null}{`${numToFixed(row.getValue<number>('percent') * 100, 2)}%`}
        </div>
      )
    },
    {
      header: '成交额', accessorKey: 'turnover', meta: { align: 'right', width: '19%'}, 
      cell: ({ row }) => <span className={cn(row.original.percent >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {priceToCnUnit(row.getValue<number>('turnover') * 10000, 2)}
      </span>
    },
    {
      header: '总市值', accessorKey: 'marketValue', meta: { align: 'right', width: '19%'}, 
      cell: ({ row }) => <span className={cn(row.original.percent >= 0? 'text-stock-up' : 'text-stock-down')}>
        {priceToCnUnit(row.getValue<number>('marketValue'), 2)}
      </span>
    },
  ]

  return (
    <div className="w-full h-full">
      <div className="border-style-primary px-1 py-2">
        <CapsuleTabs activeKey={type} onChange={(v) => setType(v)}>
          {
            collects.map(c => (
              <CapsuleTabs.Tab key={c.id} value={c.id} label={
                <span>
                  {
                    c.name
                  }
                  {
                    +c.total > 0 && `(${c.total})`
                  }
                </span>
              } />
            ))
          }
        </CapsuleTabs>
      </div>
      <ScrollArea className="h-[calc(100%-38px)]">
        {
          token ? (
            <JknTable rowKey="code" data={data} columns={columns}

            />
          ) : (
            <div className="w-full text-center mt-40">
              <div className="mb-4 text-secondary">尚未登录账号</div>
              <Button onClick={onLogin}>登录账号</Button>
            </div>

          )
        }
      </ScrollArea>
    </div>
  )
}

export default GoldenStockPool