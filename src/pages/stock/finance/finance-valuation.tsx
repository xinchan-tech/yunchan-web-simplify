import { getStockValuation } from '@/api'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  JknIcon,
  JknTable,
  type JknTableProps,
  NumSpan,
  StockSelect,
  SubscribeSpan,
  ToggleGroup,
  ToggleGroupItem
} from '@/components'
import { useChart, useQueryParams } from '@/hooks'
import { useStockList } from '@/store'
import type { ECOption } from '@/utils/echarts'
import { type StockRecord, type StockWithExt, stockUtils } from '@/utils/stock'
import { useQuery } from '@tanstack/react-query'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import { useEffect, useMemo, useState } from 'react'

const convertDate = (date: string): [string, string] => {
  const current = dayjs()

  switch (date) {
    case '最近三个月':
      return [current.subtract(3, 'month').format('YYYY-MM-DD'), current.format('YYYY-MM-DD')]
    case '最近半年':
      return [current.subtract(6, 'month').format('YYYY-MM-DD'), current.format('YYYY-MM-DD')]
    case '最近一年':
      return [current.subtract(1, 'year').format('YYYY-MM-DD'), current.format('YYYY-MM-DD')]
    case '最近二年':
      return [current.subtract(2, 'year').format('YYYY-MM-DD'), current.format('YYYY-MM-DD')]
    case '最近三年':
      return [current.subtract(3, 'year').format('YYYY-MM-DD'), current.format('YYYY-MM-DD')]
    default:
      return [current.subtract(3, 'month').format('YYYY-MM-DD'), current.format('YYYY-MM-DD')]
  }
}

interface FinanceValuationProps {
  stock?: StockWithExt
}

export const FinanceValuation = (props: FinanceValuationProps) => {
  const [queryParams, setQueryParams] = useQueryParams<{ symbol: string }>()
  const { symbol } = queryParams ?? 'QQQ'
  const [date, setDate] = useState('最近三个月')
  const [chartType, setChartType] = useState<'pb' | 'pe'>('pe')
  const dates = useMemo(() => convertDate(date), [date])

  const { data: valuation } = useQuery({
    queryKey: [getStockValuation.cacheKey, symbol, dates],
    queryFn: () => getStockValuation(symbol, dates),
    enabled: !!symbol
  })

  const { listMap } = useStockList()

  const stockIcon = listMap[symbol]

  return (
    <div className="lg:w-[80%] md:w-[960px] mx-auto">
      <div className="flex items-center py-2 space-x-4 text-sm w-full mt-12">
        <div className="flex items-center space-x-2 ">
          <JknIcon stock={stockIcon?.[0]} className="w-8 h-8" />
          <span>{stockIcon?.[1]}</span>
        </div>
        {!props.stock ? (
          '--'
        ) : (
          <>
            <SubscribeSpan.Price
              trading="intraDay"
              symbol={props.stock.symbol}
              initValue={props.stock.close}
              initDirection={stockUtils.isUp(props.stock)}
              decimal={3}
            />
            <SubscribeSpan.Percent
              type="amount"
              trading="intraDay"
              symbol={props.stock.symbol}
              initValue={props.stock.close - props.stock.prevClose}
              initDirection={stockUtils.isUp(props.stock)}
              decimal={3}
            />
            <SubscribeSpan.Percent
              trading="intraDay"
              symbol={props.stock.symbol}
              initValue={stockUtils.getPercent(props.stock)}
              initDirection={stockUtils.isUp(props.stock)}
              decimal={3}
            />
          </>
        )}
        <span className="text-base">
          <span>泡沫系数：</span>
          <span className="text-stock-red">{valuation ? valuation.foam : '---'}</span>
        </span>

        <span className="!ml-auto text-tertiary text-xs flex items-center space-x-4">
          <StockSelect placeholder="搜索股票" onChange={v => setQueryParams({ symbol: v })} />
        </span>
      </div>

      <div className="my-12 relative text-center">
        <ToggleGroup
          value={chartType}
          onValueChange={v => setChartType(v as any)}
          type="single"
          className="gap-0 justify-center"
        >
          <ToggleGroupItem value="pe" variant="outline" className="rounded-none h-8">
            <div className="w-24">
              <div className="text-sm">市盈利</div>
            </div>
          </ToggleGroupItem>
          <ToggleGroupItem value="pb" variant="outline" className="rounded-none h-8">
            <div className="w-24">
              <div className="text-sm">市净率</div>
            </div>
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="absolute top-0 right-[70px] z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button reset>
                <span>{date}</span>
                <JknIcon name="arrow_down" className="ml-1 w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setDate('最近三个月')}>最近三个月</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDate('最近半年')}>最近半年</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDate('最近一年')}>最近一年</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDate('最近两年')}>最近两年</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDate('最近三年')}>最近三年</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="w-full h-[30vh] my-12">
          {chartType === 'pe' && valuation && <ValuationChart data={valuation.pe_ttm} />}
          {chartType === 'pb' && valuation && <ValuationChart data={valuation.pb} />}
        </div>

        <div className="w-full flex gap-x-2">
          <div className="w-1/2">
            <ValuationPieChart name="业务" options={valuation?.options} data={valuation?.revenues.product} />
          </div>
          <div className="w-1/2">
            <ValuationPieChart name="地区" options={valuation?.options} data={valuation?.revenues.geographic} />
          </div>
        </div>
      </div>
    </div>
  )
}

