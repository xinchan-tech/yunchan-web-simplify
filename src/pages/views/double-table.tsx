import { getPlateList, getPlateStocks } from "@/api"
import { Button, Checkbox, HoverCard, HoverCardContent, HoverCardTrigger, JknTable, type JknTableProps, NumSpan, Star, StockView } from "@/components"
import { useStock } from "@/store"
import { numToFixed, priceToCnUnit } from "@/utils/price"
import { useRequest } from "ahooks"
import { useMemo, useState } from "react"
import { useImmer } from "use-immer"
import PlateStocks from "./components/plate-stocks"


const DoubleTable = () => {
  const [activePlate, setActivePlate] = useState<string>()
  const stock = useStock()
  const plate = useRequest(getPlateList, {
    cacheKey: getPlateList.cacheKey,
    onSuccess: (data) => {
      setActivePlate(data[0].id)
      plateStocks.run(data[0].id, ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials'])
    }
  })

  const plateStocks = useRequest(getPlateStocks, {
    manual: true
  })

  const onClickPlate = (row: PlateDataType) => {
    setActivePlate(row.id)
    plateStocks.run(row.id, ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials'])
  }

  const plateStocksData = useMemo(() => {
    const r: TableDataType[] = []

    if (!plateStocks.data) return r

    for (const { stock: _stock, name, symbol, extend } of plateStocks.data) {
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
  }, [plateStocks.data, stock])

  return (
    <div className="flex">
      <div className="w-[30%]">
        <PlateList data={plate.data ?? []} onRowClick={onClickPlate} />
      </div>
      <div className="w-[70%]">
        <PlateStocks></PlateStocks>
      </div>
    </div>
  )
}

type PlateDataType = {
  amount: number
  change: number
  hot_rise: number
  id: string
  name: string
}

interface DoubleTableProps {
  data: PlateDataType[]
  onRowClick: (row: PlateDataType) => void
}

const PlateList = (props: DoubleTableProps) => {
  const [sort, setSort] = useImmer<{ type?: string, order?: 'asc' | 'desc' }>({
    type: undefined,
    order: undefined
  })

  const data = useMemo(() => {
    if (!sort.type) return [...props.data]
    const newData = [...props.data]
    newData.sort((a, b) => {
      const aValue = a[sort.type as keyof PlateDataType]
      const bValue = b[sort.type as keyof PlateDataType]
      if (aValue > bValue) return sort.order === 'asc' ? 1 : -1
      if (aValue < bValue) return sort.order === 'asc' ? -1 : 1
      return 0
    })

    return newData

  }, [props.data, sort])

  const column = useMemo<JknTableProps<PlateDataType>['columns']>(() => [
    { header: '序号', enableSorting: false, accessorKey: 'index', meta: { align: 'center', width: 60 }, cell: ({ row }) => row.index + 1 },
    { header: '行业', enableSorting: false, accessorKey: 'name' },
    {
      header: '涨跌幅', accessorKey: 'change',
      meta: { width: 80 },
      cell: ({ row }) => <NumSpan block percent value={row.original.change} isPositive={row.original.change > 0} />
    },
    {
      header: '成交额', accessorKey: 'amount',
      meta: { align: 'right' },
      cell: ({ row }) => priceToCnUnit(row.original.amount)
    }
  ], [])
  return (
    <JknTable onRowClick={props.onRowClick} columns={column} data={data} onSortingChange={(s) => setSort(d => { d.type = s.id; d.order = s.desc ? 'desc' : 'asc' })} />
  )
}



export default DoubleTable