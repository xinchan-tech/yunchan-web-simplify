import { StockChartInterval, type StockRawRecord, getLargeCapIndexes, getStockChart } from "@/api"
import StockDownIcon from '@/assets/icon/stock_down.png'
import StockUpIcon from '@/assets/icon/stock_up.png'
import { CapsuleTabs } from "@/components"
import { StockRecord, type StockTrading, useStock, useTime } from "@/store"
import { getTradingPeriod } from "@/utils/date"
import echarts, { type ECOption } from "@/utils/echarts"
import { numToFixed } from "@/utils/price"
import { cn } from "@/utils/style"
import { wsManager } from "@/utils/ws"
import { useQuery } from "@tanstack/react-query"
import { useMount, useSize, useUnmount, useUpdateEffect } from "ahooks"
import clsx from "clsx"
import dayjs from "dayjs"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

const tradingToIntervalMap: Record<StockTrading, StockChartInterval> = {
  intraDay: StockChartInterval.INTRA_DAY,
  preMarket: StockChartInterval.PRE_MARKET,
  afterHours: StockChartInterval.AFTER_HOURS,
  close: StockChartInterval.AFTER_HOURS,
}

const intervalToTradingMap: Record<StockChartInterval, StockTrading> = {
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

  const [stockType, setStockType] = useState<StockChartInterval>(tradingToIntervalMap[time.getTrading()])
  const largeCap = useQuery({
    queryKey: [getLargeCapIndexes.cacheKey],
    queryFn: () => getLargeCapIndexes(),
  })

  useEffect(() => {
    if(largeCap.data){
      setActiveKey(largeCap.data[1].category_name)
      setActiveStock(largeCap.data[1].stocks[0].symbol)

      for (const d of largeCap.data) {
        wsManager.subscribe(d.stocks.map(item => item.symbol))
      }
    }
  }, [largeCap.data])

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

  const list = useMemo(() => {
    if (!activeKey) return []

    const codes = largeCap.data?.find(item => item.category_name === activeKey)?.stocks.map(item => [item.symbol, item.name, item.stock]) ?? []

    const r = []

    for (const [code, name, stock] of codes) {
      r.push({
        name: name as string,
        code: code as string,
        stock: new StockRecord(stock as StockRawRecord)
      })
    }

    return r
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
          list.map(item => (
            <div
              key={item.name}
              className={cn(
                'border-style-primary  flex-1 hover:bg-hover text-center py-2 cursor-pointer transition-all duration-300',
                {
                  'bg-accent': activeStock === item.code
                }
              )}
              onClick={() => onActiveStockChange(item.code)}
              onKeyDown={() => { }}
            >
              <div className="text-center"><span>{item.name}</span></div>
              <div
                className={clsx(
                  'font-black text-[15px]',
                  (item.stock?.percent ?? 0) >= 0 ? 'text-stock-up' : 'text-stock-down'
                )}>
                <div className="flex items-center justify-center mt-1">
                  {numToFixed(item.stock?.close ?? 0)}
                  <img className="w-5" src={(item.stock?.percent ?? 0) >= 0 ? StockUpIcon : StockDownIcon} alt="" />
                </div>
                <div className="">{numToFixed((item.stock?.percent ?? 0) * 100, 2)}%</div>
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
  const stock = useStock() 
  const chartRef = useRef<echarts.ECharts>()
  const chartDomRef = useRef<HTMLDivElement>(null)
  useQuery({
    queryKey: [getStockChart.cacheKey, code, type],
    queryFn: () => getStockChart({ticker: code!, interval: ((c, t) => {
      
      if (['SPX', 'IXIC', 'DJI'].includes(c!)) {
        return StockChartInterval.INTRA_DAY
      }
      return t
    })(code, type)}),
    enabled: !!code && type !== undefined,
    refetchInterval: 60 * 1000,
  })


  useUpdateEffect(() => {
    chartRef.current?.setOption({
      xAxis: {
        data: getTradingPeriod(intervalToTradingMap[type]),
      }
    })
  }, [type])

  const getTrading = (t: StockChartInterval): StockTrading => {
    switch (t) {
      case StockChartInterval.PRE_MARKET:
        return 'preMarket'
      case StockChartInterval.AFTER_HOURS:
        return 'afterHours'
      default:
        return 'intraDay'
    }
  }

  const _getTrading = () => {
    let trading = getTrading(+type)
    if (code && ['SPX', 'IXIC', 'DJI'].includes(code)) {
      trading = 'intraDay'
    }
 
    return trading
  }

  useUpdateEffect(() => {
    const stockRecords = code ? stock.getLastRecords(code, _getTrading()) : undefined
    setChartData(stockRecords)

    if (!stockRecords || stockRecords.length === 0) {
      setChartAreaStyle('up')
    } else {
      const lastRecord = stockRecords[stockRecords.length - 1]
      setChartAreaStyle(lastRecord.percent > 0 ? 'up' : 'down')

    }

  }, [stock, type, code])

  const setChartAreaStyle = (type: 'down' | 'up') => {
    const style = type === 'up' ? '0, 171, 67' : '255, 30, 58'


    chartRef.current?.setOption({
      series: [{
        color: `rgb(${style})`,
        areaStyle: {
          color: {

            colorStops: [{
              offset: 0, color: `rgba(${style}, .35)` // 0% 处的颜色
            }, {
              offset: .6, color: `rgba(${style}, .2)` // 100% 处的颜色
            }, {
              offset: 1, color: 'transparent' // 100% 处的颜色
            }]
          }
        }
      }]
    })
  }

  const setChartData = (records?: StockRecord[]) => {
    if (!records) return
    let prevClose = 0

    const dataset: (string | number)[][] = []

    for (const s of records) {
      dataset.push([s.time, s.close, s.percent])
      prevClose = s.prevClose
    }

    const xAxisData = getTradingPeriod(_getTrading(), dataset[0]?.[0] as string)

    chartRef.current?.setOption({
      yAxis: [
        {
          axisLabel: {
            color: (v: number) => {
              return v >= prevClose ? '#00ab43' : '#ff1e3a'
            }
          }
        }, {
          axisLabel: {
            color: (v: number) => {
              return v >= 0 ? '#00ab43' : '#ff1e3a'
            }
          }
        }
      ],
      xAxis: {
        min: dayjs(xAxisData[0]).valueOf(),
        max: dayjs(xAxisData[xAxisData.length - 1]).valueOf()
      },
      series: [{
        data: dataset.map(item => [item[0], item[1]]),
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
        data: dataset.map(item => [item[0], item[2]])
      }]
    })
  }



  const options: ECOption = {
    grid: {
      left: '0',
      right: '0',
      top: '15',
      bottom: '0',
      containLabel: true
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
      type: 'time',
      minInterval: 30 * 60 * 1000,
      maxInterval: 30 * 60 * 1000,
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
        showMinLabel: true,
        formatter: (value, index) => {
          return index % 2 === 0 ? dayjs(value).format('HH:mm') : ''
        },
        color: '#999999',
        fontSize: 10
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
          color: '#00ab43',
          fontSize: 10
        },
        axisPointer: {

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
        // alignTicks: true,
        axisLabel: {
          formatter: (v: number) => v <= -9999 ? '-' : `${(v * 100).toFixed(2)}%`,
          color: '#00ab43',
          fontSize: 10
        },
        axisPointer: {
          label: {
            formatter: (v) => {
              return v.value ? `${(+v.value * 100).toFixed(2)}%` : ''
            },
          }
        }
      },
    ],
    series: [{
      type: 'line',
      color: '#00ab43',
      lineStyle: { width: 1 },
      symbol: 'none',
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: 'rgba(0, 167, 78, .35)' // 0% 处的颜色
          }, {
            offset: .6, color: 'rgba(0, 167, 78, .2)' // 100% 处的颜色
          }
            , {
            offset: 1, color: 'transparent' // 100% 处的颜色
          }],
          global: false
        }
      }
    }, { type: 'line', yAxisIndex: 1, showSymbol: false, color: 'transparent' }]
  }

  useMount(() => {
    chartRef.current = echarts.init(chartDomRef.current)
    chartRef.current.setOption(options)
    const stockRecords = code ? stock.getLastRecords(code, _getTrading()) : undefined
    setChartData(stockRecords)
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