import { getStockEconomic, getStockEconomicDetail } from "@/api"
import { JknIcon, JknRcTable, type JknRcTableProps, useFormModal, useModal } from "@/components"
import { useTime } from "@/store"
import echarts, { type ECOption } from "@/utils/echarts"
import { useQuery } from "@tanstack/react-query"
import { useMount, useUnmount } from "ahooks"
import dayjs from "dayjs"
import Decimal from "decimal.js"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useForm, useFormContext } from "react-hook-form"

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

  const form = useForm({
    defaultValues: {
      id: '',
      nextDate: ''
    }
  })

  const formModal = useFormModal({
    content: <DetailForm />,
    title: '详解',
    form,
    footer: null,
    closeIcon: true,
    className: 'w-auto',
    onOpen: ({ id, nextDate }) => {
      form.setValue('id', id)
      form.setValue('nextDate', nextDate)
      formModal.title(id)
    },
    onOk: () => {

    }
  })

  const getColor = useCallback((date: string) => {
    const current = dayjs(time.usTime + new Date().valueOf() - time.localStamp).tz('America/New_York')
    const usDay = dayjs(date)
    if (current.format('YYYY-MM-DD') > usDay.format('YYYY-MM-DD')) {
      return '#5e5f61'
    }
    console.log(current.day(6).format('YYYY-MM-DD'))
    if (current.day(6).isAfter(usDay)) {
      return 'hsl(var(--primary))'
    }

    return ''
  }, [time])

  const columns: JknRcTableProps<TableDataType>['columns'] = [
    { title: '序号', dataIndex: 'rank', width: 60, render: (_, row, index) => <span style={{ color: getColor(row.date) }}>{index + 1}</span>, align: 'center' },
    {
      title: '名称', dataIndex: 'name',
      render: (_, row) => (<span className="block py-1" style={{ color: getColor(row.date) }}>{row.name}</span>)
    },
    {
      title: '前值', dataIndex: 'before', align: 'center',
      render: (_, row) => (<span style={{ color: getColor(row.date) }}>{row.before ?? '--'}</span>)
    },
    {
      title: '现值', dataIndex: 'current', align: 'center',
      render: (_, row) => (<span style={{ color: getColor(row.date) }}>{row.current ?? '--'}</span>)
    },
    {
      title: '预测值', dataIndex: 'predict', align: 'center',
      render: (_, row) => (<span style={{ color: getColor(row.date) }}>{row.predict ?? '--'}</span>)
    },
    {
      title: '发布时间（美东）', dataIndex: 'date', align: 'center',
      render: (_, row) => (<span style={{ color: getColor(row.date) }}>{row.date?.slice(0, 16) || '--'}</span>)
    },
    {
      title: '下次发布时间（美东）', dataIndex: 'nextDate', align: 'center',
      render: (_, row) => (<span style={{ color: getColor(row.date) }}>{row.nextDate?.slice(0, 16) || '--'}</span>)
    },
    {
      title: '重要性', dataIndex: 'star', align: 'center',
      render: (_, row) => (<div className="space-x-1 text-right" style={{ color: getColor(row.date) }}>
        {
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          Array.from(new Array(row.star)).map((_, i) => <JknIcon name="ic_star_on" key={i} className="w-3 h-3" />)
        }
      </div>)
    },
    {
      title: '详解', dataIndex: 'opt', align: 'center', width: 60,
      render: (_, row) => {
        return (
          <>
            <span className="cursor-pointer" onClick={() => formModal.open({ id: row.key, nextDate: row.nextDate.slice(0, 11) || '--' })} onKeyDown={() => { }} style={{ color: getColor(row.date) }}>详解</span>
          </>
        )
      }
    }
  ]

  return (
    <div className="bg-background h-full overflow-hidden">
      <JknRcTable
        rowKey="id"
        columns={columns}
        data={data}
      />
      {
        formModal.context
      }
    </div>
  )
}



const DetailForm = () => {
  const form = useFormContext()
  const id = form.watch('id')
  const nextDate = form.watch('nextDate')
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
      itemHeight: 1,
      data: [
        { name: '实际值', icon: 'rect', textStyle: { color: '#fff' } },
        { name: '预测值', icon: 'rect', textStyle: { color: '#fff' } }
      ]
    },
    axisPointer: {
      show: true
    },
    yAxis: [
      { type: 'value', axisLabel: { formatter: v => Decimal.create(v).toFixed(2) }, splitLine: { lineStyle: { color: '#6e7079' } } },
      { type: 'value', show: false, position: 'right', axisLine: { show: false }, axisLabel: { formatter: v => Decimal.create(v).toFixed(2) } }
    ],
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: {
        formatter: (value: string) => dayjs(value).format('MM-DD')
      }
    },
    series: [
      { name: '实际值', type: 'line', data: [], color: '#ff8d00' },
      { name: '预测值', type: 'line', data: [], yAxisIndex: 1, color: '#9123a7' }
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
      series: [{ data: d1, symbol: false, connectNulls: true }, { data: d2, symbol: false, connectNulls: true }]
    })

  }, [query.data])


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