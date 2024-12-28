import { getStockBaseCodeInfo, getStockFinanceTotal } from "@/api"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, JknIcon, NumSpan, Progress, StockSelect, ToggleGroup, ToggleGroupItem } from "@/components"
import { useChart, useQueryParams } from "@/hooks"
import { useStockList } from "@/store"
import { stockManager } from "@/utils/stock"
import { useQuery } from "@tanstack/react-query"
import { useMount } from "ahooks"
import dayjs from "dayjs"
import Decimal from "decimal.js"
import { mapValues } from "radash"
import { useCallback, useEffect, useMemo, useState } from "react"
import { stockBaseCodeInfoExtend, useSymbolQuery } from "../lib"
import type { ECOption } from "@/utils/echarts"
import echarts from "@/utils/echarts"
import theme from "@/theme/variables.module.scss"

type FinanceData = Awaited<ReturnType<typeof getStockFinanceTotal>>

export const FinanceCore = () => {
  const symbol = useSymbolQuery()
  const [period, setPeriod] = useState<'quarter' | 'year'>('quarter')
  const [chartType, setChartType] = useState<'revenue' | 'incomeLoss' | 'cashFlowFree' | 'rate'>('revenue')
  const [_, setQueryParams] = useQueryParams()

  const stockBaseInfo = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, symbol, stockBaseCodeInfoExtend],
    queryFn: () => getStockBaseCodeInfo({ symbol, extend: stockBaseCodeInfoExtend }),
    enabled: !!symbol
  })

  const { data: stockFinance } = useQuery({
    queryKey: [getStockFinanceTotal.cacheKey, symbol],
    queryFn: () => getStockFinanceTotal(symbol),
    enabled: !!symbol
  })

  const { listMap } = useStockList()

  const stockIcon = listMap[symbol]

  const stock = useMemo(() => stockBaseInfo.data ? stockManager.toStockRecord(stockBaseInfo.data)[0] : undefined, [stockBaseInfo.data])

  const stockFinanceTotal = useMemo(() => {
    if (!stockFinance) return undefined

    if (period === 'quarter') {
      return mapValues(stockFinance.quarter_items, (v) => {
        return Decimal.create(v[v.length - 1].value)
      })
    }

    return mapValues(stockFinance.year_items, (v) => {
      return Decimal.create(v[v.length - 1].value)
    })
  }, [stockFinance, period])

  const chartData = useMemo(() => {
    if (!stockFinance) return []
    const r: FinanceChartProps['data'] = []

    const source = period === 'quarter' ? stockFinance.quarter_items : stockFinance.year_items as typeof stockFinance.quarter_items

    if (chartType === 'revenue') {
      const barChart: ArrayItem<typeof r> = {
        type: 'bar',
        showLabel: true,
        data: [],
        name: '总营收',
        color: '#3861f6'
      }
      const rateChart: ArrayItem<typeof r> = {
        type: 'line',
        data: [],
        name: '增长率',
        color: '#f6a138',
        yIndex: 1
      }
      source.revenues.forEach((v) => {
        const x = `${v.fiscal_year.slice(2)} ${v.fiscal_period ?? ''}`
        barChart.data.push([x, v.value])
        rateChart.data.push([x, v.rate])
      })

      r.push(barChart, rateChart)
    } else if (chartType === 'incomeLoss') {
      const barChart: ArrayItem<typeof r> = {
        type: 'bar',
        showLabel: true,
        data: [],
        name: '净利润',
        color: '#3861f6'
      }
      const rateChart: ArrayItem<typeof r> = {
        type: 'line',
        data: [],
        name: '增长率',
        color: '#f6a138',
        yIndex: 1
      }
      source.net_income_loss.forEach((v) => {
        const x = `${v.fiscal_year.slice(2)} ${v.fiscal_period ?? ''}`
        barChart.data.push([x, v.value])
        rateChart.data.push([x, v.rate])
      })

      r.push(barChart, rateChart)
    } else if (chartType === 'cashFlowFree') {
      const barChart: ArrayItem<typeof r> = {
        type: 'bar',
        showLabel: true,
        data: [],
        name: '现金流',
        color: '#3861f6'
      }
      const rateChart: ArrayItem<typeof r> = {
        type: 'line',
        data: [],
        name: '增长率',
        color: '#f6a138',
        yIndex: 1
      }
      source.net_cash_flow_free.forEach((v) => {
        const x = `${v.fiscal_year.slice(2)} ${v.fiscal_period ?? ''}`
        barChart.data.push([x, v.value])
        rateChart.data.push([x, v.rate * 100])
      })

      r.push(barChart, rateChart)
    } else if (chartType === 'rate') {
      const equityChart: ArrayItem<typeof r> = {
        type: 'bar',
        showLabel: true,
        data: [],
        name: '资产',
        color: '#3861f6'
      }
      const liabilitiesChart: ArrayItem<typeof r> = {
        type: 'bar',
        showLabel: true,
        data: [],
        name: '负债',
        color: '#ff5722'
      }
      const rateChart: ArrayItem<typeof r> = {
        type: 'line',
        data: [],
        name: '负债率',
        color: '#f6a138',
        yIndex: 1
      }
      source.liabilities.forEach((v) => {
        const x = `${v.fiscal_year.slice(2)} ${v.fiscal_period ?? ''}`
        liabilitiesChart.data.push([x, v.value])
      })
      source.equity.forEach((v) => {
        const x = `${v.fiscal_year.slice(2)} ${v.fiscal_period ?? ''}`
        equityChart.data.push([x, v.value])
      })
      source.liabilities_rate.forEach((v) => {
        const x = `${v.fiscal_year.slice(2)} ${v.fiscal_period ?? ''}`
        rateChart.data.push([x, v.value * 100])
      })

      r.push(equityChart, liabilitiesChart, rateChart)
    }

    return r

  }, [stockFinance, period, chartType])

  return (
    <div className="lg:w-[80%] md:w-[960px] mx-auto">
      <div className="flex items-center py-2 space-x-4 text-sm w-full mt-12">
        <div className="flex items-center space-x-2 ">
          <JknIcon stock={stockIcon?.[0]} className="w-8 h-8" />
          <span>{stockIcon?.[1]}</span>
        </div>
        <NumSpan value={stock?.close} isPositive={stock?.isUp} decimal={3} />
        <NumSpan value={stock?.percentAmount} isPositive={stock?.isUp} decimal={3} symbol />
        <NumSpan value={Decimal.create(stock?.percent).mul(100)} isPositive={stock?.isUp} decimal={2} symbol percent />

        <span className="!ml-auto text-tertiary text-xs flex items-center space-x-4">
          <span>更新时间: {dayjs(stockFinance?.totals.updated_at).format('YYYY-MM-DD')}</span>
          <StockSelect placeholder="搜索股票" onChange={v => setQueryParams({symbol: v})} />
        </span>
      </div>

      <div className="my-4">
        <div className="flex items-center space-x-4">
          <ToggleGroup
            value={chartType} onValueChange={v => setChartType(v as any)} type="single" className="justify-around w-full"
            activeColor="hsl(var(--accent))"
          >
            <ToggleGroupItem value={'revenue'} className="h-16" variant="outline">
              <div className="w-32">
                <div className="text-sm">总营收</div>
                <div className="text-lg text-stock-green font-bold">{stockFinanceTotal?.revenues.toShortCN(2)}</div>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem value={'incomeLoss'} className="h-16" variant="outline">
              <div className="w-32">
                <div className="text-sm">净利润</div>
                <div className="text-lg text-stock-green font-bold">{stockFinanceTotal?.net_income_loss.toShortCN(2)}</div>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem value={'cashFlowFree'} className="h-16" variant="outline">
              <div className="w-32">
                <div className="text-sm">现金流</div>
                <div className="text-lg text-stock-green font-bold">{stockFinanceTotal?.net_cash_flow_free.toShortCN(2)}</div>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem value={'rate'} className="h-16" variant="outline">
              <div className="w-32">
                <div className="text-sm">负债率</div>
                <div className="text-lg text-stock-green font-bold">{stockFinanceTotal?.liabilities_rate.mul(100).toFixed(2)}%</div>
              </div>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="w-full h-[40vh] mt-12 relative">
        <div className="absolute top-0 right-[70px] z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button reset>
                <span>{period === 'quarter' ? '季度' : '年度'}</span>
                <JknIcon name="arrow_down" className="ml-1 w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setPeriod('quarter')}>季度</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPeriod('year')}>年度</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <FinanceChart data={chartData} />
      </div>

      <div className="flex mt-12">
        <div className="flex-1 flex justify-center">
          <FinanceRating data={stockFinance?.rating} />
        </div>
        <div className="flex-1 flex justify-center">
          <FinanceTarget data={stockFinance?.targets} />
        </div>
      </div>
    </div>
  )

}

