import { getLargeCapIndexes, getStockCollects, type StockExtend } from "@/api"
import { AddCollect, CollectCapsuleTabs, JknIcon, NumSpan, ScrollArea } from "@/components"
import { useConfig } from "@/store"
import { getTradingPeriod } from "@/utils/date"
import echarts, { type ECOption } from "@/utils/echarts"
import { stockManager } from "@/utils/stock"
import { colorUtil } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import { useMount, useUnmount, useUpdateEffect } from "ahooks"
import Decimal from "decimal.js"
import { useRef, useState } from "react"

const extend: StockExtend[] = ['basic_index', 'day_basic', 'alarm_ai', 'alarm_all', 'total_share', 'financials', 'thumbs', 'stock_before', 'stock_after']

type TableDataType = {
  name: string
  code: string
  thumbs: string[]
  price?: number
  percent?: number
  afterPrice?: number
  afterPercent?: number
}


interface CollectListProps {
  onCollectChange?: (collect: string) => void
}

export const CollectList = (props: CollectListProps) => {
  const [collect, setCollect] = useState('1')
  const stocks = useQuery({
    queryKey: [getStockCollects.cacheKey, collect],
    refetchInterval: 60 * 1000,
    queryFn: () => getStockCollects({
      cate_id: +collect,
      extend,
      limit: 300
    })
  })

  const stockList = (() => {
    const r: TableDataType[] = []

    if (!stocks.data) return r

    for (const s of stocks.data.items) {
      const [lastStock, _, afterStock] = stockManager.toStockRecord(s)

      r.push({
        name: s.name,
        code: s.symbol,
        price: lastStock?.close,
        percent: lastStock?.percent,
        thumbs: lastStock?.thumbs ?? [],
        afterPercent: afterStock?.percent,
        afterPrice: afterStock?.close
      })
    }

    return r
  })()


  return (
    <div className="flex flex-col border border-solid border-border h-full overflow-hidden">
      <div className="flex w-full flex-nowrap justify-start flex-shrink-0 border-0 border-b border-solid border-border">
        <CollectCapsuleTabs onChange={setCollect} type="text" />
        <AddCollect>
          <JknIcon name="add" />
        </AddCollect>
      </div>
      <div className="flex-1 overflow-hidden">
        <div className="border-0 border-b border-solid border-border flex text-xs py-1 px-1 ">
          <span className="flex-1">名称</span>
          <span className="w-24 flex-shrink-0 text-right box-border pr-1">现价</span>
          <span className="w-16 flex-shrink-0 text-right">涨跌幅%</span>
        </div>
        <ScrollArea className="h-[calc(100%-1.5rem)]">
          {
            stockList.map(stock => (
              <div
                key={stock.code}
                className="flex py-3 hover:bg-accent px-1"
                onClick={() => props.onCollectChange?.(stock.code)}
                onKeyDown={() => { }}
              >
                <div className="flex-1">
                  <div className="relative">
                    <span className="text-sm">{stock.code}</span>
                    <div className="text-xs text-tertiary">{stock.name}</div>
                    {
                      stock.thumbs.length > 0 ? (
                        <div className="absolute left-12 bottom-0 top-0">
                          <StockChart data={stock.thumbs.filter(v => +v > 0) ?? []} type={(stock.percent ?? 0) >= 0 ? 'up' : 'down'} />
                        </div>
                      ) : null
                    }
                  </div>
                </div>
                <div className="w-40 text-xs">
                  <div className="flex w-full items-center">
                    <div className="w-24 flex-shrink-0 text-right box-border pr-1">
                      {
                        stock.price ? <NumSpan value={stock.price} isPositive={(stock.percent ?? 0) >= 0} /> : '--'
                      }
                    </div>
                    <div className="w-16 flex-shrink-0 text-right">
                      {
                        stock.percent ? <NumSpan className="py-0.5 w-16" block value={stock.percent * 100} percent decimal={2} isPositive={stock.percent >= 0} /> : '--'
                      }
                    </div>
                  </div>
                  <div className="text-right text-secondary mt-0.5 scale-90">
                    {
                      stock.afterPrice ? (
                        <span>
                          <span>{Decimal.create(stock.afterPrice).toFixed(3)}</span>&nbsp;&nbsp;
                          <span>{Decimal.create(stock.afterPercent).mul(100).toFixed(2)}%</span>
                        </span>
                      ) : '--'
                    }
                  </div>
                </div>
              </div>
            ))
          }
        </ScrollArea>
      </div>
    </div>
  )
}

interface StockChartProps {
  data: string[]
  type: 'up' | 'down'
}

// const xAxisData = getTradingPeriod('intraDay')

const StockChart = (props: StockChartProps) => {
  const charts = useRef<echarts.ECharts>()
  const { getStockColor } = useConfig()
  const dom = useRef<HTMLDivElement>(null)
  const setChartAreaStyle = () => {
    const color = colorUtil.hexToRGB(getStockColor(props.type === 'up', 'hex'))!
 
    charts.current?.setOption({
      series: [{
        color: colorUtil.rgbaToString({...color, a: 1}),
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: colorUtil.rgbaToString({...color, a: .35}) // 0% 处的颜色
            }, {
              offset: .7, color: colorUtil.rgbaToString({...color, a: .2}) // 100% 处的颜色
            }, {
              offset: 1, color: 'transparent' // 100% 处的颜色
            }]
          }
        }
      }]
    })
  }


  const options: ECOption = {
    grid: {
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
    },
    xAxis: {
      type: 'category',
      // type: 'category',
      // data: xAxisData,
      show: false
    },
    yAxis: {
      type: 'value',
      scale: true,
      show: false
    },
    series: [{
      type: 'line', data: [], symbol: 'none'
    }]
  }

  useMount(() => {
    charts.current = echarts.init(dom.current)
    charts.current.setOption(options)
    charts.current.setOption({
      // xAxis: {
      //   data: calcXAxisData(props.data)
      // },
      series: [{
        data: props.data
      }]
    })
    setChartAreaStyle()
  })

  useUpdateEffect(() => {
    charts.current?.setOption({
      // xAxis: {
      //   data: calcXAxisData(props.data)
      // },
      series: [{
        data: props.data
      }]
    })
    setChartAreaStyle()
  }, [props.data])

  useUnmount(() => {
    charts.current?.clear()
    charts.current?.dispose()
  })
  return (
    <div className="h-full w-[120px]" ref={dom}>

    </div>
  )
}