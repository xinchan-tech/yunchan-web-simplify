import { getPlateStocks } from "@/api"
import { JknTable, type JknTableProps, NumSpan, StockView } from "@/components"
import { useStock, useTime } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { useRequest, useUpdateEffect } from "ahooks"
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
  const plateStocks = useRequest(getPlateStocks, {
    cacheKey: getPlateStocks.cacheKey,
    manual: true,
  })
  const trading = useTime(s => s.getTrading())
  const stock = useStock()

  useUpdateEffect(() => {
    if (!props.plateId) return
    plateStocks.run(props.plateId, ['alarm_ai', 'alarm_all', 'collect', 'day_basic', 'total_share', 'financials'])
  }, [props.plateId])

  const data = useMemo(() => {
    const r: PlateStockTableDataType[] = []

    if (!plateStocks.data) return r

    for (const { stock: _stock, name, symbol, extend } of plateStocks.data) {
      const lastData = stock.getLastRecordByTrading(symbol, trading === 'close' ? 'intraDay' : trading)
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

  }, [plateStocks.data, stock, trading])



  const columns = useMemo<JknTableProps<PlateStockTableDataType>['columns']>(() => [
    { header: '序号', enableSorting: false, accessorKey: 'index', meta: { align: 'center', width: 60, }, cell: ({ row }) => row.index + 1 },
    {
      header: '名称代码', accessorKey: 'name', meta: { align: 'left', },
      cell: ({ row }) => (
        <StockView name={row.getValue('name')} code={row.original.code as string} />
      )
    },
    {
      header: '现价', accessorKey: 'price', meta: { align: 'right', },
      cell: ({ row }) => (
        <NumSpan value={numToFixed(row.getValue<number>('price')) ?? 0} isPositive={row.getValue<number>('percent') >= 0} />
      )
    },
    {
      header: '涨跌幅', accessorKey: 'percent', meta: { align: 'right', },
      cell: ({ row }) => (
        <NumSpan percent block decimal={2} value={row.getValue<number>('percent') * 100} isPositive={row.getValue<number>('percent') >= 0} symbol />
      )
    },
    {
      header: '成交额', accessorKey: 'amount', meta: { align: 'right', },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('amount'))
    },
    {
      header: '总市值', accessorKey: 'total', meta: { align: 'right', },
      cell: ({ row }) => priceToCnUnit(row.getValue<number>('total'))
    },
  ], [])
  return (
    <div>
      <JknTable
        rowKey="code"
        columns={columns}
        data={data}
      // onSortingChange={(s) => setSort(d => { d.type = s.id; d.order = s.desc ? 'desc' : 'asc' })} 
      />
    </div>

  )
}

export default PlateStocks