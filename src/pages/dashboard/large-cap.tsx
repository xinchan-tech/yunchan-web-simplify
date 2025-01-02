import { StockChartInterval, getLargeCapIndexes, getStockChart } from "@/api"
import StockDownIcon from '@/assets/icon/stock_down.png'
import StockUpIcon from '@/assets/icon/stock_up.png'
import { CapsuleTabs } from "@/components"
import { useSubscribe } from "@/hooks"
import { useConfig, useTime } from "@/store"
import { getTradingPeriod } from "@/utils/date"
import echarts, { type ECOption } from "@/utils/echarts"
import { stockManager, type StockTrading } from "@/utils/stock"
import { cn, colorUtil } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import { useMount, useSize, useUnmount, useUpdateEffect } from "ahooks"
import clsx from "clsx"
import dayjs from "dayjs"
import Decimal from "decimal.js"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

const tradingToIntervalMap: Record<StockTrading, StockChartInterval> = {
  intraDay: StockChartInterval.INTRA_DAY,
  preMarket: StockChartInterval.PRE_MARKET,
  afterHours: StockChartInterval.AFTER_HOURS,
  close: StockChartInterval.AFTER_HOURS,
}

const intervalToTradingMap: Partial<Record<StockChartInterval, StockTrading>> = {
  [StockChartInterval.INTRA_DAY]: 'intraDay',
  [StockChartInterval.PRE_MARKET]: 'preMarket',
  [StockChartInterval.AFTER_HOURS]: 'afterHours',
  [StockChartInterval.DAY]: 'intraDay',
  [StockChartInterval.FIVE_DAY]: 'intraDay',
  [StockChartInterval.MONTH]: 'intraDay',
  [StockChartInterval.QUARTER]: 'intraDay',
  [StockChartInterval.HALF_YEAR]: 'intraDay',
  [StockChartInterval.WEEK]: 'intraDay',
}

const LargeCap = () => {
  const [activeKey, setActiveKey] = useState<string>()
  const [activeStock, setActiveStock] = useState<string>()
  const time = useTime()

  const [stockType, setStockType] = useState<StockChartInterval>(tradingToIntervalMap[time.getTrading() as StockTrading])
  const largeCap = useQuery({
    queryKey: [getLargeCapIndexes.cacheKey],
    queryFn: () => getLargeCapIndexes(),
  })

  useEffect(() => {
    if (largeCap.data) {
      setActiveKey(largeCap.data[1].category_name)
      setActiveStock(largeCap.data[1].stocks[0].symbol)
    }
  }, [largeCap.data])

  // useSubscribe(largeCap.data?.find(o => o.category_name === activeKey)?.stocks.map(s => s.symbol) ?? [], (data) => {
  //   console.log(data)
  // })

  const tabs = useMemo(() => {
    return largeCap.data?.map(item => ({
      key: item.category_name,
      label: item.category_name,
    }))
  }, [largeCap.data])

  const { t } = useTranslation()

  const onActiveStockChange = (s: string) => {
    setActiveStock(s)
    if (s === '大盘指数') {
      setStockType(StockChartInterval.INTRA_DAY)
    }
  }

  const stocks = useMemo(() => {
    if (!activeKey || !largeCap.data) return []

    return largeCap.data.find(item => item.category_name === activeKey)?.stocks.map(item => stockManager.toSimpleStockRecord(item.stock, item.symbol, item.name)) ?? []
  }, [activeKey, largeCap.data])

  const onActiveKeyChange = (key: string) => {
    setActiveKey(key)
    const codes = largeCap.data?.find(item => item.category_name === key)?.stocks.map(item => [item.symbol, item.name]) ?? []
    setActiveStock(codes[0][0])

    // setActiveStock(t.stocks[0].code)
  }

  return (
    <div className="h-full flex flex-col">
      <div className="py-1.5 border-style-primary px-2 h-[34px] box-border">
        <CapsuleTabs activeKey={activeKey} onChange={onActiveKeyChange}>
          {
            tabs?.map(item => <CapsuleTabs.Tab key={item.key} value={item.key} label={item.label} />)
          }
        </CapsuleTabs>
      </div>
      <div className="flex p-1.5 border-style-primary justify-between space-x-2 h-[100px] box-border">
        {
          stocks.map(stock => (
            <div
              key={stock.name}
              className={cn(
                'border-style-primary  flex-1 hover:bg-hover text-center py-2 cursor-pointer transition-all duration-300',
                {
                  'bg-accent': activeStock === stock.symbol
                }
              )}
              onClick={() => onActiveStockChange(stock.symbol)}
              onKeyDown={() => { }}
            >
              <div className="text-center"><span>{stock.name}</span></div>
              <div
                className={clsx(
                  'font-black text-[15px]',
                  (stock.percent ?? 0) >= 0 ? 'text-stock-up' : 'text-stock-down'
                )}>
                <div className="flex items-center justify-center mt-1">
                  {Decimal.create(stock.close).toFixed(3)}
                  <img className="w-5" src={(stock.percent ?? 0) >= 0 ? StockUpIcon : StockDownIcon} alt="" />
                </div>
                <div className="">{Decimal.create((stock.percent ?? 0) * 100).toFixed(2)}%</div>
              </div>
            </div>
          ))
        }
      </div>
      <div className="flex-1 relative">
        <LargeCapChart code={activeStock} type={stockType} />
        {
          activeKey !== '大盘指数' && (
            <div className="absolute bottom-4 left-10">
              <CapsuleTabs activeKey={stockType.toString()} onChange={(value) => setStockType(+value as unknown as StockChartInterval)}>
                <CapsuleTabs.Tab value={StockChartInterval.PRE_MARKET.toString()} label={t('stockChart.before')} />
                <CapsuleTabs.Tab value={StockChartInterval.INTRA_DAY.toString()} label={t('stockChart.in')} />
                <CapsuleTabs.Tab value={StockChartInterval.AFTER_HOURS.toString()} label={t('stockChart.after')} />
              </CapsuleTabs>
            </div>
          )
        }
      </div>
    </div>
  )
}

