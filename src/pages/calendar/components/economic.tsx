import { getStockEconomic, getStockEconomicDetail } from "@/api"
import { JknIcon, JknTable, type JknTableProps, useModal } from "@/components"
import { useTime } from "@/store"
import echarts, { type ECOption } from "@/utils/echarts"
import { useQuery } from "@tanstack/react-query"
import { useMount, useUnmount } from "ahooks"
import dayjs from "dayjs"
import { useCallback, useEffect, useMemo, useRef } from "react"

type TableDataType = {
  name: string
  date: string
  nextDate: string
  star: number
  before: string
  current: string
  id: string
  key: string
  // 预测
  predict: string
}

const StockEconomic = () => {
  const time = useTime()
  const query = useQuery({
    queryKey: [getStockEconomic.cacheKey, 0],
    queryFn: () => getStockEconomic({
      limit: 50,
      page: 1,
      type: 0,
      sort: 'ASC'
    })
  })

  const data = query.data?.items.map(item => ({
    id: item.id,
    name: item.title,
    date: item.date,
    nextDate: item.next_time,
    star: item.impact,
    before: item.previous,
    key: item.key,
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
    { header: '序号', size: 40, enableSorting: false, accessorKey: 'rank', cell: ({ row }) => <span style={{ color: getColor(row.original.date) }}>{row.index + 1}</span>, meta: { align: 'center' } },
    {
      header: '名称', accessorKey: 'name', size: 240, enableSorting: false,
      cell: ({ row }) => (<span className="block py-1" style={{ color: getColor(row.original.date) }}>{row.getValue('name')}</span>)
    },
    {
      header: '前值', size: 120, enableSorting: false, accessorKey: 'before', meta: { align: 'center' },
      cell: ({ row }) => (<span style={{ color: getColor(row.original.date) }}>{row.getValue('before') ?? '--'}</span>)
    },
    {
      header: '现值', size: 120, enableSorting: false, accessorKey: 'current', meta: { align: 'center' },
      cell: ({ row }) => (<span style={{ color: getColor(row.original.date) }}>{row.getValue('current') ?? '--'}</span>)
    },
    {
      header: '预测值', size: 120, enableSorting: false, accessorKey: 'predict', meta: { align: 'center' },
      cell: ({ row }) => (<span style={{ color: getColor(row.original.date) }}>{row.getValue('predict') ?? '--'}</span>)
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
      cell: ({ row }) => (<div className="space-x-1" style={{ color: getColor(row.original.date) }}>
        {
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          Array.from(new Array(row.getValue('star'))).map((_, i) => <JknIcon name="ic_star_on" key={i} className="w-3 h-3" />)
        }
      </div>)
    },
    {
      header: '详解', size: 120, enableSorting: false, accessorKey: 'opt', meta: { align: 'center' },
      cell: ({ row }) => {
        const form = useModal({
          content: <DetailForm id={row.original.key} nextDate={row.original.nextDate.slice(0, 11) || '--'} />,
          title: '详解',
          footer: null,
          className: 'w-auto',
          onOpen: () => {
          }
        })

        return (
          <>
            <span className="cursor-pointer" onClick={() => form.modal.open()} onKeyDown={() => { }} style={{ color: getColor(row.original.date) }}>详解</span>
            {
              form.context
            }
          </>
        )
      }
    }
  ], [getColor])

  return (
    <div className="bg-background">
      <JknTable
        rowKey="id"
        columns={columns}
        data={data}
      />
    </div>
  )
}


interface DetailDialogProps {
  id: string
  nextDate: string
}

const DetailForm = ({ id, nextDate }: DetailDialogProps) => {
  const query = useQuery({
    queryKey: [getStockEconomicDetail.cacheKey, id],
    queryFn: () => getStockEconomicDetail(id),
  })

  const chartRef = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts>()

  const options: ECOption = {
    grid: {
      containLabel: true,
      left: 10,
      right: 10,
      top: 20,
      bottom: 20
    },
    legend: {
      data: [
        { name: '实际值', icon: 'rect', textStyle: { color: '#fff' } },
        { name: '预测值', icon: 'rect', textStyle: { color: '#fff' } }
      ]
    },
    axisPointer: {
      show: true
    },
    yAxis: [
      { type: 'value' },
      { type: 'value', position: 'right' }
    ],
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: {
        formatter: (value: string) => dayjs(value).format('MM-DD')
      }
    },
    series: [
      { name: '实际值', type: 'line', data: [], color: '#1e8bf1' },
      { name: '预测值', type: 'line', data: [], yAxisIndex: 1, color: '#f23b2f' }
    ]
  }

  useMount(() => {
    chart.current = echarts.init(chartRef.current)
    chart.current.setOption(options)
  })

  useUnmount(() => {
    chart.current?.dispose()
  })

  useEffect(() => {
    if (!query.data) {
      chart.current?.setOption({
        xAxis: { data: [] },
        series: [{ data: [] }, { data: [] }]
      })
      return
    }

    const d1 = []
    const d2 = []
    const category = []
    let max = 0
    let min = 0

    for (const data of query.data.list) {
      d1.push(data.actual)
      d2.push(data.estimate)
      category.push(data.date)
      if (max === 0) {
        max = Math.max(+data.actual, +data.estimate)
      }

      if (min === 0) {
        min = Math.min(+data.actual, +data.estimate)
      }

      max = Math.max(max, +data.actual, +data.estimate)
      min = Math.min(min, +data.actual, +data.estimate)

    }

    chart.current?.setOption({
      yAxis: [
        {
          max: max + 10,
          min: min - 10
        },
        {
          max: max + 10,
          min: min - 10
        }
      ],
      xAxis: { data: category },
      series: [{ data: d1 }, { data: d2 }]
    })

  }, [query.data])

  console.log(nextDate)
  return (
    <div className="w-[900px] h-[750px] box-border px-8 py-4">
      <div className="h-[340px] w-full" ref={chartRef} />
      <div className="text-stock-up">
        <div className="flex justify-between bg-background py-3 px-4 my-4" >
          <div>
            <JknIcon name="ic_message_arrow" className="rotate-180 w-2 h-3" />
            &nbsp;数据公布机构:&nbsp;
            <span className="text-foreground"> {
              query.data?.introduce.institutions
            }</span>
          </div>
          <div>
            <JknIcon name="ic_message_arrow" className="rotate-180 w-2 h-3" />
            &nbsp;发布频率:&nbsp;
            <span className="text-foreground">{
              query.data?.introduce.frequency
            }</span>
          </div>
          <div>
            <JknIcon name="ic_message_arrow" className="rotate-180 w-2 h-3" />
            &nbsp;下次公布时间:&nbsp;
            <span className="text-foreground">
              {nextDate}
            </span>
          </div>
        </div>
        <div className="space-y-4">
          <div className="flex items-center">
            <div className="w-3 self-stretch bg-stock-up py-2 box-border mr-3" />
            数据影响
          </div>
          <div className="text-foreground text-sm">
            {query.data?.introduce.impact}
          </div>
          <div className="flex items-center">
            <div className="w-3 self-stretch bg-stock-up py-2 box-border mr-3" />
            数据解析
          </div>
          <div className="text-foreground text-sm">
            {query.data?.introduce.analysis}
          </div>
          <div className="flex items-center">
            <div className="w-3 self-stretch bg-stock-up py-2 box-border mr-3" />
            潜在影响
          </div>
          <div className="text-foreground text-sm">
            {query.data?.introduce.reasons}
          </div>

        </div>
      </div>
    </div >
  )
}

export default StockEconomic