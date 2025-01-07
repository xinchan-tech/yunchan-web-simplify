import { getStockFinancials } from "@/api"
import { AiAlarm, CapsuleTabs, Checkbox, CollectStar, JknDatePicker, JknIcon, JknTable, type JknTableProps, NumSpan, StockView } from "@/components"
import { dateToWeek } from "@/utils/date"
import { stockUtils } from "@/utils/stock"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Decimal from "decimal.js"
import { produce } from "immer"
import { useEffect, useMemo, useState } from "react"


type TableDataType = {
  name: string
  code: string
  date: string
  price?: number
  percent?: number
  turnover?: number
  total?: number
  industry?: string
  prePercent?: number
  afterPercent?: number
  collect?: number
  id: string
}
const StockFinancials = () => {
  const [active, setActive] = useState<string>()
  const [dates, setDates] = useState<string[]>([])

  const query = useQuery({
    queryKey: [getStockFinancials.cacheKey, active === dates[0] ? undefined : active],
    queryFn: () => getStockFinancials({
      'date[0]': active,
      'date[1]': active,
      limit: 300,
      extend: ['basic_index', 'financials', 'stock_before', 'stock_after', 'total_share', 'collect'],

    })
  })

  useEffect(() => {
    if (!active && query.data?.dates?.length) {
      setActive(query.data.dates[0])
      setDates(query.data.dates)
    }
  }, [query.data?.dates, active])



  const data = (() => {
    const r: TableDataType[] = []

    const { data } = query

    if (!data) return r
    for (const { id, time, date, ...stock } of data.items) {
      const [lastStock, beforeStock, afterStock] = stockUtils.toStockRecord(stock)

      r.push({
        name: lastStock.name,
        code: lastStock.code,
        id,
        date: `${date} ${time}`,
        price: lastStock?.close,
        percent: lastStock?.percent,
        turnover: lastStock?.turnover,
        total: lastStock?.marketValue,
        industry: lastStock?.industry,
        prePercent: beforeStock?.percent,
        afterPercent: afterStock?.percent,
        collect: lastStock?.collect,
      })
    }

    return r
  })()

  const columns: JknTableProps<TableDataType>['columns'] = useMemo(() => [
    { header: '序号', size: 60, accessorKey: 'rank', cell: ({ row }) => row.index + 1, meta: { align: 'center', width: 80 } },
    {
      header: '名称代码', accessorKey: 'name', meta: { align: 'left', width: 'full' },
      cell: ({ row }) => (
        <StockView name={row.getValue('name')} code={row.original.code as string} />
      )
    }, {
      header: '财报发布', accessorKey: 'date', meta: { align: 'right', width: '12%' },
      cell: ({ row }) => `${row.getValue('date')}`
    },
    {
      header: '现价', size: 80, accessorKey: 'price', meta: { align: 'right', width: 120 },
      cell: ({ row }) => (
        <NumSpan value={row.getValue<number>('price')} decimal={3} isPositive={row.getValue<number>('percent') >= 0} />
      )
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right', width: 90 },
      cell: ({ row }) => (
        <NumSpan percent block decimal={2} value={row.getValue<number>('percent') * 100} isPositive={row.getValue<number>('percent') >= 0} symbol />
      )
    },
    {
      header: '成交额', accessorKey: 'turnover', meta: { align: 'right', width: 120 },
      cell: ({ row }) => Decimal.create(row.getValue<number>('turnover')).toShortCN(3)
    },
    {
      header: '总市值', accessorKey: 'total', meta: { align: 'right', width: 120 },
      cell: ({ row }) => Decimal.create(row.getValue<number>('total')).toShortCN(3)
    },
    {
      header: '所属行业', enableSorting: false, accessorKey: 'industry', meta: { align: 'right', width: '16%' }
    },
    {
      header: '盘前涨跌幅', accessorKey: 'prePercent', meta: { align: 'right', width: 90 },
      cell: ({ row }) => (
        <NumSpan symbol block decimal={2} percent value={row.getValue<number>('prePercent') * 100} isPositive={row.getValue<number>('prePercent') >= 0} />
      )
    },
    {
      header: '盘后涨跌幅', accessorKey: 'afterPercent', meta: { align: 'right', width: 90 },
      cell: ({ row }) => (
        <NumSpan symbol block decimal={2} percent value={row.getValue<number>('afterPercent') * 100} isPositive={row.getValue<number>('afterPercent') >= 0} />
      )
    },
    {
      header: '+股票金池', size: 80, enableSorting: false, accessorKey: 'collect', meta: { align: 'center', width: 80 },
      cell: ({ row, table }) => (
        <div>
          <CollectStar
            onUpdate={(active) => table.options.meta?.emit({ event: 'updateCollect', params: { symbol: row.original.id, active } })}
            checked={row.getValue<boolean>('collect')}
            code={row.original.code as string} />
        </div>
      )
    },
    {
      header: '+AI报警', size: 80, enableSorting: false, accessorKey: 't9', meta: { align: 'center', width: 80 },
      cell: ({ row }) => <AiAlarm code={row.original.code as string} ><JknIcon className="rounded-none" name="ic_add" /></AiAlarm>
    },
    {
      header: ({ table }) => (
        <CollectStar.Batch
          checked={table.getSelectedRowModel().rows.map(item => item.original.code)}
          onCheckChange={e => table.getToggleAllRowsSelectedHandler()({ target: e })}
          onUpdate={(active) => table.options.meta?.emit({ event: 'updateCollectAll', params: { symbols: table.getSelectedRowModel().rows.map(item => item.original.id), active } })}
        />
      ),
      accessorKey: 'check',
      id: 'select',
      enableSorting: false,
      meta: { align: 'center', width: 60 },
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(e) => row.getToggleSelectedHandler()({ target: e })} />
      )
    }
  ], [])


  const queryClient = useQueryClient()

  const onTableEvent: JknTableProps<TableDataType>['onEvent'] = (e) => {
    if (e.event === 'updateCollect') {
      queryClient.setQueryData([getStockFinancials.cacheKey, active], (s: typeof query.data) => ({
        ...s,
        items: s?.items.map(produce(draft => {
          if (draft.id === e.params.symbol) {
            draft.extend.collect = e.params.active ? 1 : 0
          }
        }))
      }))
    } else if (e.event === 'updateCollectAll') {
      queryClient.setQueryData([getStockFinancials.cacheKey, active], (s: typeof query.data) => ({
        ...s,
        items: s?.items.map(produce(draft => {
          if (e.params.symbols.includes(draft.id)) {
            draft.extend.collect = e.params.active ? 1 : 0
          }
        }))
      }))
    }
  }


  return (
    <div className="h-full flex flex-col">
      <div className="py-1">
        <CapsuleTabs type="text" activeKey={active} onChange={setActive}>
          {
            dates.map((date) => (
              <CapsuleTabs.Tab key={date} label={`${date} ${dateToWeek(date)}`} value={date} />
            ))
          }
          <JknDatePicker onChange={(date) => date && setActive(date)}>
            {
              (date, action) =>
                <span className="inline-block w-24" onClick={action.open} onKeyDown={() => { }}>
                  <CapsuleTabs.Tab disabled label={active === date ? (date ?? '自定义') : '自定义'} value={date ?? 'manual'} />
                </span>
            }
          </JknDatePicker>
        </CapsuleTabs>
      </div>
      <div className="flex-1 overflow-hidden">
        <JknTable loading={query.isLoading} onEvent={onTableEvent} rowKey="id" columns={columns} data={data} />
      </div>
    </div>
  )
}


export default StockFinancials