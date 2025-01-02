import { Button, CapsuleTabs, JknTable, type JknTableProps, NumSpan, StockView } from "@/components"
import { useCollectCates, useToken } from "@/store"
import { appEvent } from "@/utils/event"
import { useMemo, useState } from "react"

import { getStockCollects } from "@/api"
import { type StockRecord, stockManager } from "@/utils/stock"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Decimal from "decimal.js"
import { useStockQuoteSubscribe } from "@/hooks"

const GoldenStockPool = () => {
  const { collects } = useCollectCates()
  const [type, setType] = useState(collects[0].id)
  const { token } = useToken()
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: [getStockCollects.cacheKey, type],
    refetchInterval: 30 * 1000,
    queryFn: () => getStockCollects({
      cate_id: +type,
      extend: ['total_share', 'basic_index', 'day_basic', 'alarm_ai', 'alarm_all', 'financials', 'thumbs', 'stock_after', 'stock_before'],
      limit: 300
    }),
    enabled: !!token
  })

  const data = useMemo(() => query.data?.items.map(item => stockManager.toStockRecord(item)[0]!) ?? [], [query.data])
  const onLogin = () => {
    appEvent.emit('login')
  }

  useStockQuoteSubscribe(data.map(d => d.symbol), (data) => {
    queryClient.setQueryData([getStockCollects.cacheKey, type], (old: typeof query.data) => {
      if (!old) return old
      const items = old.items.map((item) => {
        if (item.symbol === data.topic) {
          const newStock = [...item.stock]
          newStock[0] = data.rawRecord[0]
          newStock[2] = data.rawRecord[1]
          newStock[9] = data.rawRecord[2]
          newStock[5] = data.rawRecord[3]
          newStock[6] = data.rawRecord[4]
          return {
            ...item,
            stock: newStock
          }
        }
        return item
      })

      return {
        ...old,
        items
      }
    })
  })

  const columns: JknTableProps<StockRecord>['columns'] = [
    {
      accessorKey: 'name',
      header: '名称代码',
      meta: { width: '27%' },
      cell: ({ row }) => (
        <StockView code={row.original.symbol} name={row.getValue('name')} />
      )
    },
    {
      header: '现价', accessorKey: 'close', meta: { align: 'right', width: '16%' },
      cell: ({ row }) => <NumSpan blink value={row.original.close} decimal={2} isPositive={row.original.isUp} />
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right', width: '19%' },
      cell: ({ row }) => (
        <div className="inline-block w-20">
          <NumSpan value={row.getValue<number>('percent') * 100} decimal={2} percent isPositive={row.original.isUp} block />
        </div>
      )
    },
    {
      header: '成交额', accessorKey: 'turnover', meta: { align: 'right', width: '19%' },
      cell: ({ row }) => <NumSpan value={row.original.turnover} decimal={2} unit isPositive={row.original.isUp} />
    },
    {
      header: '总市值', accessorKey: 'marketValue', meta: { align: 'right', width: '19%' },
      cell: ({ row }) => <span>{Decimal.create(row.original.marketValue).toShortCN()}</span>
    },
  ]

  return (
    <div className="w-full h-full flex flex-col overflow-hidden">
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
      <div className="flex-1 overflow-hidden">
        {
          token ? (
            <JknTable loading={query.isLoading} rowKey="symbol" data={data} columns={columns} />
          ) : (
            <div className="w-full text-center mt-40">
              <div className="mb-4 text-secondary">尚未登录账号</div>
              <Button onClick={onLogin}>登录账号</Button>
            </div>

          )
        }
      </div>
    </div>
  )
}

export default GoldenStockPool