import { Button, CapsuleTabs, JknRcTable, JknRcTableProps, NumSpan, StockView } from "@/components"
import { useCollectCates, useToken } from "@/store"
import { appEvent } from "@/utils/event"
import { useEffect, useState } from "react"
import { getStockCollects } from "@/api"
import { type StockRecord, stockManager } from "@/utils/stock"
import { useQuery } from "@tanstack/react-query"
import Decimal from "decimal.js"
import { useImmer } from "use-immer"
import type { TableProps } from 'rc-table'

const GoldenStockPool = () => {
  const { collects } = useCollectCates()
  const [type, setType] = useState(collects[0].id)
  const { token } = useToken()
  const [list, setList] = useImmer<StockRecord[]>([])

  const query = useQuery({
    queryKey: [getStockCollects.cacheKey, type],
    refetchInterval: 5 * 1000,
    queryFn: () => getStockCollects({
      cate_id: +type,
      extend: ['total_share', 'basic_index', 'day_basic', 'alarm_ai', 'alarm_all', 'financials', 'thumbs', 'stock_after', 'stock_before'],
      limit: 300
    }),
    enabled: !!token
  })

  useEffect(() => {
    setList(query.data?.items.map(item => stockManager.toStockRecord(item)[0]!) ?? [])
  }, [query.data, setList])


  const onLogin = () => {
    appEvent.emit('login')
  }

  const onSort: JknRcTableProps<StockRecord>['onSort'] = (columnKey, order) => {
    
  }

  const columns: TableProps<StockRecord>['columns'] = [
    {
      dataIndex: 'name',
      title: '名称代码',
      key: 'name',
      align: 'left',
      render: (_, row) => (
        <StockView code={row.symbol} name={row.name} />
      )
    },
    {
      title: '现价', dataIndex: 'close', key: 'close',
      sort: true,
      onSort,
      align: 'right',
      render: (_, row) => <NumSpan blink value={row.close} decimal={3} isPositive={row.isUp} align="right" />
    },
    {
      title: '涨跌幅', dataIndex: 'percent', key: 'percent', align: 'right', 
      sort: true,
      render: (_, row) => (
        <NumSpan className="w-20 text-center" block blink value={row.percent! * 100} decimal={2} percent isPositive={row.isUp} align="right" />
      )
    },
    {
      title: '成交额', dataIndex: 'turnover', key: 'turnover', align: 'right',
      render: (_, row) => <NumSpan value={row.turnover} decimal={2} unit isPositive={row.isUp} />
    },
    {
      title: '总市值', dataIndex: 'marketValue', key: 'marketValue', align: 'right',
      render: (_, row) => <span>{Decimal.create(row.marketValue).toShortCN()}</span>
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
            <JknRcTable columns={columns} data={list} rowKey="symbol" className="w-full" />
            // <JknTable loading={query.isLoading} rowKey="symbol" data={list} columns={columns} />
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