interface FinanceChartProps {
  data: {
    type: 'line' | 'bar',
    showLabel?: boolean,
    color?: string,
    name: string,
    yIndex?: number,
    data: [string, number][]
  }[]
}

const FinanceChart = (props: FinanceChartProps) => {
  const [chart, dom] = useChart()
  const options = useMemo<ECOption>(() => ({
    grid: {
      top: 40,
      left: 90,
      right: 70,
      bottom: 60
    },
    axisPointer: {
      link: [{ yAxisIndex: 'all' }],
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      }
    },
    yAxis: [
      {
        type: 'value',
        scale: true,
        axisLine: {
          show: true,
          lineStyle: {
            color: '#6e7079'
          }
        },
        axisPointer: {
          show: true,
          label: {
            formatter: (v) => {
              return Decimal.create(v.value as string).toShortCN(2)
            }
          }
        },
        splitLine: {
          lineStyle: {
            color: '#6e7079'
          }
        },
        axisLabel: {
          formatter: (v: number) => Decimal.create(v).toShortCN(2)
        }
      },
      {
        type: 'value',
        axisLabel: {
          formatter: (v: number) => `${Decimal.create(v).mul(100).toFixed(3)}%`
        },
        axisPointer: {
          show: true,
          label: {
            formatter: (v) => {
              return `${Decimal.create(v.value as string).mul(100).toFixed(2)}%`
            }
          }
        },
        scale: true,
        axisLine: {
          show: true
        },
        splitLine: {
          show: false
        },
        position: 'right',

      }
    ],
    dataZoom: [
      {
        fillerColor: 'weakFilter',
        minSpan: 2,
        show: true,
        xAxisIndex: [0],
        type: 'slider',
        bottom: 0,
        start: 80,
        end: 100,
        backgroundColor: 'transparent',
        dataBackground: {
          lineStyle: {
            color: 'rgb(31, 32, 33)'
          }
        },
        borderColor: 'rgb(31, 32, 33)',
      }
    ],
    series: [{
      type: 'bar',
      data: []
    }]
  }), [])

  const renderChart = useCallback((data: FinanceChartProps['data']) => {
    if (!chart.current || !data) return
    const series = data.map(({ type, showLabel, color, data, name, yIndex }) => {
      return {
        type,
        name,
        symbol: 'none',
        yAxisIndex: yIndex ?? 0,
        data: data,
        barWidth: 20,
        encode: {
          x: 0,
          y: 1
        },
        label: {
          show: showLabel,
          position: 'top',
          formatter: (params: any) => {
            return Decimal.create(params.value[1]).toShortCN(2)
          },
          color: color
        },
        itemStyle: {
          color
        }
      }
    })

    chart.current.setOption({
      legend: {
        data: data.map(d => d.name),
        textStyle: {
          color: '#fff'
        }
      },
      xAxis: {
        type: 'category',
        data: data[0]?.data.map(d => d[0])
      },
      series: series
    })


  }, [chart])

  useMount(() => {
    chart.current?.setOption(options)
  })

  useEffect(() => {
    chart.current?.clear()
    chart.current?.setOption(options)
    renderChart(props.data)
  }, [props.data, renderChart, chart, options])


  return (
    <div ref={dom} className="w-full h-full" />
  )
}

