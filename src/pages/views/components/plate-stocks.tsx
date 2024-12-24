import { addStockCollect, getPlateStocks } from "@/api"
import { AiAlarm, Button, Checkbox, CollectStar, JknAlert, JknIcon, JknTable, NumSpan, Popover, PopoverAnchor, PopoverContent, StockView, type JknTableProps } from "@/components"
import { useToast } from "@/hooks"
import { useCollectCates } from "@/store"
import { stockManager, type StockRecord } from "@/utils/stock"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import to from "await-to-js"
import Decimal from "decimal.js"
import { useMemo } from "react"

interface PlateStocksProps {
  plateId?: number
}

const PlateStocks = (props: PlateStocksProps) => {
  const plateStocks = useQuery({
    queryKey: [getPlateStocks.cacheKey, props.plateId],
    queryFn: () => getPlateStocks(+props.plateId!, ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials']),
    enabled: !!props.plateId
  })


  const collects = useCollectCates(s => s.collects)

  const data = useMemo(() => plateStocks.data?.map(item => stockManager.toStockRecord(item)[0]) ?? [], [plateStocks.data])

  const { toast } = useToast()

  const queryClient = useQueryClient()
  const updateCollectMutation = useMutation<void, void, { code: string, checked: boolean }>({
    mutationFn: () => Promise.resolve(),
    onMutate: async (f) => {
      queryClient.setQueryData([getPlateStocks.cacheKey, props.plateId], (s: typeof plateStocks.data) => {
        const v = s?.find(item => item.symbol === f.code)
        if (v) {
          v.extend.collect = f.checked ? 1 : 0
        }

        return s ? [...s] : undefined
      })
    }

  })


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

        plateStocks.refetch()
      }
    })
  }



  const columns = useMemo<JknTableProps<StockRecord>['columns']>(() => [
    { header: '序号', enableSorting: false, accessorKey: 'index', meta: { align: 'center', width: 60, }, cell: ({ row }) => row.index + 1 },
    {
      header: '名称代码', accessorKey: 'name', meta: { align: 'left', width: 'full' },
      cell: ({ row }) => (
        <StockView name={row.getValue('name')} code={row.original.code as string} />
      )
    },
    {
      header: '现价', accessorKey: 'close', meta: { align: 'right', width: '10%' },
      cell: ({ row }) => (
        <NumSpan value={row.getValue<number>('close')} decimal={3} isPositive={row.original.isUp} />
      )
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right', width: 100 },
      cell: ({ row }) => (
        <NumSpan percent block decimal={2} value={row.getValue<number>('percent') * 100} isPositive={row.original.isUp} symbol />
      )
    },
    {
      header: '总市值', accessorKey: 'marketValue', meta: { align: 'right', width: '10%' },
      cell: ({ row }) => Decimal.create(row.original.marketValue).toShortCN()
    },
    {
      header: '成交额', accessorKey: 'turnover', meta: { align: 'right', width: '10%' },
      cell: ({ row }) => Decimal.create(row.original.turnover).toShortCN()
    },
    {
      header: '换手率', accessorKey: 'turnOverRate', meta: { align: 'right', width: '7%' },
      cell: ({ row }) => `${Decimal.create(row.original.turnOverRate).mul(100).toFixed(2)}%`
    },
    {
      header: '市盈率', enableSorting: false, accessorKey: 'pe', meta: { align: 'right', width: '7%' },
      cell: ({ row }) => Decimal.create(row.getValue<number>('pe')).toFixed(2)
    },
    {
      header: '市净率', enableSorting: false, accessorKey: 'pb', meta: { align: 'right', width: '7%' },
      cell: ({ row }) => Decimal.create(row.getValue<number>('pb')).toFixed(2)
    },
    {
      header: '+股票金池', enableSorting: false, accessorKey: 'collect', meta: { width: 80, align: 'center' },
      cell: ({ row, table }) => (
        <div>
          <CollectStar
            onUpdate={checked => table.options.meta?.emit({ event: 'updateFav', params: { code: row.original.code, checked } })}
            checked={row.getValue<boolean>('collect')}
            code={row.original.code} />
        </div>
      )
    },
    {
      header: '+AI报警', enableSorting: false, accessorKey: 't9', meta: { width: 80, align: 'center' },
      cell: ({ row }) => <AiAlarm code={row.original.code}><JknIcon className="rounded-none" name="ic_add" /></AiAlarm>
    },
    {
      header: ({ table }) => (
        <div>
          <CollectStar.Batch
            checked={table.getSelectedRowModel().rows.map(item => item.original.symbol)}
            onCheckChange={e => table.getToggleAllRowsSelectedHandler()({ target: e })}
            onUpdate={checked => table.options.meta?.emit({ event: 'collect', params: { symbols: table.getSelectedRowModel().rows.map(o => o.id), checked } })}
          />
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
  ], [])


  const _onEvent: JknTableProps['onEvent'] = ({ event, params }) => {
    console.log(event)
    if (event === 'createFav') {
      onCreateStockToCollects(params.id, params.symbols)
      return
    }
    if (event === 'updateFav') {
      updateCollectMutation.mutate({ code: params.code, checked: params.checked })
    }
  }

  return (
    <JknTable.Virtualizer loading={plateStocks.isLoading} className="h-full"
      onEvent={_onEvent}
      rowKey="symbol"
      columns={columns}
      data={data}
    />
  )
}

export default PlateStocks