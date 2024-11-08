import { UsStockColumn, type UsStockType, addStockCollect, getStockCollectCates, getUsStocks } from "@/api"
import { Button, Checkbox, HoverCard, HoverCardContent, HoverCardTrigger, JknAlert, JknIcon, JknTable, type JknTableProps, NumSpan, Popover, PopoverAnchor, PopoverContent, PopoverTrigger, Star, StockView } from "@/components"
import { useTableSelection, useToast } from "@/hooks"
import { useCollectCates, useStock } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { useRequest } from "ahooks"
import to from "await-to-js"
import { useMemo } from "react"

interface SingleTableProps {
  type?: UsStockType
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
  const query = useRequest(getUsStocks, {
    defaultParams: [
      { type: props.type, column: 'total_mv', limit: 50, page: 1, order: 'desc', extend: ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials'] }
    ]
  })
  const stock = useStock()

  const { check, onCheck, onCheckAll, cleanAll } = useTableSelection({
    hasAll: () => true,
    selectAll: () => data.map(i => i.code)
  })

  const cateQuery = useRequest(getStockCollectCates, {
    cacheKey: getStockCollectCates.cacheKey,
    manual: true
  })

  const data = useMemo(() => {
    const r: TableDataType[] = []

    if (!query.data) return []

    for (const { stock: _stock, name, symbol, extend } of query.data.items) {
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
    const columnMap: Record<string, string> = {
      code: 'symbol',
      price: 'close',
      amount: 'amount',
      percent: "increase",
      total: "total_mv",
      prePercent: "stock_before",
      afterPercent: "stock_after",
      turnoverRate: "turnover_rate",
    }
    Object.assign(query.params[0] ?? {}, { column: columnMap[e.id as string] ?? 'total_mv', order: e.desc === undefined ? 'desc' : e.desc ? 'desc' : 'asc' })
    query.refresh()
    cleanAll()
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
        <NumSpan value={numToFixed(row.getValue<number>('price'))} isPositive={row.getValue<number>('percent') >= 0} />
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
      cell: ({ row }) => `${numToFixed(row.getValue<number>('pe'), 2)}`
    },
    {
      header: '市净率', enableSorting: false, accessorKey: 'pb', meta: { width: '15%', align: 'right' },
      cell: ({ row }) => `${numToFixed(row.getValue<number>('pb'), 2)}`
    },
    {
      header: '+股票金池', enableSorting: false, accessorKey: 'collect', meta: { width: '15%', align: 'center' },
      cell: ({ row }) => (
        <HoverCard
          onOpenChange={open => open && cateQuery.run(row.original.code)}
          openDelay={100}
        >
          <HoverCardTrigger asChild>
            <div><Star checked={row.getValue('collect') === 1} /></div>
          </HoverCardTrigger>
          <HoverCardContent align="center" side="left" sideOffset={-10}
            className="p-0 w-32"
          >
            <div className="bg-background py-2">加入金池</div>
            <div className="min-h-32 space-y-2">
              {
                collects.map(item => (
                  <div key={item.id} className="flex cursor-pointer items-center justify-center space-x-4 hover:bg-primary py-1">
                    <Checkbox />
                    <span>{item.name}</span>
                  </div>
                ))
              }
            </div>
            <div>
              <Button block className="rounded-none">确认</Button>
            </div>
          </HoverCardContent>
        </HoverCard>
      )
    },
    {
      header: '+AI报警', enableSorting: false, accessorKey: 't9', meta: { width: '15%', align: 'right' }
    },
    {
      header: () => <Checkbox checked={check.all} onCheckedChange={onCheckAll} />,
      accessorKey: 'check',
      enableSorting: false,
      meta: { align: 'center', width: 60 },
      cell: ({ row }) => (
        <Checkbox checked={check.selected.includes(row.original.code)} onCheckedChange={() => onCheck(row.original.code)} />
      )
    }
  ]), [check.all, check.selected])

  const collects = useCollectCates(s => s.collects)
  const { toast } = useToast()
  const onCreateStockToCollects = (cateId: string) => {
    JknAlert.confirm({
      content: `确定添加到 ${collects.find(c => c.id === cateId)?.name}？`,
      onAction: async (action) => {
        if (action !== 'confirm') return

        const [err] = await to(addStockCollect({ symbols: check.selected, cate_ids: [+cateId] }))

        if (err) {
          toast({ description: err.message })
          return false
        }

        query.refresh()
      }
    })
  }


  return (
    <>
      <div className="text-right flex w-full justify-end">
        <Popover open={check.selected.length > 0}>
          <PopoverAnchor />
          <PopoverContent align="start" side="left" sideOffset={70}>
            <div className="rounded">
              <div className="bg-background px-16 py-2">批量操作 {check.selected.length} 项</div>
              {
                collects.length > 0 && (
                  <div className="flex flex-col space-y-4 px-12 py-4 ">
                    {
                      collects.map((cate) => (
                        <div key={cate.id} className="flex space-x-2 items-center">
                          <div>{cate.name}</div>
                          <div onClick={() => onCreateStockToCollects(cate.id)} onKeyDown={() => { }}>
                            <Button className="text-tertiary" size="mini" variant="outline">添加</Button>
                          </div>
                        </div>
                      ))
                    }
                  </div>
                )
              }
            </div>
          </PopoverContent>
        </Popover>
      </div>
      <JknTable onSortingChange={onSortChange} columns={columns} data={data}>

      </JknTable>

    </>
  )
}

export default SingleTable