interface FinanceRatingProps {
  data?: FinanceData['rating']
}

const FinanceRating = ({ data }: FinanceRatingProps) => {
  return (
    <div>
      <div className="text-center">
        <span className="text-lg font-bold">分析师评级</span>&nbsp;&nbsp;
        <span className="text-tertiary text-xs">更新时间：{data?.updated_at ? dayjs(data?.updated_at).format('YYYY-MM-DD') : '--'}</span>
      </div>
      <div className="flex items-center space-x-4 justify-center my-12">
        <div className="w-[120px] h-[120px] flex items-center justify-center rounded-full bg-stock-green/30 font-bold text-2xl text-stock-green">
          {data?.title}
        </div>
      </div>
      <div className=" space-y-2 text-sm">
        <div className="flex items-center space-x-2 w-96">
          <span className="flex-shrink-0">买入：</span>
          <Progress className="h-3" activeColor="#00b058" value={+(data?.buy ?? '0')} />
          <span className="w-12">{data?.buy}%</span>
        </div>
        <div className="flex items-center space-x-2 w-96">
          <span className="flex-shrink-0">持有：</span>
          <Progress className="h-3" activeColor="#616161" value={+(data?.hold ?? '0')} />
          <span className="w-12">{data?.hold}%</span>
        </div>
        <div className="flex items-center space-x-2 w-96">
          <span className="flex-shrink-0">卖出：</span>
          <Progress className="h-3" activeColor="#ff3248" value={+(data?.sell ?? '0')} />
          <span className="w-12">{data?.sell}%</span>
        </div>
      </div>
    </div>
  )
}