interface ValuationChartProps {
  data: Awaited<ReturnType<typeof getStockValuation>>['pb']
}

const ValuationChart = ({ data }: ValuationChartProps) => {
  const [chart, dom] = useChart()

  useEffect(() => {
    if (!data || !chart.current) return

    const options: ECOption = {
      grid: {
        top: 60,
        left: 40,
        right: 0,
        bottom: 4
      },
      legend: {
        data: ['市盈率', '高区位', '常规区', '低位区']
      },
      xAxis: {
        type: 'category',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        data: data.items.map(v => v[0])
      },
      yAxis: {
        axisLine: {
          show: true
        },
        splitLine: {
          lineStyle: {
            color: '#6e7079'
          }
        },
        axisTick: {
          show: false
        },
        splitNumber: 4,
        type: 'value',
        scale: true,
        axisPointer: {
          show: true
        }
      },
      series: [
        {
          name: '市盈率',
          type: 'line',
          symbol: 'none',
          data: data.items.map(v => v[1]),
          color: '#ff9800'
        },
        {
          name: '高区位',
          type: 'custom',
          renderItem: (_, api) => {
            const topLeft = [40, 60]

            const bottomRight = [api.coord([data.items.length - 1])[0] + 30, api.coord([0, data.max])[1]]

            return {
              type: 'rect',
              emphasisDisabled: true,
              shape: {
                x: topLeft[0],
                y: topLeft[1],
                width: bottomRight[0] - topLeft[0],
                height: bottomRight[1] - topLeft[1]
              },
              style: {
                fill: '#447871',
                opacity: 0.1
              }
            }
          },
          data: [0, data.max]
        },
        {
          name: '常规区',
          type: 'line',
          symbol: 'none',
          data: data.items.map(() => data.max),
          color: '#40547c'
        },
        {
          name: '低位区',
          type: 'line',
          symbol: 'none',
          data: data.items.map(() => data.min),
          color: '#20576a'
        }
      ]
    }

    chart.current.setOption(options)
  }, [data, chart])

  return <div className="w-full h-full" ref={dom} />
}

interface ValuationPieChartProps {
  name: string
  options?: Awaited<ReturnType<typeof getStockValuation>>['options']
  data?: Awaited<ReturnType<typeof getStockValuation>>['revenues']['geographic']
}

const ValuationPieChart = ({ name, data, options }: ValuationPieChartProps) => {
  const [quarter, setQuarter] = useState(options?.[0] ? `${options?.[0].year} ${options?.[0].period}` : undefined)
  const [chart, dom] = useChart()

  // const quarterData = useMemo(() => {

  // }, [data, quarter])

  useEffect(() => {
    if (!chart.current) return

    if (!data) {
      chart.current.clear()
      return
    }

    const options: ECOption = {
      grid: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      },
      series: [
        {
          label: {
            show: false,
            position: 'center',
            color: '#fff'
          },
          type: 'pie',
          radius: ['30%', '80%'],
          avoidLabelOverlap: false,
          labelLine: {
            show: false
          },
          data: data?.map(v => ({ name: v.name, value: v.revenue }))
        }
      ]
    }

    chart.current.setOption(options)
  }, [chart, data])

  useEffect(() => {
    if (options?.[0] && !quarter) {
      setQuarter(`${options[0].year} ${options[0].period}`)
    }
  }, [options, quarter])

  const columns = useMemo<JknTableProps<ArrayItem<typeof data>>['columns']>(
    () => [
      { header: '名称', accessorKey: 'name', enableSorting: false, meta: { align: 'left' } },
      {
        header: '营收',
        accessorKey: 'revenue',
        enableSorting: false,
        meta: { align: 'center', width: 90 },
        cell: ({ row }) => Decimal.create(row.getValue('revenue')).mul(10000).toShortCN()
      },
      {
        header: '占比',
        accessorKey: 'ratio',
        enableSorting: false,
        meta: { align: 'center', width: 90 },
        cell: ({ row }) => `${Decimal.create(row.getValue('ratio')).mul(100).toFixed(2)}%`
      }
    ],
    []
  )

  return (
    <div>
      <div className="flex items-center mb-4">
        <span className="font-bold text-lg">{name}</span>&emsp;&emsp;
        <span className="text-xs text-tertiary">货币单位： 美元</span>
        <div className="ml-auto mr-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button reset>
                <span>{quarter}</span>
                <JknIcon name="arrow_down" className="ml-1 w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {options?.map(v => (
                <DropdownMenuItem key={v.year + v.period}>{`${v.year} ${v.period}`}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <div className="flex">
        <div className="h-[200px] w-[240px]">
          <div className="w-[240px] h-full" ref={dom} />
        </div>
        <div className="h-[200px] overflow-hidden">
          <JknTable columns={columns} data={data ?? []} />
        </div>
      </div>
    </div>
  )
}
