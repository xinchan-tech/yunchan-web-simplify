import { getUsStocks, type UsStockType } from "@/api"
import { type JknTableProps, StockView, NumSpan, JknTable, Checkbox, Popover, PopoverContent, PopoverTrigger, JknIcon, Star, PopoverAnchor } from "@/components"
import { useTableSelection } from "@/hooks"
import { useStock } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { useRequest } from "ahooks"
import { useMemo, useRef } from "react"

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

  const { check, onCheck, onCheckAll } = useTableSelection({
    hasAll: () => true,
    selectAll: () => []
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

  const onCollectChange = (action: 'add' | 'remove') => {

  }

  const ah = useRef<HTMLDivElement>(null)

  const columns: JknTableProps<TableDataType>['columns'] = [
    { header: '序号', accessorKey: 'index', meta: { align: 'center', width: 60, }, cell: ({ row }) => row.index + 1 },
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
      header: '所属行业', accessorKey: 'industry', meta: { width: 120, align: 'right' }
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
      header: '市盈率', accessorKey: 'pe', meta: { width: '15%', align: 'right' },
      cell: ({ row }) => `${numToFixed(row.getValue<number>('pe'), 2)}`
    },
    {
      header: '市净率', accessorKey: 'pb', meta: { width: '15%', align: 'right' },
      cell: ({ row }) => `${numToFixed(row.getValue<number>('pb'), 2)}`
    },
    {
      header: '+股票金池', accessorKey: 'collect', meta: { width: '15%', align: 'center' },
      cell: ({ row }) => <Star checked={row.getValue('collect') === 1} />
    },
    {
      header: '+AI报警', accessorKey: 't9', meta: { width: '15%', align: 'right' }
    },
    {
      header: () => <span ref={ah}><Checkbox checked={check.all} onCheckedChange={onCheckAll} /></span>,
      accessorKey: 'check',
      meta: { align: 'center', width: 60 },
      cell: ({ row }) => (
        <Checkbox checked={check.selected.includes(row.original.code)} onCheckedChange={() => onCheck(row.original.code)} />
      )
    }
  ]
  return (
    <>
     <Popover open={check.selected.length > 0}>
        <PopoverContent align="start" side="left" >
          <div className="rounded">
            <div className="bg-background px-16 py-2">批量操作 {check.selected.length} 项</div>
            <div className="text-center px-4 py-4">
              &emsp;
              <span
                className="inline-block rounded-sm border-style-secondary text-tertiary cursor-pointer px-1"
                onClick={() => { }} onKeyDown={() => { }}
              >删除</span>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <JknTable columns={columns} data={data}>

      </JknTable>
     
    </>
  )
}

export default SingleTable