interface LargeCapChartProps {
  code?: string
  type: StockChartInterval
}

const LargeCapChart = ({ code, type }: LargeCapChartProps) => {
  const chartRef = useRef<echarts.ECharts>()
  const chartDomRef = useRef<HTMLDivElement>(null)
  const { getStockColor } = useConfig()
  const stockUpColor = `hsl(${getStockColor()})`
  const stockDownColor = `hsl(${getStockColor(false)})`

  const interval = ((c, t) => {
    if (['SPX', 'IXIC', 'DJI'].includes(c!)) {
      return StockChartInterval.INTRA_DAY
    }
    return t
  })(code, type)


  const queryData = useQuery({
    queryKey: [getStockChart.cacheKey, code, type],
    queryFn: () => getStockChart({ ticker: code!, interval: interval }),
    enabled: !!code && type !== undefined,
    refetchInterval: 60 * 1000,
    placeholderData: () => ({
      history: [],
      coiling_data: {} as any,
      md5: ''
    })
  })

  

  useUpdateEffect(() => {
    renderChart(queryData.data)
  }, [queryData.data])

  const renderChart = (data: typeof queryData.data) => {
    if (!data) return
    const dataset: [string, number, number][] = []
    let prevClose = 0
    let lastPercent = 0
    for (const s of data.history) {
      const t = stockManager.toSimpleStockRecord(s)
      prevClose = t.prevClose!
      lastPercent = t.percent!
      dataset.push([t.time!, t.close!, t.percent!])
    }
    
    const xAxisData = getTradingPeriod(intervalToTradingMap[interval] ?? 'intraDay', dataset[0] ? dataset[0][0] : '')

    const style = colorUtil.hexToRGB(getStockColor(lastPercent >= 0, 'hex'))!

    chartRef.current?.setOption({
      axisPointer: {
        label: {
          formatter: (params: any) => {
            if (params.axisDimension !== 'y') return ''

            const v = Decimal.create(params.value)
            const perv = v.minus(prevClose).div(prevClose).mul(100)
            if (params.axisIndex === 0) {
              return `{${perv.gte(0) ? 'u' : 'd'}|${v.toFixed(2)}}`
            }
            return `{${perv.gte(0) ? 'u' : 'd'}|${perv.gte(0) ? '+' : ''}${perv.toFixed(2)}%}`
          }
        }
      },
      yAxis: [
        {
          axisLabel: {
            color: (v: number) => {
              return v >= prevClose ? stockUpColor : stockDownColor
            }
          },
        }, {
          axisLabel: {
            formatter: (v: number) => {
              const perv = Decimal.create(v).minus(prevClose).div(prevClose).mul(100)
              return `${perv.gte(0) ? '+' : ''}${perv.toFixed(2)}%`
            },
            color: (v: number) => {
              const perv = Decimal.create(v).minus(prevClose).div(prevClose).mul(100)
              return perv.gte(0) ? stockUpColor : stockDownColor
            }
          },
        }
      ],
      xAxis: {
        data: xAxisData
      },
      series: [{
        data: dataset,
        encode: {
          x: [0],
          y: [1]
        },
        color: `rgba(${style.r}, ${style.g}, ${style.b} , 1)`,
        areaStyle: {
          color: {
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: `rgba(${style.r}, ${style.g}, ${style.b}, .35)` // 0% 处的颜色
            }, {
              offset: .6, color: `rgba(${style.r}, ${style.g}, ${style.b}, .2)` // 100% 处的颜色
            }, {
              offset: 1, color: 'transparent' // 100% 处的颜色
            }]
          }
        },
        markLine: {
          symbol: 'none',
          silent: true,
          data: [{
            yAxis: prevClose,
            lineStyle: {
              color: '#999999',
              width: 1,
              type: 'dashed'
            },
            label: {
              show: false
            }
          }]
        }
      }, {
        data: dataset,
        encode: {
          x: [0],
          y: [1]
        }
      }]
    })
  }


  const options: ECOption = {
    grid: {
      left: 50,
      right: 50,
      top: '15',
      bottom: 24,
    },
    tooltip: {
      trigger: 'axis',
      showContent: false,
      axisPointer: {
        animation: false,
        type: 'cross',
        label: {
          precision: 2
        }
      }
    },
    xAxis: {
      type: 'category',
      data: [],

      splitLine: {
        show: true,
        lineStyle: {
          color: '#202020',
          type: 'dashed'
        }
      },
      axisLine: {
        lineStyle: {
          color: '#202020'
        }
      },
      axisPointer: {
        label: {
          show: false
        }
      },
      axisLabel: {
        interval(index) {
          return index % 15 === 0
        },
        showMinLabel: true,
        formatter: (value, index) => {
          return index % 30 === 0 ? dayjs(value).format('HH:mm') : ''
        },
        color: '#999999',
        fontSize: 10
      }
    },
    axisPointer: {
      link: [{ yAxisIndex: 'all', xAxisIndex: 'all' }],
      label: {
        position: 'right',
        backgroundColor: '#777',
        color: '#fff',
        padding: [0, 0, 0, 0],
        borderRadius: 4,
        fontSize: 10,
        rich: {
          u: {
            backgroundColor: stockUpColor,
            width: '100%',
            color: '#fff',
            padding: [2, 4, 2, 4],
            borderRadius: 4
          },
          d: {
            backgroundColor: stockDownColor,
            width: '100%',
            color: '#fff',
            padding: [2, 4, 2, 4],
            borderRadius: 4
          }
        }
      }
    },
    yAxis: [
      {
        splitNumber: 8,
        scale: true,
        axisLine: {
          show: true,
          lineStyle: {
            color: '#202020',
            type: 'dashed'
          }
        },
        splitLine: {
          show: true,
          lineStyle: {
            color: '#202020',
            type: 'dashed'
          }
        },
        axisLabel: {
          formatter: (v: number) => v <= -9999 ? '-' : v.toFixed(2),
          color: stockUpColor,
          fontSize: 10
        }
      }, {
        splitNumber: 8,
        position: 'right',
        scale: true,
        axisLine: {
          show: true,
          lineStyle: {
            color: '#202020',
            type: 'dashed'
          }
        },
        splitLine: {
          show: false,
        },
        axisLabel: {
          formatter: (v: number) => {
            return v <= -9999 ? '-' : v.toFixed(2)
          },
          color: stockUpColor,
          fontSize: 10
        }
      },
    ],
    series: [{
      type: 'line',
      color: stockUpColor,
      lineStyle: { width: 1 },
      symbol: 'none',
    }, { type: 'line', yAxisIndex: 1, showSymbol: false, color: 'transparent' }]
  }

  useMount(() => {
    chartRef.current = echarts.init(chartDomRef.current)
    chartRef.current.setOption(options)
    renderChart(queryData.data)
  })

  useUnmount(() => {
    chartRef.current?.dispose()
  })

  const size = useSize(chartDomRef)

  useUpdateEffect(() => {
    chartRef.current?.resize()
  }, [size])

  return (
    <div ref={chartDomRef} className="w-full h-full">

    </div>
  )
}

export default LargeCap