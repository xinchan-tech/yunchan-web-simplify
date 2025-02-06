import { getPlateList } from "@/api"
import { JknRcTable, type JknRcTableProps, NumSpan } from "@/components"
import { useCallback, useEffect, useMemo, useState } from "react"

import { useTableData } from "@/hooks"
import { useQuery } from "@tanstack/react-query"
import Decimal from "decimal.js"
import PlateStocks from "./components/plate-stocks"

interface DoubleTableProps {
  type: 1 | 2
}

const DoubleTable = (props: DoubleTableProps) => {
  const [activePlate, setActivePlate] = useState<string>()

  const plate = useQuery({
    queryKey: [getPlateList.cacheKey, props.type],
    queryFn: () => getPlateList(props.type),
  })


  const onClickPlate = useCallback((row: PlateDataType) => {
    setActivePlate(row.id)
  }, [])

  useEffect(() => {
    setActivePlate(undefined)
 
    if (plate.data?.[0]) {
      setActivePlate(plate.data[0].id)
    }
  }, [plate.data])



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
  const [list, { setList, onSort }] = useTableData(props.data, 'id')


  useEffect(() => {
    setList(props.data)
  }, [props.data, setList])

  const column = useMemo<JknRcTableProps<PlateDataType>['columns']>(() => [
    { title: '序号', dataIndex: 'index', align: 'center', width: 60, render: (_, __, index) => index + 1 },
    { title: '行业', dataIndex: 'name', align: 'left', render: (name) => <span className="text-xs inline-block leading-8 my-1">{name}</span> },
    {
      title: '涨跌幅', dataIndex: 'change', sort: true, align: 'right',
      width: 100,
      render: (_, row) => <NumSpan  block percent symbol value={row.change} isPositive={row.change > 0} align="right" />
    },
    {
      title: '成交额', dataIndex: 'amount', sort: true,
      align: 'right', width: 100,
      render: (_, row) => <span className="inline-block h-8 leading-8">{Decimal.create(row.amount).toShortCN()}</span>
    }
  ], [])
  return (
    <JknRcTable rowKey="id" isLoading={props.loading} columns={column} data={list} onSort={onSort} onRow={(record) => ({ onClick: () => props.onRowClick(record) })} />
  )
}



export default DoubleTable