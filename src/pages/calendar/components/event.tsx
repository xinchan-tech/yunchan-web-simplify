import { getStockEconomic } from "@/api"
import { JknIcon, JknTable, type JknTableProps } from "@/components"
import { useTime } from "@/store"
import { useQuery } from "@tanstack/react-query"
import dayjs from "dayjs"
import { useCallback, useMemo } from "react"

type TableDataType = {
  name: string
  date: string
  nextDate: string
  star: number
  before: string
  current: string
  // 预测
  predict: string
}

const StockEvent = () => {
  const time = useTime()
  const query = useQuery({
    queryKey: [getStockEconomic.cacheKey, 1],
    queryFn: () => getStockEconomic({
      limit: 50,
      page: 1,
      type: 1,
      sort: 'ASC'
    })
  })

  const data = query.data?.items.map(item => ({
    name: item.title,
    date: item.date,
    nextDate: item.next_time,
    star: item.impact,
    before: item.previous,
    current: item.actual,
    predict: item.estimate
  })) ?? []

  const getColor = useCallback((date: string) => {
    const current = dayjs(time.usTime + new Date().valueOf() - time.localStamp).tz('America/New_York')
    const usDay = dayjs(date)
    if (current.format('YYYY-MM-DD') > usDay.format('YYYY-MM-DD')) {
      return '#5e5f61'
    }

    if (current.day(6).format('YYYY-MM-DD') >= usDay.format('YYYY-MM-DD')) {
      return 'hsl(var(--primary))'
    }

    return ''
  }, [time])

  const columns: JknTableProps<TableDataType>['columns'] = useMemo(() => [
    { header: '序号', enableSorting: false, accessorKey: 'rank', cell: ({ row }) => <span style={{ color: getColor(row.original.date) }}>{row.index + 1}</span>, meta: { align: 'center', width: 60 } },
    {
      header: '名称', accessorKey: 'name', size: 240, enableSorting: false,
      cell: ({ row }) => (<span className="block py-1" style={{ color: getColor(row.original.date) }}>{row.getValue('name')}</span>)
    },
    {
      header: '前值', size: 120, enableSorting: false, accessorKey: 'before', meta: { align: 'center' },
      cell: ({ row }) => (<span style={{ color: getColor(row.original.date) }}>{row.getValue<string>('before')|| '--'}</span>)
    },
    {
      header: '现值', size: 120, enableSorting: false, accessorKey: 'current', meta: { align: 'center' },
      cell: ({ row }) => (<span style={{ color: getColor(row.original.date) }}>{row.getValue<string>('current') || '--'}</span>)
    },
    {
      header: '预测值', size: 120, enableSorting: false, accessorKey: 'predict', meta: { align: 'center' },
      cell: ({ row }) => (<span style={{ color: getColor(row.original.date) }}>{row.getValue<string>('predict') || '--'}</span>)
    },
    {
      header: '发布时间（美东）', enableSorting: false, size: 120, accessorKey: 'date', meta: { align: 'center' },
      cell: ({ row }) => (<span style={{ color: getColor(row.original.date) }}>{row.getValue<string>('date')?.slice(0, 16) || '--'}</span>)
    },
    {
      header: '下次发布时间（美东）', enableSorting: false, size: 120, accessorKey: 'nextDate', meta: { align: 'center' },
      cell: ({ row }) => (<span style={{ color: getColor(row.original.date) }}>{row.getValue<string>('nextDate')?.slice(0, 16) || '--'}</span>)
    },
    {
      header: '重要性', size: 120, enableSorting: false, accessorKey: 'star', meta: { align: 'center' },
      cell: ({ row }) => (<span style={{ color: getColor(row.original.date) }}>
        {
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          Array.from(new Array(row.getValue('star'))).map((_, i) => <JknIcon name="ic_star_on" key={i} className="w-3 h-3" />)
        }
      </span>)
    }
  ], [getColor])

  return (
    <div className="">
      <JknTable
        rowKey="id"
        columns={columns}
        data={data}
      />
    </div>
  )
}

export default StockEvent