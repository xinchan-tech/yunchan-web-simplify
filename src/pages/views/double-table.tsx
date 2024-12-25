import { getPlateList } from "@/api"
import { JknTable, type JknTableProps, NumSpan, ScrollArea } from "@/components"
import { useUpdateEffect } from "ahooks"
import { useMemo, useState } from "react"
import { useImmer } from "use-immer"
import PlateStocks from "./components/plate-stocks"
import { useQuery } from "@tanstack/react-query"
import Decimal from "decimal.js"

interface DoubleTableProps {
  type: 1 | 2
}

const DoubleTable = (props: DoubleTableProps) => {
  const [activePlate, setActivePlate] = useState<string>()

  const plate = useQuery({
    queryKey: [getPlateList.cacheKey, props.type],
    queryFn: () => getPlateList(props.type),
  })


  const onClickPlate = (row: PlateDataType) => {
    setActivePlate(row.id)
  }

  useUpdateEffect(() => {
    setActivePlate(undefined)

    if (plate.data?.[0]) {
      setActivePlate(plate.data[0].id)
    }
  }, [props.type, plate.data])

  return (
    <div className="flex overflow-hidden h-full">
      <div className="w-[25%]">
        <div className="h-full">
          <PlateList loading={plate.isLoading} data={plate.data ?? []} onRowClick={onClickPlate} />
        </div>
      </div>
      <div className="w-[75%]">
        <div className="h-full overflow-hidden">
          <PlateStocks plateId={activePlate ? +activePlate : undefined} />
        </div>
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
  loading?: boolean
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
    { header: '序号', enableSorting: false, accessorKey: 'index', meta: { align: 'center', width: 40 }, cell: ({ row }) => row.index + 1 },
    { header: '行业', enableSorting: false, accessorKey: 'name', meta: { width: 'auto' } },
    {
      header: '涨跌幅', accessorKey: 'change',
      meta: { width: 100 },
      cell: ({ row }) => <NumSpan block percent symbol value={row.original.change} isPositive={row.original.change > 0} />
    },
    {
      header: '成交额', accessorKey: 'amount',
      meta: { align: 'right', width: 100 },
      cell: ({ row }) => <span>{Decimal.create(row.original.amount).toShortCN()}</span>
    }
  ], [])
  return (
    <JknTable loading={props.loading} onRowClick={props.onRowClick} columns={column} data={data} onSortingChange={(s) => setSort(d => { d.type = s.id; d.order = s.desc ? 'desc' : 'asc' })} />
  )
}



export default DoubleTable