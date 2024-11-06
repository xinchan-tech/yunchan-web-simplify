import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button, CapsuleTabs, JknTable, JknTableProps } from "@/components"
import { useStock, useToken } from "@/store"
import { appEvent } from "@/utils/event"
import { getStockCollects } from "@/api"
import { useRequest } from "ahooks"
import { useDomSize } from "@/hooks"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { cn } from "@/utils/style"

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
  const [type, setType] = useState('golden')
  const { token } = useToken()
  const stock = useStock()
  const { t } = useTranslation()
  const [tableContainerSize, tableContainerRef] = useDomSize<HTMLDivElement>()

  const query = useRequest(getStockCollects, {
    cacheKey: 'stockCollects',
    pollingInterval: 30 * 1000,
    defaultParams: [
      {
        extend: ['total_share', 'basic_index', 'day_basic', 'alarm_ai', 'alarm_all', 'financials', 'thumbs', 'stock_after', 'stock_before'],
        limit: 300, cate_id: 1
      },
    ]
  })

  const data = useMemo(() => {
    const d: TableData[] = []
    if (!query.data) return d

    for (const { stock: _stock, name, symbol, extend } of query.data.items) {
      const lastData = stock.getLastRecord('intraDay')
      if (!lastData) continue
      d.push({
        key: symbol,
        code: symbol,
        name: name,
        price: lastData.close,
        percent: lastData.percent,
        turnover: lastData.turnover,
        marketValue: (extend?.total_share as number ?? 0) * lastData.close,
        date: lastData.time
      })
    }

    return d
  }, [stock, query.data])
  console.log(data)
  const onLogin = () => {
    appEvent.emit('login')
  }

  const columns: JknTableProps<TableData>['columns'] = [
    {
      accessorKey: 'name',
      header: '名称代码',
      cell: ({ row }) => (
        <div className="overflow-hidden w-full">
          <div className="text-secondary">{row.getValue('code')}</div>
          <div className="text-tertiary text-xs text-ellipsis overflow-hidden whitespace-nowrap w-full">{row.getValue('name')}</div>
        </div>
      )
    },
    {
      header: '现价', accessorKey: 'price', sorter: true, align: 'right', showSorterTooltip: false, width: '17%',
      cell: ({ row }) => <span className={cn(row.percent >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {numToFixed(v)}
      </span>
    },
    {
      header: '涨跌幅', accessorKey: 'percent', sorter: true, align: 'right', showSorterTooltip: false, width: '22%',
      cell: ({ row }) => (
        <div className={cn(v >= 0 ? 'bg-stock-up' : 'bg-stock-down', 'h-full rounded-sm w-16 text-center px-1 py-0.5 float-right')}>
          {v > 0 ? '+' : null}{`${numToFixed(v * 100, 2)}%`}
        </div>
      )
    },
    {
      header: '成交额', accessorKey: 'turnover', sorter: true, align: 'right', showSorterTooltip: false, width: '17%',
      cell: ({ row }) => <span className={cn(row.percent >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {priceToCnUnit(v * 10000, 2)}
      </span>
    },
    {
      header: '总市值', accessorKey: 'marketValue', sorter: true, align: 'right', showSorterTooltip: false, width: '19%',
      cell: ({ row }) => <span className={cn(row.percent >= 0 ? 'text-stock-up' : 'text-stock-down')}>
        {priceToCnUnit(v, 2)}
      </span>
    },
  ]

  return (
    <div className="w-full h-full">
      <div className="border-style-primary px-1 py-2">
        <CapsuleTabs activeKey={type} onChange={(v) => setType(v)}>
          <CapsuleTabs.Tab value="golden" label={
            <span>
              {
                t('goldenStockPool')
              }
              {
                data.length > 0 && `(${data.length})`
              }
            </span>
          }>
          </CapsuleTabs.Tab>
        </CapsuleTabs>
      </div>
      <div className="h-[calc(100%-38px)]" ref={tableContainerRef}>
        {
          token ? (
            <JknTable data={data} columns={columns} 
            
            />
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