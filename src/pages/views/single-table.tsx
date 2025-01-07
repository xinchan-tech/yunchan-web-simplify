import { type StockExtend, type UsStockColumn, getChineseStocks, getIndexGapAmplitude, getIndexRecommends, getUsStocks } from "@/api"
import { AiAlarm, CollectStar, JknCheckbox, JknIcon, JknTable, type JknTableProps, NumSpan, StockView } from "@/components"
import { stockUtils } from "@/utils/stock"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import Decimal from "decimal.js"
import { produce } from "immer"
import { useMemo } from "react"
import { useImmer } from "use-immer"

interface SingleTableProps {
  type?: string
}

type TableDataType = {
  symbol: string
  name: string
  price?: number
  // 涨跌幅
  percent?: number
  // 成交额
  amount?: number
  // 总市值
  total?: number
  // 所属行业
  industry?: string
  // 盘前涨跌幅
  prePercent?: number
  // 盘后涨跌幅
  afterPercent?: number
  // 换手率
  turnoverRate?: number
  // 市盈率
  pe?: number
  // 市净率
  pb?: number
  collect: 1 | 0
  isUp: boolean
}
//单表格
const SingleTable = (props: SingleTableProps) => {
  const [sort, setSort] = useImmer<{ column: UsStockColumn, order: 'asc' | 'desc' }>({ column: 'total_mv', order: 'desc' })
  const QueryFn = () => {
    const extend: StockExtend[] = ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials']
    if (!props.type || ['all', 'ixic', 'spx', 'dji', 'etf'].includes(props.type)) {
      return getUsStocks({ type: props.type === 'all' ? undefined : props.type, column: sort.column, limit: 50, page: 1, order: sort.order, extend }).then(r => r.items)
    }

    if (['china'].includes(props.type)) {
      return getChineseStocks(extend)
    }

    if (['yesterday_bear', 'yesterday_bull', 'short_amp_up', 'short_amp_d', 'release'].includes(props.type)) {
      return getIndexRecommends(props.type, extend)
    }

    if (props.type === 'gap') {
      return getIndexGapAmplitude(extend)
    }

    return getUsStocks({ type: props.type, column: 'total_mv', limit: 50, page: 1, order: 'desc', extend }).then(r => r.items)
  }

  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['stock-table-view', props.type, sort],
    queryFn: () => QueryFn()
  })

  const data = useMemo(() => {
    const r: TableDataType[] = []

    if (!query.data) return []

    for (const item of query.data) {
      const [lastData, beforeData, afterData] = stockUtils.toStockRecord(item)

      if (!lastData) continue
      r.push({
        symbol: item.symbol,
        name: item.name,
        price: lastData.close,
        percent: lastData.percent,
        total: lastData.marketValue,
        amount: lastData.turnover,
        industry: lastData.industry,
        prePercent: (beforeData?.percent ?? 0) * 100,
        afterPercent: (afterData?.percent ?? 0) * 100,
        turnoverRate: lastData.turnOverRate ? (lastData.turnOverRate) : undefined,
        pe: lastData.pe,
        pb: lastData.pb,
        collect: lastData.collect ?? 0,
        isUp: lastData.isUp
      })
    }

    return r

  }, [query.data])

  const onSortChange: JknTableProps<TableDataType>['onSortingChange'] = (e) => {
    const columnMap: Record<string, UsStockColumn> = {
      code: 'symbol',
      price: 'close',
      amount: 'amount',
      percent: "increase",
      total: "total_mv",
      prePercent: "stock_before",
      afterPercent: "stock_after",
      turnoverRate: "turnover_rate",
    }
    setSort(d => {
      d.column = columnMap[e.id as string] ?? 'total_mv'
      d.order = e.desc === undefined ? 'desc' : e.desc ? 'desc' : 'asc'
    })
  }

  const columns: JknTableProps<TableDataType>['columns'] = useMemo(() => ([
    { header: '序号', enableSorting: false, accessorKey: 'index', meta: { align: 'center', width: 50, }, cell: ({ row }) => row.index + 1 },
    {
      header: '名称代码', accessorKey: 'name', meta: { align: 'left' },
      cell: ({ row }) => (
        <StockView name={row.getValue('name')} code={row.original.symbol as string} />
      )
    },
    {
      header: '现价', accessorKey: 'price', meta: { align: 'right', width: '8%' },
      cell: ({ row }) => (
        <NumSpan value={row.getValue<number>('price')} decimal={2} isPositive={row.original.isUp} />
      )
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right', width: 120 },
      cell: ({ row }) => (
        <div className="inline-block">
          <NumSpan block className="py-0.5 w-20" decimal={2} value={`${row.getValue<number>('percent') * 100}`} percent isPositive={row.getValue<number>('percent') >= 0} symbol />
        </div>
      )
    },
    {
      header: '成交额', accessorKey: 'amount', size: 20, meta: { align: 'right', width: '8%' },
      cell: ({ row }) => Decimal.create(row.getValue<number>('amount')).toDecimalPlaces(2).toShortCN()
    },
    {
      header: '总市值', accessorKey: 'total', meta: { align: 'right', width: '8%' },
      cell: ({ row }) => Decimal.create(row.getValue<number>('total')).toDecimalPlaces(2).toShortCN()
    },
    {
      header: '所属行业', enableSorting: false, accessorKey: 'industry', meta: { width: '8%', align: 'right' }
    },
    {
      header: '盘前涨跌幅', accessorKey: 'prePercent', meta: { width: '8%', align: 'right' },
      cell: ({ row }) => (
        <NumSpan symbol decimal={2} percent value={row.getValue<number>('prePercent')} isPositive={row.original.isUp} />
      )
    },
    {
      header: '盘后涨跌幅', accessorKey: 'afterPercent', meta: { width: '8%', align: 'right' },
      cell: ({ row }) => (
        <NumSpan symbol decimal={2} percent value={row.getValue<number>('afterPercent')} isPositive={row.original.isUp} />
      )
    },
    {
      header: '换手率', accessorKey: 'turnoverRate', meta: { width: '8%', align: 'right' },
      cell: ({ row }) => `${Decimal.create(row.getValue<number>('turnoverRate')).toFixed(2)}%`
    },
    {
      header: '市盈率', enableSorting: false, accessorKey: 'pe', meta: { width: '8%', align: 'right' },
      cell: ({ row }) => `${Decimal.create(row.getValue<number>('pe')).toFixed(2)}`
    },
    {
      header: '市净率', enableSorting: false, accessorKey: 'pb', meta: { width: '8%', align: 'right' },
      cell: ({ row }) => `${Decimal.create(row.getValue<number>('pb')).toFixed(2)}`
    },
    {
      header: '+股票金池', enableSorting: false, accessorKey: 'collect', meta: { width: 80, align: 'center' },
      cell: ({ row, table }) => (
        <div>
          <CollectStar
            onUpdate={(checked) => table.options.meta?.emit({ event: 'collect', params: { symbols: [row.original.symbol], checked } })}
            checked={row.getValue<boolean>('collect')}
            code={row.original.symbol} />
        </div>
      )
    },
    {
      header: '+AI报警', enableSorting: false, accessorKey: 't9', meta: { width: 80, align: 'center' },
      cell: ({ row }) => <AiAlarm code={row.original.symbol}><JknIcon className="rounded-none" name="ic_add" /></AiAlarm>
    },
    {
      header: ({ table }) => (
        <CollectStar.Batch
          checked={table.getSelectedRowModel().rows.map(item => item.original.symbol)}
          onCheckChange={e => table.getToggleAllRowsSelectedHandler()({ target: e })}
          onUpdate={checked => table.options.meta?.emit({ event: 'collect', params: { symbols: table.getSelectedRowModel().rows.map(o => o.id), checked } })}
        />
      ),
      accessorKey: 'check',
      id: 'select',
      enableSorting: false,
      meta: { align: 'center', width: 60 },
      cell: ({ row }) => (
        <div className="w-full flex justify-center">
          <JknCheckbox className="w-5 h-5" checked={row.getIsSelected()} onCheckedChange={(e) => row.getToggleSelectedHandler()({ target: e })} />
          {/* <Checkbox checked={row.getIsSelected()} onCheckedChange={(e) => row.getToggleSelectedHandler()({ target: e })} /> */}
        </div>
      )
    }
  ]), [])


  const onTableEvent: JknTableProps['onEvent'] = ({ event, params }) => {
    const { symbols = [], checked } = params
    if (event === 'collect') {
      queryClient.setQueryData(['stock-table-view', props.type, sort], (data: TableDataType[]) => {
        return data.map(produce(draft => {
          if (symbols.includes(draft.symbol)) {

            draft.extend.collect = checked ? 1 : 0
          }
        }))
      })
    }
  }
  return (
    <JknTable.Virtualizer rowHeight={35.5} onEvent={onTableEvent} loading={query.isLoading} manualSorting rowKey="symbol" onSortingChange={onSortChange} columns={columns} data={data}>
    </JknTable.Virtualizer>
  )
}

export default SingleTable