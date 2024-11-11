import { type StockExtend, addStockCollect, getIndexGapAmplitude, getIndexRecommends, getUsStocks } from "@/api"
import { Button, Checkbox, CollectStar, JknAlert, JknIcon, JknTable, type JknTableProps, NumSpan, Popover, PopoverAnchor, PopoverContent, ScrollArea, StockView } from "@/components"
import { useToast } from "@/hooks"
import { useCollectCates, useStock } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { useRequest } from "ahooks"
import to from "await-to-js"
import { useMemo } from "react"

interface SingleTableProps {
  type?: string
}

type TableDataType = {
  code: string
  name: string
  price: number
  // 涨跌幅
  percent: number
  // 成交额
  amount: number
  // 总市值
  total: number
  // 所属行业
  industry: string
  // 盘前涨跌幅
  prePercent: number
  // 盘后涨跌幅
  afterPercent: number
  // 换手率
  turnoverRate: number
  // 市盈率
  pe: number
  // 市净率
  pb: number
  collect: 1 | 0
}
//单表格
const SingleTable = (props: SingleTableProps) => {
  const QueryFn = () => {
    const extend: StockExtend[] = ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials']
    if (!props.type || ['all', 'ixic', 'spx', 'dji', 'etf', 'china'].includes(props.type)) {
      return getUsStocks({ type: props.type === 'all' ? undefined : props.type, column: 'total_mv', limit: 50, page: 1, order: 'desc', extend }).then(r => r.items)
    }

    if (['yesterday_bear', 'yesterday_bull', 'short_amp_up', 'short_amp_d', 'release'].includes(props.type)) {
      return getIndexRecommends(props.type, extend)
    }

    if (props.type === 'gap') {
      return getIndexGapAmplitude(extend)
    }

    return getUsStocks({ type: props.type, column: 'total_mv', limit: 50, page: 1, order: 'desc', extend }).then(r => r.items)
  }

  const query = useRequest(QueryFn, {
    refreshDeps: [props.type]
  })

  const stock = useStock()

  const data = useMemo(() => {
    const r: TableDataType[] = []

    if (!query.data) return []

    for (const { stock: _stock, name, symbol, extend } of query.data) {
      const lastData = stock.getLastRecordByTrading(symbol, 'intraDay')
      const beforeData = stock.getLastRecordByTrading(symbol, 'preMarket')
      const afterData = stock.getLastRecordByTrading(symbol, 'afterHours')

      if (!lastData) continue
      r.push({
        code: symbol,
        name: name,
        price: lastData.close,
        percent: lastData.percent,
        total: lastData.marketValue,
        amount: lastData.turnover,
        industry: lastData.industry,
        prePercent: (beforeData?.percent ?? 0) * 100,
        afterPercent: (afterData?.percent ?? 0) * 100,
        turnoverRate: lastData.turnOverRate * 100,
        pe: lastData.pe,
        pb: lastData.pb,
        collect: extend.collect
      })
    }

    return r

  }, [query.data, stock])

  const onSortChange: JknTableProps<TableDataType>['onSortingChange'] = (e) => {
    // const columnMap: Record<string, string> = {
    //   code: 'symbol',
    //   price: 'close',
    //   amount: 'amount',
    //   percent: "increase",
    //   total: "total_mv",
    //   prePercent: "stock_before",
    //   afterPercent: "stock_after",
    //   turnoverRate: "turnover_rate",
    // }
    // Object.assign(query.params[0] ?? {}, { column: columnMap[e.id as string] ?? 'total_mv', order: e.desc === undefined ? 'desc' : e.desc ? 'desc' : 'asc' })
    // query.refresh()
  }




  const columns: JknTableProps<TableDataType>['columns'] = useMemo(() => ([
    { header: '序号', enableSorting: false, accessorKey: 'index', meta: { align: 'center', width: 60, }, cell: ({ row }) => row.index + 1 },
    {
      header: '名称代码', accessorKey: 'name', meta: { align: 'left', width: 120 },
      cell: ({ row }) => (
        <StockView name={row.getValue('name')} code={row.original.code as string} />
      )
    },
    {
      header: '现价', accessorKey: 'price', meta: { align: 'right', width: 120 },
      cell: ({ row }) => (
        <NumSpan value={numToFixed(row.getValue<number>('price')) ?? 0} isPositive={row.getValue<number>('percent') >= 0} />
      )
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right', width: 120 },
      cell: ({ row }) => (
        <NumSpan percent block decimal={2} value={row.getValue<number>('percent') * 100} isPositive={row.getValue<number>('percent') >= 0} symbol />
      )
    },
    {
      header: '成交额', accessorKey: 'amount', meta: { align: 'right', width: 120 },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('amount'))
    },
    {
      header: '总市值', accessorKey: 'total', meta: { align: 'right', width: 120 },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('total'))
    },
    {
      header: '所属行业', enableSorting: false, accessorKey: 'industry', meta: { width: 120, align: 'right' }
    },
    {
      header: '盘前涨跌幅', accessorKey: 'prePercent', meta: { width: '15%', align: 'right' },
      cell: ({ row }) => (
        <NumSpan symbol decimal={2} percent value={row.getValue<number>('prePercent')} isPositive={row.getValue<number>('prePercent') >= 0} />
      )
    },
    {
      header: '盘后涨跌幅', accessorKey: 'afterPercent', meta: { width: '15%', align: 'right' },
      cell: ({ row }) => (
        <NumSpan symbol decimal={2} percent value={row.getValue<number>('afterPercent')} isPositive={row.getValue<number>('afterPercent') >= 0} />
      )
    },
    {
      header: '换手率', accessorKey: 'turnoverRate', meta: { width: '15%', align: 'right' },
      cell: ({ row }) => `${numToFixed(row.getValue<number>('turnoverRate'), 2)}%`
    },
    {
      header: '市盈率', enableSorting: false, accessorKey: 'pe', meta: { width: '15%', align: 'right' },
      cell: ({ row }) => `${numToFixed(row.getValue<number>('pe'), 2) ?? '-'}`
    },
    {
      header: '市净率', enableSorting: false, accessorKey: 'pb', meta: { width: '15%', align: 'right' },
      cell: ({ row }) => `${numToFixed(row.getValue<number>('pb'), 2) ?? '-'}`
    },
    {
      header: '+股票金池', enableSorting: false, accessorKey: 'collect', meta: { width: 60, align: 'center' },
      cell: ({ row }) => (
        <div>
          <CollectStar
            onUpdate={checked => query.mutate(s => {
              const r = s?.find(item => item.symbol === row.original.code)
              if (r) {
                r.extend.collect = checked ? 1 : 0
              }
              return s ? [...s] : undefined
            })}
            checked={row.getValue<boolean>('collect')}
            code={row.original.code} />
        </div>
      )
    },
    {
      header: '+AI报警', enableSorting: false, accessorKey: 't9', meta: { width: 50, align: 'center' },
      cell: ({ row }) => <div><JknIcon name="ic_add" /></div>
    },
    {
      header: ({ table }) => (
        <div>
          <Popover open={table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()}>
            <PopoverAnchor asChild>
              <Checkbox
                checked={table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()}
                onCheckedChange={e => table.getToggleAllRowsSelectedHandler()({ target: e })}
              />
            </PopoverAnchor>
            <PopoverContent className="w-60" align="start" side="left">
              <div className="rounded">
                <div className="bg-background px-16 py-2">批量操作 {table.getSelectedRowModel().rows.length} 项</div>
                <div className="text-center px-12 py-4 space-y-4">
                  {
                    collects.map((cate) => (
                      <div key={cate.id} className="flex space-x-2 items-center">
                        <div>{cate.name}</div>
                        <div onClick={() => onCreateStockToCollects(cate.id, table.getSelectedRowModel().rows.map(item => item.original.code))} onKeyDown={() => { }}>
                          <Button className="text-tertiary" size="mini" variant="outline">添加</Button>
                        </div>
                      </div>
                    ))
                  }
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      ),
      accessorKey: 'check',
      id: 'select',
      enableSorting: false,
      meta: { align: 'center', width: 60 },
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(e) => row.getToggleSelectedHandler()({ target: e })} />
      )
    }
  ]), [query.mutate])

  const collects = useCollectCates(s => s.collects)
  const { toast } = useToast()
  const onCreateStockToCollects = (cateId: string, stockIds: string[]) => {
    JknAlert.confirm({
      content: `确定添加到 ${collects.find(c => c.id === cateId)?.name}？`,
      onAction: async (action) => {
        if (action !== 'confirm') return

        const [err] = await to(addStockCollect({ symbols: stockIds, cate_ids: [+cateId] }))

        if (err) {
          toast({ description: err.message })
          return false
        }

        query.refresh()
      }
    })
  }


  return (
    <ScrollArea className="h-[calc(100%-32px)]">
      <JknTable onSortingChange={onSortChange} columns={columns} data={data}>
      </JknTable>
    </ScrollArea>
  )
}

export default SingleTable