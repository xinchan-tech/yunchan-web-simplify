import { getStockEconomicDetail, getStockFedCalendar } from "@/api"
import { JknIcon, JknRcTable, type JknRcTableProps } from "@/components"
import echarts, { type ECOption } from "@/utils/echarts"
import { useQuery } from "@tanstack/react-query"
import { useMount, useUnmount } from "ahooks"
import dayjs from "dayjs"
import Decimal from "decimal.js"
import { uid } from "radash"
import { useRef, useEffect, useMemo } from "react"

export const FedInterestRateDecision = () => {
  const query = useQuery({
    queryKey: [getStockEconomicDetail.cacheKey, 'Fed Interest Rate Decision'],
    queryFn: () => getStockEconomicDetail('Fed Interest Rate Decision'),
  })

  const fedCalendar = useQuery({
    queryKey: [getStockFedCalendar.cacheKey, 'Fed Interest Rate Decision'],
    queryFn: () => getStockFedCalendar()
  })

  const chartRef = useRef<HTMLDivElement>(null)
  const chart = useRef<echarts.ECharts>()

  const options: ECOption = {
    grid: {
      containLabel: true,
      left: 10,
      right: 10,
      top: 30,
      bottom: 20
    },
    color: ['#ff9800', '#9c27b0'],
    legend: {
      data: [
        { name: '实际值', textStyle: { color: '#fff' } },
        { name: '预测值', textStyle: { color: '#fff' } }
      ]
    },
    axisPointer: {
      show: true
    },
    yAxis: [
      {
        type: 'value', axisLabel: { formatter: v => Decimal.create(v).toFixed(2) }, scale: true,
        axisLine: {
          lineStyle: {
            color: '#6e7079'
          }
        },
        splitLine: {
          lineStyle: {
            color: '#6e7079'
          }
        }
      },
    ],
    xAxis: {
      type: 'category',
      data: [],
      axisLabel: {
        formatter: (value: string) => dayjs(value).format('MM-DD')
      }
    },
    series: [
      { name: '实际值', type: 'line', data: [], connectNulls: true },
      { name: '预测值', type: 'line', data: [], connectNulls: true },
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
    category.reverse()
    d1.reverse()
    d2.reverse()
    chart.current?.setOption({
      xAxis: { data: category },
      series: [{ data: d1, symbol: false }, { data: d2, symbol: false }]
    })

  }, [query.data])



  const columns = useMemo<JknRcTableProps<any>['columns']>(() => [
    { title: <span className="text-stock-up">月份</span>, dataIndex: 'date', align: 'center', render: (v) => <span className="text-white inline-block leading-8">{v}</span> },
    { title: <span className="text-stock-up">决议声明</span>, dataIndex: 'declare', align: 'center', render: (v) => <span className="text-white">{v}</span> },
    { title: <span className="text-stock-up">发布会</span>, dataIndex: 'conference', align: 'center', render: (v) => <span className="text-white">{v}</span> },
    { title: <span className="text-stock-up">点阵图</span>, dataIndex: 'bitmap', align: 'center', render: (v) => <span className="text-white">{v}</span> },
    { title: <span className="text-stock-up">经济预测</span>, dataIndex: 'prediction', align: 'center', render: (v) => <span className="text-white">{v}</span> },
    { title: <span className="text-stock-up">纪要</span>, dataIndex: 'summary', align: 'center', render: (v) => <span className="text-white">{v}</span> },
    { title: <span className="text-stock-up">褐皮书</span>, dataIndex: 'beige_book', align: 'center', render: (v) => <span className="text-white">{v}</span> },
  ], [])

  const data = useMemo(() => fedCalendar.data?.map(item => ({
    id: uid(8),
    ...item
  })) ?? [], [fedCalendar.data])

  return (
    <div className="w-[900px] box-border px-8 py-4 mx-auto h-full overflow-y-auto">

      <p className="text-center text-lg">美联储利率决议</p>
      <p className="text-center text-sm bg-background py-2">
        <span>最新值：<span className="text-stock-up">--亿美元</span></span>&emsp;&emsp;&emsp;
        <span>预测值：<span className="text-stock-up">--亿美元</span></span>
      </p>
      <div className="h-[400px] w-full" ref={chartRef} />
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
              --
            </span>
          </div>
        </div>

        <div className="mb-12">
          <p className="text-center text-lg text-white">美联储日程</p>
          <JknRcTable scroll={{ y: 'auto' }} columns={columns} data={data} rowKey="id" />
        </div>

        <div className="flex items-center">
          <div className="w-3 self-stretch bg-stock-up py-2 box-border mr-3" />
          美联储利率决议+发布会+经济预测+点阵图：
        </div>
        <div className="text-foreground text-sm my-4">
          利率决议1年8次，通常在北京时间周四凌层两三点发布结果。其中每季未那次决议的声明中会公布经济预测和点阵图，
          半小时后再举行美联储主席发布会，其他几次决议只有决议声明。<br /><br />
          纪要、褐皮书：纪要在该月决议后三周公布，褐皮书在决议前两周公布。<br /><br />
          跨天处理：美联储上表日期在财历上对应次日北京时间凌晨，为提示用户不错过半夜发布的内容，汇通网央行专题的上
          表日期按“交易日”预报，比如北京时间周四凌晨 02:00 发布的，在上表写周三交易日的日期。
        </div>
        <div className="space-y-4 px-2 mt-8">
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
    </div>
  )
}