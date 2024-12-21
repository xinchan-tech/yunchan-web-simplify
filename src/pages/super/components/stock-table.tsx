import { addStockCollect, type getStockSelection } from "@/api"
import { type JknTableProps, StockView, NumSpan, Checkbox, CollectStar, JknIcon, Button, JknAlert, JknTable, AiAlarm } from "@/components"
import { useToast } from "@/hooks"
import { useCollectCates } from "@/store"
import { stockManager } from "@/utils/stock"
import { Popover, PopoverAnchor, PopoverContent } from "@radix-ui/react-popover"
import to from "await-to-js"
import Decimal from "decimal.js"
import { nanoid } from "nanoid"
import { useMemo } from "react"

type TableDataType = {
  index: number
  code: string
  name: string
  stock_cycle: number
  indicator_name: string
  price?: number
  percent?: number
  bottom?: string
  total?: number
  amount?: number
  industry?: string
  prePercent: number
  afterPercent: number
  collect: 1 | 0
  key: string
}

interface StockTableProps {
  data: Awaited<ReturnType<typeof getStockSelection>>
  onUpdate?: () => void
}
const StockTable = (props: StockTableProps) => {
  const data = useMemo(() => {
    const r: TableDataType[] = []

    let index = 0
    for (const { indicator_name_hdly, indicator_name, stock_cycle, ...item} of props.data) {
      const [lastData, beforeData, afterData] = stockManager.toStockRecord(item)
      r.push({
        index: index++,
        key: nanoid(),
        code: lastData.symbol,
        name: lastData.name,
        bottom: indicator_name_hdly,
        price: lastData.close,
        percent: lastData.percent,
        total: lastData.marketValue,
        amount: lastData.turnover,
        industry: lastData.industry,
        prePercent: (beforeData?.percent ?? 0) * 100,
        afterPercent: (afterData?.percent ?? 0) * 100,
        collect: lastData.collect ?? 0,
        stock_cycle,
        indicator_name
      })
    }


    return r

  }, [props.data])

  const columns: JknTableProps<TableDataType>['columns'] = useMemo(() => ([
    { header: '序号', enableSorting: false, accessorKey: 'index', meta: { align: 'center', width: 40 }, cell: ({ row }) => row.index + 1 },
    {
      header: '名称代码', accessorKey: 'name', meta: { align: 'left', width: 120 },
      cell: ({ row }) => (
        <StockView name={row.getValue('name')} code={row.original.code as string} />
      )
    }, {
      header: '周期', accessorKey: 'stock_cycle', meta: { align: 'right', width: 40},
      cell: ({ row }) => `${row.getValue('stock_cycle')}分`
    }, {
      header: '信号类型', enableSorting: false, accessorKey: 'indicator_name', meta: { align: 'center', width: 60 },
      cell: ({ row }) => row.getValue('indicator_name')
    }, {
      header: '底部类型', accessorKey: 'bottom', meta: { align: 'center', width: 60},
      cell: ({ row }) => row.getValue('bottom') ?? '-'
    },
    {
      header: '现价', accessorKey: 'price', meta: { align: 'right', width: 80 },
      cell: ({ row }) => (
        <NumSpan value={row.getValue<number>('price')} decimal={2} isPositive={row.getValue<number>('percent') >= 0} />
      )
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right', width: 90 },
      cell: ({ row }) => (
        <NumSpan percent block decimal={2} value={row.getValue<number>('percent') * 100} isPositive={row.getValue<number>('percent') >= 0} symbol />
      )
    },
    {
      header: '成交额', accessorKey: 'amount', meta: { align: 'right', width: 100 },
      cell: ({ row }) => Decimal.create(row.getValue<number>('amount')).toShortCN(3)
    },
    {
      header: '总市值', accessorKey: 'total', meta: { align: 'right', width: 100 },
      cell: ({ row }) => Decimal.create(row.getValue<number>('total')).toShortCN(3)
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
      header: '+股票金池', enableSorting: false, accessorKey: 'collect', meta: { width: 60, align: 'center' },
      cell: ({ row }) => (
        <div>
          <CollectStar
            onUpdate={props.onUpdate}
            checked={row.getValue<boolean>('collect')}
            code={row.original.code} />
        </div>
      )
    },
    {
      header: '+AI报警', enableSorting: false, accessorKey: 't9', meta: { width: 50, align: 'center' },
      cell: ({ row }) => <AiAlarm code={row.original.code} ><JknIcon className="rounded-none" name="ic_add" /></AiAlarm>
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
      meta: { align: 'center', width: 40 },
      cell: ({ row }) => (
        <Checkbox checked={row.getIsSelected()} onCheckedChange={(e) => row.getToggleSelectedHandler()({ target: e })} />
      )
    }
  ]), [props.onUpdate])

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

        props.onUpdate?.()
      }
    })
  }


  return (
    <JknTable rowKey="key" columns={columns} data={data}>
    </JknTable>
  )
}


export default StockTable