interface FinanceTargetProps {
  data?: FinanceData['targets']
}

const FinanceTarget = ({ data }: FinanceTargetProps) => {
  const [chart, dom] = useChart()
  const options = useMemo<ECOption>(() => ({
    animation: false,
    grid: {
      top: 40,
      left: 90,
      right: '10%',
      bottom: 20
    },
    graphic: {
      elements: [{
        type: 'text',
        style: {
          text: '过去12个月',
          fontSize: 12,
          fill: `hsl(${theme.gray})`,
          textAlign: 'center'
        },
        left: '30%',
        bottom: 0
      }, {
        type: 'text',
        style: {
          text: '未来12个月',
          fontSize: 12,
          fill: `hsl(${theme.gray})`,
          textAlign: 'center'
        },
        left: '65%',
        bottom: 0
      }]
    },
    xAxis: {
      type: 'category',
      data: [],
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        show: false
      },
      max: (v) => v.max * 2
    },
    yAxis: {
      type: 'value',
      scale: true,
      splitNumber: 3,
      axisLine: {
        show: true,
        lineStyle: {
          color: '#0a0a0a'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#0a0a0a'
        }
      },
      axisLabel: {
        color: '#6e7079'
      }
    },
    series: [{
      type: 'line',
      data: [],
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{
          offset: 0,
          color: 'rgba(56, 97, 246, 0.3)'
        }, {
          offset: 1,
          color: 'rgba(56, 97, 246, 0)'
        }])
      }
    }]
  }), [])

  useEffect(() => {
    if (!chart.current || !data) return
    chart.current.clear()
    chart.current.setOption(options)
    const lastData = data.list[data.list.length - 1]
    const chartWidth = chart.current.getWidth()
    chart.current.setOption({
      xAxis: {
        data: data.list.map(d => d.datetime)
      }
    })
    chart.current.setOption({
      series: [{
        data: data.list.map(d => d.close),
        markLine: {
          symbol: ['none', 'none'],
          silent: true,
          data: [
            [
              {
                xAxis: 'max',
                yAxis: lastData.close,
              },
              {
                xAxis: 'max',
                yAxis: lastData.close,
                label: {
                  show: true,
                  color: '#fff',
                  formatter: () => {
                    return `现价\n${lastData.close}`
                  },

                }
              },
            ],
            [
              {
                xAxis: 'max',
                yAxis: lastData.close,
              },
              {
                x: '88%',
                yAxis: +data.target.high,
                lineStyle: {
                  color: `hsl(${theme.colorStockGreen})`
                },
                label: {
                  show: true,
                  color: '#fff',
                  borderRadius: 4,
                  padding: [2, 4],
                  backgroundColor: `hsl(${theme.colorStockGreen})`,
                  formatter: () => {
                    return `最高\n${Decimal.create(data.target.high).toFixed(3)}`
                  }
                }
              },
            ],
            [
              {
                xAxis: 'max',
                yAxis: lastData.close,
              },
              {
                x: '88%',
                yAxis: +data.target.low,
                lineStyle: {
                  color: `hsl(${theme.colorStockRed})`
                },
                label: {
                  show: true,
                  align: 'left',
                  verticalAlign: 'bottom',
                  color: '#fff',
                  borderRadius: 4,
                  padding: [2, 4],
                  backgroundColor: `hsl(${theme.colorStockRed})`,
                  formatter: () => {
                    return `最低\n${Decimal.create(data.target.low).toFixed(3)}`
                  }
                }
              },
            ],
            [
              {
                xAxis: 'max',
                yAxis: lastData.close,
              },
              {
                x: '88%',
                yAxis: +data.target.median,
                lineStyle: {
                  color: `hsl(${theme.gray})`
                },
                label: {
                  show: true,
                  color: '#fff',
                  borderRadius: 4,
                  padding: [2, 4],
                  backgroundColor: `hsl(${theme.gray})`,
                  formatter: () => {
                    return `平均\n${Decimal.create(data.target.median).toFixed(3)}`
                  }
                }
              },
            ]
          ]
        }
      }, {
        type: 'custom',
        yAxisIndex: 0,
        xAxisIndex: 0,
        encode: {
          x: [0],
          y: [1]
        },
        renderItem: (params: any, api: any) => {
          if (params.context.rendered) return
          params.context.rendered = true
          const startPoint = api.coord([lastData.datetime, +lastData.close])

          const rightTop = api.coord([0, data.target.high])
          const rightTopPoint = [chartWidth * 0.88, rightTop[1]]

          const rightBottom = api.coord([0, data.target.median])
          const rightBottomPoint = [chartWidth * 0.88, rightBottom[1]]

          const points = [startPoint, rightTopPoint, rightBottomPoint]

          const startPoint2 = api.coord([lastData.datetime, +lastData.close])

          const rightTop2 = api.coord([0, data.target.median])
          const rightTopPoint2 = [chartWidth * 0.88, rightTop2[1]]

          const rightBottom2 = api.coord([0, data.target.low])
          const rightBottomPoint2 = [chartWidth * 0.88, rightBottom2[1]]

          const points2 = [startPoint2, rightTopPoint2, rightBottomPoint2]

          return {
            type: 'group',
            emphasisDisabled: true,
            children: [{
              type: 'polyline',
              emphasisDisabled: true,
              shape: {
                points
              },
              style: {
                fill: `hsl(${theme.colorStockGreen} / 0.3)`,
                lineWidth: 2
              }
            }, {
              type: 'polyline',
              emphasisDisabled: true,
              shape: {
                points: points2
              },
              style: {
                fill: `hsl(${theme.colorStockRed} / 0.3)`,
                lineWidth: 2
              }
            }]
          }
        },
        data: data.list.map(d => [d.datetime, d.close])
      }]
    })
  }, [data, chart, options])

  return (
    <div>
      <div className="text-center">
        <span className="text-lg font-bold">目标价值预测</span>&nbsp;&nbsp;
        <span className="text-tertiary text-xs">更新时间：{data?.target.updated_at ? dayjs(data.target.updated_at).format('YYYY-MM-DD') : '--'}</span>
      </div>
      <div className="h-[320px] w-[480px]" ref={dom}>

      </div>
    </div>
  )
}