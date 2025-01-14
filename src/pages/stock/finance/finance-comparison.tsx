import { getStockFinancialsPK } from '@/api'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, JknIcon, StockSelect, ToggleGroup, ToggleGroupItem } from "@/components"
import { useChart } from "@/hooks"
import theme from '@/theme/variables.module.scss'
import type { ECOption } from "@/utils/echarts"
import { colorUtil } from "@/utils/style"
import { useQueries } from '@tanstack/react-query'
import Decimal from "decimal.js"
import { useEffect, useMemo } from 'react'
import { useImmer } from "use-immer"



export const FinanceComparison = () => {
  const [params, setParams] = useImmer({ type: 'revenues', symbols: [] as string[], period: 'quarter' })

  const queries = useQueries({
    queries: params.symbols.map(symbol => ({
      queryKey: [getStockFinancialsPK.cacheKey, symbol],
      queryFn: () => getStockFinancialsPK(symbol),
      enabled: !!params.symbols.length
    }))
  })

  const chartData = useMemo(() => {
    const datas = queries.map(q => q.data)

    const source = params.period === 'quarter' ? datas.map(q => q?.quarter_data) : datas.map(q => q?.year_data)

    const r: FinanceComparisonChartProps['data'] = []

    for (let i = 0; i < source.length; i++) {
      const data = source[i]
      if (!data) continue

      r.push({
        symbol: params.symbols[i],
        color: colorUtil.colorPalette[i],
        data: data.map((v) => [v.fiscal_year.slice(2) + (params.period === 'quarter' ? ` ${v.fiscal_period}` : ''), v[params.type as keyof typeof data[0]] as unknown as number])
      })
    }

    return r
  }, [queries, params])

  return (
    <div className="text-sm">
      <div className="flex items-center px-4 box-border py-2">
        <span>选择PK数据：</span>
        <ToggleGroup variant="outline" type="single" value={params.type} onValueChange={(v: string) => setParams(draft => { draft.type = v as string })}>
          <ToggleGroupItem className="w-24 h-8" value="revenues">总营收</ToggleGroupItem>
          <ToggleGroupItem className="w-24 h-8" value="net_income_loss">净利润</ToggleGroupItem>
          <ToggleGroupItem className="w-24 h-8" value="net_cash_flow_from_operating_activities">现金流</ToggleGroupItem>
          <ToggleGroupItem className="w-24 h-8" value="market_cap">总资产</ToggleGroupItem>
          <ToggleGroupItem className="w-24 h-8" value="liabilities_rate">负债率</ToggleGroupItem>
        </ToggleGroup>
      </div>
      <div className="flex items-center px-4 box-border py-2">
        <span>添加PK股票：</span>
        <div>
          {
            params.symbols.map((symbol, index) => (
              <div key={symbol} className="inline-block min-w-16 mr-3 px-2 py-1 bg-accent text-white rounded-sm text-center relative" style={{ backgroundColor: colors[index] }}>
                <span className="absolute -right-2 -top-2 cursor-pointer w-4 h-4 text-xs bg-gray-600 rounded-full text-center" onClick={() => setParams(d => { d.symbols.splice(index, 1) })} onKeyDown={() => { }}>x</span>
                <span>{symbol}</span>
              </div>
            ))
          }
        </div>
        <StockSelect placeholder="搜索股票" onChange={v => !params.symbols.find(s => s === v) && setParams(d => { d.symbols.push(v) })} />
      </div>
      <div className="mt-12 w-full h-[480px] border-0 border-t border-solid border-border relative">
        <div className="flex justify-end mt-4 mr-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div>
                {params.period === 'quarter' ? '季度' : '年度'}
                <JknIcon name="arrow_down" className="w-2 h-2  ml-1" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setParams(d => { d.period = 'quarter' })}>季度</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setParams(d => { d.period = 'year' })}>年度</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <FinanceComparisonChart data={chartData} />
      </div>
    </div>
  )
}

interface FinanceComparisonChartProps {
  data?: {
    symbol: string
    color: string
    data: [string, number][]
  }[]
}

export const FinanceComparisonChart = ({ data }: FinanceComparisonChartProps) => {
  const [chart, dom] = useChart()

  useEffect(() => {
    if (!chart || !data) return
    chart.current?.clear()

    if (data.length === 0) return

    const maxIndex = data.reduce((acc, v, index) => v.data.length >= acc ? index : acc, 0)

    const options: ECOption = {
      xAxis: {
        type: 'category',
        data: data[maxIndex].data.map(v => v[0]),
        axisTick: {
          show: false
        },
        axisLine: {
          lineStyle: {
            color: `hsl(${theme.textSecondary})`,
          }
        }
      },
      yAxis: {
        scale: true,
        axisLabel: {
          color: `hsl(${theme.textSecondary})`,
          formatter: (value) => Decimal.create(value.toString()).toShortCN(2)
        },
        axisLine: {
          show: true,
        },
        splitLine: {
          lineStyle: {
            color: '#202020'
          }
        },
        axisPointer: {
          show: true,
          label: {
            formatter: (params) => Decimal.create(params.value.toString()).toShortCN(2)
          }
        },
        type: 'value'
      },
      series: [
        ...data.map(v => ({
          name: v.symbol,
          type: 'line' as any,
          color: v.color,
          data: v.data,
          encode: {
            x: 0,
            y: 1
          }
        }))
      ]
    }

    chart.current?.setOption(options)
  }, [chart, data])

  return (
    <div className="w-full h-full" ref={dom} />
  )
}