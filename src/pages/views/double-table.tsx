import { getPlateList, getPlateStocks } from "@/api"
import { JknTable, type JknTableProps, NumSpan, ScrollArea } from "@/components"
import { priceToCnUnit } from "@/utils/price"
import { useUpdateEffect } from "ahooks"
import { useMemo, useState } from "react"
import { useImmer } from "use-immer"
import PlateStocks from "./components/plate-stocks"
import { useQuery } from "@tanstack/react-query"

interface DoubleTableProps {
  type: 1 | 2
}

const DoubleTable = (props: DoubleTableProps) => {
  const [activePlate, setActivePlate] = useState<string>()
  // getPlateList, {
  //   cacheKey: getPlateList.cacheKey,
  //   defaultParams: [props.type],
  //   onSuccess: (data) => {
  //     setActivePlate(data[0].id)
  //     plateStocks.run(+data[0].id, ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials'])
  //   }
  // }
  const plate = useQuery({
    queryKey: [getPlateList.cacheKey, props.type],
    queryFn: () => getPlateList(props.type),
  })

  useUpdateEffect(() => {
    if (plate.data?.[0]) {
      setActivePlate(plate.data[0].id)
      // plateStocks.run(+data[0].id, ['basic_index', 'stock_before', 'stock_after', 'total_share', 'collect', 'financials'])
    }
  }, [plate.isFetched])
  const onClickPlate = (row: PlateDataType) => {
    setActivePlate(row.id)
  }

  return (
    <div className="flex overflow-hidden h-full">
      <div className="w-[30%]">
        <ScrollArea className="h-full">
          <PlateList data={plate.data ?? []} onRowClick={onClickPlate} />
        </ScrollArea>
      </div>
      <div className="w-[70%]">
        <ScrollArea className="h-full">
          <PlateStocks plateId={activePlate ? +activePlate : undefined} />
        </ScrollArea>
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

interface PlateListProps {
  data: PlateDataType[]
  onRowClick: (row: PlateDataType) => void
}

const PlateList = (props: PlateListProps) => {
  const [sort, setSort] = useImmer<{ type?: string, order?: 'asc' | 'desc' }>({
    type: undefined,
    order: undefined
  })

  const data = (() => {
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

  })()

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