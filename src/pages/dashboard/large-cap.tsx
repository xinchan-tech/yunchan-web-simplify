import { StockChartInterval, getLargeCapIndexes, getStockChart } from "@/api"
import StockDownIcon from '@/assets/icon/stock_down.png'
import StockUpIcon from '@/assets/icon/stock_up.png'
import { cn } from "@/utils/style"
import { useMount, useRequest, useSize, useUnmount, useUpdateEffect } from "ahooks"
import clsx from "clsx"
import { Decimal } from "decimal.js"
import { useMemo, useRef, useState } from "react"
import CapsuleTabs from "./components/capsule-tabs"
import { getStockChartCategory } from "./lib/category"
import echarts, { type ECOption } from "@/utils/echarts"
import { type Stock, StockRecord, type StockTrading, useStock, useTime } from "@/store"
import dayjs from "dayjs"
import { useTranslation } from "react-i18next"
import { numToFixed } from "@/utils/price"

const LargeCap = () => {
  const [activeKey, setActiveKey] = useState<string>()
  const [activeStock, setActiveStock] = useState<string>()
  const [stockType, setStockType] = useState<StockChartInterval>(StockChartInterval.INTRA_DAY)
  const stock = useStock()
  const largeCap = useRequest(getLargeCapIndexes, {
    cacheKey: 'largeCap',
    onSuccess: (data) => {
      if (!activeKey) {
        setActiveKey(data[0].category_name)
        setActiveStock(data[0].stocks[0].symbol)
      }
      for (const st of data) {
        for (const s of st.stocks) {
          //盘中最后一笔时间，补齐分钟和秒
          s.stock[0] = dayjs(s.stock[0]).hour(15).minute(59).second(0).format('YYYY-MM-DD HH:mm:ss')
          stock.insertRaw(s.symbol, s.stock)
        }
      }
    }
  })

  getStockChartCategory(StockChartInterval.INTRA_DAY)

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

    const codes = largeCap.data?.find(item => item.category_name === activeKey)?.stocks.map(item => [item.symbol, item.name]) ?? []

    const r = []

    for (const [code, name] of codes) {
      r.push({
        name,
        code,
        stock: stock.getLastRecord(code)
      })
    }

    return r
  }, [activeKey, largeCap.data, stock])

  return (
    <div className="h-full flex flex-col">
      <div className="bg-secondary py-1.5 border-style-primary px-2 h-[34px] box-border">
        <CapsuleTabs activeKey={activeKey} onChange={setActiveKey}>
          {
            tabs?.map(item => <CapsuleTabs.Tab key={item.key} value={item.key} label={item.label} />)
          }
        </CapsuleTabs>
      </div>
      <div className="flex bg-secondary p-1.5 border-style-primary justify-between space-x-2 h-[100px] box-border">
        {
          list.map(item => (
            <div
              key={item.name}
              className={cn(
                'border-style-primary  flex-1 hover:bg-hover text-center py-2 cursor-pointer transition-all duration-300',
                {
                  'bg-active': activeStock === item.code
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
                <div className="">{numToFixed(item.stock?.percent ?? 0 * 100)}%</div>
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
              <CapsuleTabs activeKey={stockType.toString()} onChange={(value) => setStockType(value as unknown as StockChartInterval)}>
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


/**
 * 盘中时间偏移量，9:30:00 - 16:59:00
 * 单位为秒
 */
const timeInOffset = dayjs().hour(16).minute(0).second(0).diff(dayjs().hour(9).minute(30).second(0), 'second')

interface LargeCapChartProps {
  code?: string
  type: StockChartInterval
}

const LargeCapChart = ({ code, type }: LargeCapChartProps) => {
  const stock = useStock()
  const chartRef = useRef<echarts.ECharts>()
  const chartDomRef = useRef<HTMLDivElement>(null)
  const time = useTime()

  const chart = useRequest(getStockChart, {
    manual: true, onSuccess: (data) => {
      if (code) {
        for (const d of data.history) {
          stock.insertRaw(code, d)
        }
      }
    }
  })

  useUpdateEffect(() => {
    chartRef.current?.setOption({
      xAxis: {
        data: getStockChartCategory(type),
      }
    })
  }, [type])

  const getTrading = (t: StockChartInterval) => {
    switch (t) {
      case StockChartInterval.INTRA_DAY:
        return 'intraDay'
      case StockChartInterval.PRE_MARKET:
        return 'preMarket'
      case StockChartInterval.AFTER_HOURS:
        return 'afterHours'
      default:
        return 'intraDay'
    }
  }

  useUpdateEffect(() => {
    const stockRecords = code ? stock.getLastRecords(code, time.getTrading()) : undefined

    setChartData(stockRecords)

    // if (currentStock) {
    //   const trading = getTrading(type)
    //   const stockRecord = currentStock.getLastRecord(trading)
    //   setChartAreaStyle(stockRecord ? stockRecord.close >= stockRecord.prevClose ? 'up' : 'down' : 'up')
    // }

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
    let minPercent = 0
    let maxPercent = 0

    const dataset: (string | number)[][] = []

    for (const s of records) {
      dataset.push([dayjs(s.time).valueOf(), s.close, s.percent])
      prevClose = s.prevClose
      maxPercent = Math.max(maxPercent, s.percent)
      minPercent = Math.min(minPercent, s.percent)
    }

    console.log(JSON.stringify(dataset), records)

    const rightYMax = maxPercent + 0.002
    const rightYMin = minPercent - 0.002
    const leftYMax = prevClose * (1 + Math.abs(rightYMax))
    const leftYMin = prevClose * (1 - Math.abs(rightYMin))

    chartRef.current?.setOption({
      yAxis: [
        {
          interval: (leftYMax - leftYMin) / 8,
          min: leftYMin,
          max: leftYMax,
          axisLabel: {
            color: (v: number) => {
              return v >= prevClose ? '#00ab43' : '#ff1e3a'
            }
          }
        }, {
          interval: (rightYMax - rightYMin) / 8,
          min: rightYMin,
          max: rightYMax,
          axisLabel: {
            color: (v: number) => {
              return v >= 0 ? '#00ab43' : '#ff1e3a'
            }
          }
        }
      ],
      xAxis: {
        max: dayjs(dataset[0]?.[0]).add(timeInOffset, 'second').valueOf()
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
      }]
    })
  }

  useUpdateEffect(() => {
    if (!code) return

    const params: Parameters<typeof getStockChart>[0] = {
      ticker: code,
      interval: type
    }

    chart.run(params)
  }, [code, type])

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
      type: 'value',
      min: 'dataMin',
      max: 'dataMax',
      interval: 30 * 60 * 1000,
      // data: getStockChartCategory(StockChartInterval.IN),
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
        max: -9999,
        min: -10000,
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
        max: -9999,
        min: -10000,
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
        alignTicks: true,
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
    }, { type: 'line', yAxisIndex: 1 }]
  }

  useMount(() => {
    chartRef.current = echarts.init(chartDomRef.current)
    chartRef.current.setOption(options)
    setChartData()
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