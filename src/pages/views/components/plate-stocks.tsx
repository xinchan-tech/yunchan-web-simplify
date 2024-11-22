import { addStockCollect, getPlateStocks } from "@/api"
import { AiAlarm, Button, Checkbox, CollectStar, JknAlert, JknIcon, JknTable, NumSpan, Popover, PopoverAnchor, PopoverContent, StockView, type JknTableProps } from "@/components"
import { useToast } from "@/hooks"
import { useCollectCates, useStock } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import to from "await-to-js"
import { useMemo } from "react"

interface PlateStocksProps {
  plateId?: number
}

export type PlateStockTableDataType = {
  code: string
  name: string
  price?: number
  // 涨跌幅
  percent?: number
  // 成交额
  amount?: number
  // 总市值
  total?: number
  // 换手率
  turnoverRate?: number
  // 市盈率
  pe?: number
  // 市净率
  pb?: number
  collect: 1 | 0
}
const PlateStocks = (props: PlateStocksProps) => {
  const plateStocks = useQuery({
    queryKey: [getPlateStocks.cacheKey, props.plateId],
    queryFn: () => getPlateStocks(+props.plateId!, ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials']),
    enabled: !!props.plateId
  })

  const stock = useStock()
  const collects = useCollectCates(s => s.collects)

  // useUpdateEffect(() => {
  //   if (!props.plateId) return
  //   plateStocks.run(props.plateId, ['alarm_ai', 'alarm_all', 'collect', 'day_basic', 'total_share', 'financials'])
  // }, [props.plateId])

  const data = (() => {
    const r: PlateStockTableDataType[] = []

    if (!plateStocks.data) return r

    for (const { stock: _stock, name, symbol, extend } of plateStocks.data) {
      const lastData = stock.getLastRecordByTrading(symbol, 'intraDay')
      r.push({
        code: symbol,
        name: name,
        price: lastData?.close,
        percent: lastData?.percent,
        total: lastData?.marketValue,
        amount: lastData?.turnover,
        turnoverRate: lastData?.turnOverRate,
        pe: lastData?.pe,
        pb: lastData?.pb,
        collect: extend.collect as 0 | 1
      })
    }

    return r

  })()

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



  const columns = useMemo<JknTableProps<PlateStockTableDataType>['columns']>(() => [
    { header: '序号', enableSorting: false, accessorKey: 'index', meta: { align: 'center', width: 60, }, cell: ({ row }) => row.index + 1 },
    {
      header: '名称代码', accessorKey: 'name', meta: { align: 'left', width: 'full' },
      cell: ({ row }) => (
        <StockView name={row.getValue('name')} code={row.original.code as string} />
      )
    },
    {
      header: '现价', accessorKey: 'price', meta: { align: 'right', width: '10%' },
      cell: ({ row }) => (
        <NumSpan value={numToFixed(row.getValue<number>('price')) ?? 0} isPositive={row.getValue<number>('percent') >= 0} />
      )
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right', width: '10%' },
      cell: ({ row }) => (
        <NumSpan percent block decimal={2} value={row.getValue<number>('percent') * 100} isPositive={row.getValue<number>('percent') >= 0} symbol />
      )
    },
    {
      header: '成交额', accessorKey: 'amount', meta: { align: 'right', width: '10%' },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('amount'))
    },
    {
      header: '总市值', accessorKey: 'total', meta: { align: 'right', width: '10%' },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('total'))
    },
    {
      header: '换手率', accessorKey: 'turnoverRate', meta: { align: 'right', width: '7%' },
      cell: ({ row }) => `${numToFixed(row.getValue<number>('turnoverRate'), 2)}%`
    },
    {
      header: '市盈率', enableSorting: false, accessorKey: 'pe', meta: { align: 'right', width: '7%' },
      cell: ({ row }) => `${numToFixed(row.getValue<number>('pe'), 2)}`
    },
    {
      header: '市净率', enableSorting: false, accessorKey: 'pb', meta: { align: 'right', width: '7%' },
      cell: ({ row }) => `${numToFixed(row.getValue<number>('pb'), 2)}`
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
      cell: ({ row }) => <AiAlarm code={row.original.code}><JknIcon name="ic_add" /></AiAlarm>
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
                        <div onClick={() => table.options.meta?.emit({ event: 'createFav', params: { id: cate.id, symbols: table.getSelectedRowModel().rows.map(item => item.original.code) } })} onKeyDown={() => { }}>
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
  ], [collects])


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
    <JknTable.Virtualizer className="h-full"
      onEvent={_onEvent}
      rowKey="code"
      columns={columns}
      data={data}
    // onSortingChange={(s) => setSort(d => { d.type = s.id; d.order = s.desc ? 'desc' : 'asc' })} 
    />

  )
}

export default PlateStocks