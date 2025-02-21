import { StockChartInterval, getLargeCapIndexes, getStockChartQuote } from '@/api'
import { CapsuleTabs, JknIcon, SubscribeSpan } from '@/components'
import { useStockQuoteSubscribe } from '@/hooks'
import { useConfig, useTime } from '@/store'
import { getTradingPeriod } from '@/utils/date'
import echarts, { type ECOption } from '@/utils/echarts'
import { type StockTrading, stockUtils } from '@/utils/stock'
import { cn, colorUtil } from '@/utils/style'
import { useQuery } from '@tanstack/react-query'
import { useMount, useSize, useUnmount, useUpdateEffect } from 'ahooks'
import clsx from 'clsx'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'

const tradingToIntervalMap: Record<StockTrading, StockChartInterval> = {
  intraDay: StockChartInterval.INTRA_DAY,
  preMarket: StockChartInterval.PRE_MARKET,
  afterHours: StockChartInterval.AFTER_HOURS,
  close: StockChartInterval.AFTER_HOURS
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
  [StockChartInterval.WEEK]: 'intraDay'
}

const LargeCap = () => {
  const [activeStock, setActiveStock] = useState<string>()
  const time = useTime()

  const [stockType, setStockType] = useState<StockChartInterval>(
    tradingToIntervalMap[time.getTrading() as StockTrading]
  )
  const largeCap = useQuery({
    queryKey: [getLargeCapIndexes.cacheKey],
    queryFn: () => getLargeCapIndexes()
  })

  const stocks = useMemo(() => {
    if (!largeCap.data) {
      return []
    }

    const r = []

    for (const item of largeCap.data) {
      for (const stock of item.stocks) {
        r.push(stockUtils.toStock(stock.stock, { symbol: stock.symbol, name: stock.name }))
      }
    }

    return r
  }, [largeCap.data])

  useStockQuoteSubscribe(stocks.map(o => o.symbol) ?? [])

  useEffect(() => {
    if (largeCap.data) {
      setActiveStock(largeCap.data[1].stocks[0].symbol)
    }
  }, [largeCap.data])

  const navigate = useNavigate()
  const onChartDoubleClick = useCallback(() => {
    navigate(`/stock/trading?symbol=${activeStock}`)
  }, [activeStock, navigate])

  // const tabs = useMemo(() => {
  //   return largeCap.data?.map(item => ({
  //     key: item.category_name,
  //     label: item.category_name
  //   }))
  // }, [largeCap.data])

  const { t } = useTranslation()

  const activeKey = useMemo(() => {
    if (!largeCap.data) {
      return '指数ETF'
    }

    let r = '指数ETF'

    for (const item of largeCap.data) {
      for (const stock of item.stocks) {
        if (stock.symbol === activeStock) {
          r = item.category_name
          break
        }
      }
    }

    return r
  }, [largeCap.data, activeStock])

  const onActiveStockChange = useCallback((s: string) => {
    setActiveStock(s)
    if (['SPX', 'IXIC', 'DJI'].includes(s)) {
      setStockType(StockChartInterval.INTRA_DAY)
    }

    const node = document.querySelector(`.large-cap-stock-select[data-stock-symbol="${s}"]`)

    if (node) {

      const parentElement = node.parentElement
      if (parentElement) {
        const width = parentElement.clientWidth
        node.parentElement.scrollTo({ behavior: 'smooth', left: (node as any).offsetLeft - width / 3 })
      }

    }
  }, [])

  const onNextStock = () => {
    if (activeStock) {
      const currentIndex = stocks.findIndex(stock => stock.symbol === activeStock)
      const nextIndex = (currentIndex + 1) % stocks.length
      onActiveStockChange(stocks[nextIndex].symbol)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center overflow-hidden flex-shrink-0 h-[63px] my-4 ml-4">
        <div className="flex-1 overflow-x-auto p-1.5 flex justify-between space-x-8 whitespace-nowrap">
          {/* <div className=""> */}
          {stocks.map(stock => (
            <div
              key={stock.name}
              data-stock-symbol={stock.symbol}
              className={cn(
                'large-cap-stock-select hover:bg-hover text-center py-1.5 px-3 box-border cursor-pointer transition-all duration-300 w-[190px] h-[51px] flex items-center flex-shrink-0 rounded-[300px]',
                {
                  'bg-accent': activeStock === stock.symbol
                }
              )}
              onClick={() => onActiveStockChange(stock.symbol)}
              onKeyDown={() => { }}
            >
              <JknIcon.Stock symbol={stock.symbol} />
              <div className="ml-3">
                <span className="text-sm">{stock.name}</span>
                <div className="flex items-center mt-1 text-xs space-x-2">
                  <SubscribeSpan.Price
                    initValue={stock.close}
                    symbol={stock.symbol}
                    initDirection={stockUtils.isUp(stock)}
                    decimal={3}
                    arrow
                  />
                  <SubscribeSpan.Percent
                    initValue={stockUtils.getPercent(stock)}
                    symbol={stock.symbol}
                    initDirection={stockUtils.isUp(stock)}
                    decimal={2}
                  />
                </div>
              </div>
            </div>
          ))}
          {/* </div> */}
        </div>
        <div className="bg-accent rounded-full w-10 h-10 flex items-center justify-center mx-4 cursor-pointer" onClick={onNextStock} onKeyDown={() => { }}>
          <JknIcon.Svg name="arrow-right" size={12} className="text-[#B8B8B8]" />
        </div>
      </div>
      <div className="flex-1 relative">
        <div onDoubleClick={onChartDoubleClick} className="w-full h-full p-2 box-border">
          <LargeCapChart code={activeStock} type={stockType} />
        </div>
        {activeKey !== '大盘指数' && (
          <div className="absolute bottom-6 left-12 border border-solid border-border rounded p-0.5">
            <CapsuleTabs
              type="text"
              activeKey={stockType.toString()}
              onChange={value => setStockType(+value as unknown as StockChartInterval)}
              activeColor="#DBDBDB"
            >
              <CapsuleTabs.Tab className={cn('rounded-sm py-1 text-tertiary leading-5', stockType === StockChartInterval.PRE_MARKET && '!bg-accent')} value={StockChartInterval.PRE_MARKET.toString()} label={t('stockChart.before')} />
              <CapsuleTabs.Tab className={cn('rounded-sm py-1 text-tertiary leading-5', stockType === StockChartInterval.INTRA_DAY && '!bg-accent')} value={StockChartInterval.INTRA_DAY.toString()} label={t('stockChart.in')} />
              <CapsuleTabs.Tab className={cn('rounded-sm py-1 text-tertiary leading-5', stockType === StockChartInterval.AFTER_HOURS && '!bg-accent')} value={StockChartInterval.AFTER_HOURS.toString()} label={t('stockChart.after')} />
            </CapsuleTabs>
          </div>
        )}
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
  const trading = useTime(s => s.getTrading())

  const interval = ((c, t) => {
    if (['SPX', 'IXIC', 'DJI'].includes(c!)) {
      return StockChartInterval.INTRA_DAY
    }
    return t
  })(code, type)

  const queryData = useQuery({
    queryKey: [getStockChartQuote.cacheKey, code, type],
    queryFn: () => getStockChartQuote(code!, type!),
    enabled: !!code && type !== undefined,
    refetchInterval: 60 * 1000,
    placeholderData: () => ({
      list: []
    })
  })

  const [stockData, setStockData] = useState<typeof queryData.data>(queryData.data)

  useUpdateEffect(() => {
    setStockData(queryData.data)
  }, [queryData.data])

  useEffect(() => {
    renderChart(stockData, trading)
  }, [stockData, trading])

  const renderChart = (data: typeof queryData.data, _trading: StockTrading) => {
    if (!data) return
    const dataset: [string, number, number][] = []
    let prevClose = 0
    let lastPercent = 0
    let lastPrice = 0
    for (const s of data.list) {
      const t = stockUtils.toStockWithExt(s)
      prevClose = t.prevClose!
      lastPercent = t.percent!
      lastPrice = t.close!
      dataset.push([dayjs(t.timestamp).tz('America/New_York').format('YYYY-MM-DD HH:mm:ss'), t.close!, t.percent!])
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
          }
        },
        {
          axisLabel: {
            formatter: (v: number) => {
              const perv = Decimal.create(v).minus(prevClose).div(prevClose).mul(100)
              return `${perv.gte(0) ? '+' : ''}${perv.toFixed(2)}%`
            },
            color: (v: number) => {
              const perv = Decimal.create(v).minus(prevClose).div(prevClose).mul(100)
              return perv.gte(0) ? stockUpColor : stockDownColor
            }
          }
        }
      ],
      xAxis: {
        data: xAxisData
      },
      graphic: {
        elements: [
          {
            type: 'text',
            left: 'center',
            top: '30%',
            style: {
              text:
                interval === StockChartInterval.INTRA_DAY
                  ? ''
                  : interval === StockChartInterval.PRE_MARKET
                    ? '盘前交易'
                    : `${_trading === 'intraDay' ? '上一交易日\n    (盘后)' : '盘后交易'}`,
              fill: 'rgba(255, 255, 255, .15)',
              fontSize: 64,
              textVerticalAlign: 'top'
            }
          }
        ]
      },
      series: [
        {
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
              colorStops: [
                {
                  offset: 0,
                  color: `rgba(${style.r}, ${style.g}, ${style.b}, .35)` // 0% 处的颜色
                },
                {
                  offset: 0.6,
                  color: `rgba(${style.r}, ${style.g}, ${style.b}, .2)` // 100% 处的颜色
                },
                {
                  offset: 1,
                  color: 'transparent' // 100% 处的颜色
                }
              ]
            }
          },
          markLine: {
            symbol: 'none',
            silent: true,

            data: [
              {
                yAxis: lastPrice,
                lineStyle: {
                  color: `rgba(${style.r}, ${style.g}, ${style.b} , 1)`,
                  width: 1,
                  type: 'dashed'
                },
                label: {
                  position: 'start',
                  formatter: `{${lastPercent > 0 ? 'u' : 'd'}|${lastPrice.toFixed(2)}}`,
                  rich: {
                    u: {
                      backgroundColor: stockUpColor,
                      width: '100%',
                      color: '#fff',
                      padding: 3,
                      fontSize: 10,
                      // borderRadius: 4
                    },
                    d: {
                      backgroundColor: stockDownColor,
                      width: '100%',
                      color: '#fff',
                      fontSize: 10,
                      padding: 3,
                      // borderRadius: 4
                    }
                  }
                }
              },
              {
                yAxis: lastPrice,
                lineStyle: {
                  color: `rgba(${style.r}, ${style.g}, ${style.b} , 1)`,
                  width: 1,
                  type: 'dashed'
                },
                label: {
                  formatter: `{${lastPercent > 0 ? 'u' : 'd'}|${lastPercent > 0 ? '+' : ''}${(lastPercent * 100).toFixed(2)}%}`,
                  rich: {
                    u: {
                      backgroundColor: stockUpColor,
                      width: '100%',
                      color: '#fff',
                      padding: 3,
                      fontSize: 10,
                      // borderRadius: 2
                    },
                    d: {
                      backgroundColor: stockDownColor,
                      width: '100%',
                      color: '#fff',
                      padding: 3,
                      fontSize: 10,
                      // borderRadius: 2
                    }
                  }
                }
              }
            ]
          }
        },
        {
          data: dataset,
          encode: {
            x: [0],
            y: [1]
          }
        }
      ]
    })
  }

  const options: ECOption = {
    grid: {
      left: 50,
      right: 50,
      top: '15',
      bottom: 24
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
        show: false,
        lineStyle: {
          color: '#202020',
          type: 'dashed'
        }
      },
      axisLine: {
        show: false,
        lineStyle: {
          color: '#202020'
        }
      },
      axisPointer: {
        lineStyle: {
          color: '#404040',
          type: 'dashed'
        },
        label: {
          show: false
        }
      },
      axisLabel: {
        interval(index) {
          return index % 30 === 0
        },
        showMinLabel: true,
        formatter: (value, index) => {
          return index % 60 === 0 ? dayjs(value).format('HH:mm') : ''
        },
        color: '#999999',
        fontSize: 10
      }
    },
    axisPointer: {
      link: [{ yAxisIndex: 'all', xAxisIndex: 'all' }],
      lineStyle: {
        color: '#404040',
        type: 'dashed'
      },
      label: {
        position: 'right',
        backgroundColor: '#777',
        color: '#fff',
        padding: 0,
        // borderRadius: 4,
        fontSize: 10,
        rich: {
          u: {
            backgroundColor: stockUpColor,
            width: '100%',
            color: '#fff',
            padding: [2, 4, 2, 4],
            // borderRadius: 4
          },
          d: {
            backgroundColor: stockDownColor,
            width: '100%',
            color: '#fff',
            padding: [2, 4, 2, 4],
            // borderRadius: 4
          }
        }
      }
    },
    yAxis: [
      {
        splitNumber: 8,
        scale: true,
        axisLine: {
          show: false,
          lineStyle: {
            color: '#202020',
            type: 'dashed'
          }
        },
        axisPointer: {
          lineStyle: {
            color: '#404040',
            type: 'dashed'
          }
        },
        splitLine: {
          show: false,
          lineStyle: {
            color: '#202020',
            type: 'dashed'
          }
        },
        axisLabel: {
          formatter: (v: number) => (v <= -9999 ? '-' : v.toFixed(2)),
          color: stockUpColor,
          fontSize: 10
        }
      },
      {
        splitNumber: 8,
        position: 'right',
        scale: true,
        axisPointer: {
          lineStyle: {
            color: '#404040',
            type: 'dashed'
          }
        },
        axisLine: {
          show: false,
          lineStyle: {
            color: '#202020',
            type: 'dashed'
          }
        },
        splitLine: {
          show: false
        },
        axisLabel: {
          formatter: (v: number) => {
            return v <= -9999 ? '-' : v.toFixed(2)
          },
          color: stockUpColor,
          fontSize: 10
        }
      }
    ],
    series: [
      {
        type: 'line',
        color: stockUpColor,
        lineStyle: { width: 1 },
        symbol: 'none',
        markLine: {
          symbol: 'none',
          silent: true
        }
      },
      { type: 'line', yAxisIndex: 1, showSymbol: false, color: 'transparent' }
    ]
  }

  useMount(() => {
    chartRef.current = echarts.init(chartDomRef.current)
    chartRef.current.setOption(options)
    renderChart(stockData, trading)
  })

  useUnmount(() => {
    chartRef.current?.dispose()
    chartRef.current = undefined
  })

  const size = useSize(chartDomRef)

  useUpdateEffect(() => {
    chartRef.current?.resize()
  }, [size])

  return <div ref={chartDomRef} className="w-full h-full" />
}

export default LargeCap
