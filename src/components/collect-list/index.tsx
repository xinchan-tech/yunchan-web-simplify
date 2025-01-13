import { type StockExtend, type StockRawRecord, getStockCollects } from "@/api"
import { AddCollect, CollectCapsuleTabs, JknIcon, NumSpan } from "@/components"
import { usePropValue, useStockQuoteSubscribe, useTableData } from "@/hooks"
import { useConfig, useTime } from "@/store"
import { getTradingPeriod } from "@/utils/date"
import echarts, { type ECOption } from "@/utils/echarts"
import { type Stock, type StockSubscribeHandler, stockUtils } from "@/utils/stock"
import { colorUtil } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import { useMount, useUnmount, useUpdateEffect } from "ahooks"
import Decimal from "decimal.js"
import { type PropsWithChildren, useCallback, useEffect, useRef, useState } from "react"
import { withSort } from "../jkn/jkn-icon/with-sort"

const extend: StockExtend[] = ['basic_index', 'day_basic', 'alarm_ai', 'alarm_all', 'total_share', 'financials', 'thumbs', 'stock_before', 'stock_after']

type TableDataType = {
  name: string
  code: string
  thumbs: string[]
  price?: number
  percent?: number
  subPrice?: number
  subPercent?: number
}

interface CollectListProps {
  onCollectChange?: (collect: string) => void
  visible: 'full' | 'half' | 'hide'
}

const SortSpan = withSort((props: PropsWithChildren) => <span>{props.children}</span>)

export const CollectList = (props: CollectListProps) => {
  const [collect, setCollect] = useState('1')
  const trading = useTime(s => s.getTrading())
  const [stockList, { setList, onSort }] = useTableData<TableDataType>([], 'code')

  const stocks = useQuery({
    queryKey: [getStockCollects.cacheKey, collect],
    refetchInterval: 60 * 1000,
    queryFn: () => getStockCollects({
      cate_id: +collect,
      extend,
      limit: 300
    })
  })

  useEffect(() => {
    if (!stocks.data) {
      setList([])
      return
    }

    const _stockList: TableDataType[] = stocks.data.items.map(stock => {
      // const [lastStock, beforeStock, afterStock] = stockUtils.toStockRecord(stock)
      const lastStock = stockUtils.toStock(stock.stock, { extend: stock.extend, symbol: stock.symbol, name: stock.name })
      const beforeStock = stock.extend?.stock_before ? stockUtils.toStock(stock.extend?.stock_before as StockRawRecord, { extend: stock.extend, symbol: stock.symbol, name: stock.name }): null
      const afterStock = stock.extend?.stock_after ? stockUtils.toStock(stock.extend?.stock_after as StockRawRecord, { extend: stock.extend, symbol: stock.symbol, name: stock.name }) : null

      const thumbs = lastStock?.thumbs ?? []

      const subStock: Stock | null = ['afterHours', 'close'].includes(trading) ? afterStock : beforeStock

      return {
        name: stock.name,
        code: stock.symbol,
        thumbs,
        price: lastStock?.close,
        percent: subStock ? stockUtils.getPercent(lastStock) : undefined,
        subPrice: subStock?.close,
        subPercent: subStock ? stockUtils.getPercent(subStock) : undefined,
      }
    })

    setList(_stockList)
  }, [stocks.data, trading, setList])


  useStockQuoteSubscribe(stocks.data?.items.map(v => v.symbol) ?? [])

  const [sort, setSort] = useState<{ field: string, sort: 'asc' | 'desc' | undefined }>({ field: '', sort: undefined })

  const _onSort = (field: string, sort: 'asc' | 'desc' | undefined) => {
    onSort(field as any, sort)
    setSort({ field, sort })
  }

  return (
    <div className="flex flex-col border border-solid border-border overflow-hidden h-full">
      <div className="flex w-full flex-nowrap justify-start flex-shrink-0 border-0 border-b border-solid border-border">
        <CollectCapsuleTabs onChange={setCollect} type="text" />
        <AddCollect>
          <JknIcon name="add" />
        </AddCollect>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col">
        <div className="border-0 border-b border-solid border-border flex text-xs py-1 px-1 ">
          <span className="flex-1">
            <SortSpan onSort={_onSort} field="code" sort={sort.field === 'code' ? sort.sort : undefined}>名称</SortSpan>
          </span>
          <span className="w-20 flex-shrink-0 text-right box-border pr-1">
            <SortSpan onSort={_onSort} field="price" sort={sort.field === 'price' ? sort.sort : undefined}>现价</SortSpan>
          </span>
          <span className="w-16 flex-shrink-0 text-right">
            <SortSpan onSort={_onSort} field="percent" sort={sort.field === 'percent' ? sort.sort : undefined}>涨跌幅%</SortSpan>
          </span>
        </div>
        <div className="flex-1 overflow-y-auto w-full">
          {
            stockList.map(stock => (
              <StockListItem key={stock.code} stock={stock} onCollectChange={props.onCollectChange}>
                {
                  props.visible === 'full' ? (
                    <StockChart data={stock.thumbs.filter(v => +v > 0) ?? []} type={(stock.percent ?? 0) >= 0 ? 'up' : 'down'} />
                  ) : null
                }
              </StockListItem>
            ))
          }
        </div>
      </div>
    </div>
  )
}

interface StockListItemProps {
  stock: TableDataType
  onCollectChange?: (collect: string) => void
}

const StockListItem = ({ stock, onCollectChange, children }: PropsWithChildren<StockListItemProps>) => {
  const trading = useTime(s => s.getTrading())
  const priceBlink = useConfig(s => s.setting.priceBlink)
  const lastValue = useRef(stock.price)
  const span = useRef<HTMLDivElement>(null)
  const priceBlinkTimer = useRef<number>()
  const [value, setValue] = usePropValue(stock.price)

  const updateHandler = useCallback<StockSubscribeHandler<'quote'>>((data) => {
    if(data.topic === stock.code){
      setValue(data.record.close)
    }
  }, [setValue, stock.code])
  
  useStockQuoteSubscribe([stock.code], updateHandler)

  useEffect(() => {
    if (priceBlink === '1') {

      if (!priceBlinkTimer.current) {

        if (lastValue.current === undefined || !value) return
        const randomDelay = Math.random() * 500

        priceBlinkTimer.current = window.setTimeout(() => {
          const blinkState = lastValue.current! < value! ? 'down' : 'up'
          lastValue.current = value
          span.current?.setAttribute('data-blink', blinkState)

          setTimeout(() => {
            span.current?.removeAttribute('data-blink')
            priceBlinkTimer.current = undefined
          }, 500)
        }, randomDelay)
      }
    }
  }, [value, priceBlink])


  return (
    <div
      key={stock.code}
      className="flex py-3 hover:bg-accent px-1 stock-blink-gradient w-full box-border"
      onClick={() => onCollectChange?.(stock.code)}
      onKeyDown={() => { }}
      ref={span}
    >
      <div className="flex-1 overflow-hidden">
        <div className="relative w-full overflow-hidden">
          <span className="text-sm">{stock.code}</span>
          <div className="text-xs text-tertiary w-full overflow-hidden text-ellipsis whitespace-nowrap">{stock.name}</div>
          {
            stock.thumbs.length > 0 ? (
              <div className="absolute left-12 bottom-0 top-0">
                {
                  children
                }
              </div>
            ) : null
          }
        </div>
      </div>
      <div className="w-38 text-xs">
        <div className="flex w-full items-center">
          <div className="w-20 flex-shrink-0 text-right box-border pr-1">
            {
              stock.price ? <NumSpan value={stock.price} isPositive={(stock.percent ?? 0) >= 0} /> : '--'
            }
          </div>
          <div className="w-16 flex-shrink-0 text-right">
            {
              stock.price ? <NumSpan className="py-0.5 w-16" block value={Decimal.create(stock.percent).mul(100)} percent decimal={2} isPositive={(stock.percent ?? 0) >= 0} /> : '--'
            }
          </div>
        </div>
        {
          trading !== 'intraDay' ? (
            <div className="text-right text-secondary mt-0.5 scale-90">
              {
                stock.subPrice ? (
                  <span>
                    <span>{Decimal.create(stock.subPrice).toFixed(3)}</span>&nbsp;&nbsp;
                    <span>{Decimal.create(stock.subPercent).mul(100).toFixed(2)}%</span>
                  </span>
                ) : '--'
              }
            </div>
          ) : null
        }
      </div>
    </div>
  )
}

interface StockChartProps {
  data: string[]
  type: 'up' | 'down'
}

const xAxisData = getTradingPeriod('intraDay')

const StockChart = (props: StockChartProps) => {
  const charts = useRef<echarts.ECharts>()
  const { getStockColor } = useConfig()
  const dom = useRef<HTMLDivElement>(null)
  const setChartAreaStyle = () => {
    const color = colorUtil.hexToRGB(getStockColor(props.type === 'up', 'hex'))!

    charts.current?.setOption({
      series: [{
        color: colorUtil.rgbaToString({ ...color, a: 1 }),
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0, color: colorUtil.rgbaToString({ ...color, a: .35 }) // 0% 处的颜色
            }, {
              offset: .7, color: colorUtil.rgbaToString({ ...color, a: .2 }) // 100% 处的颜色
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
      xAxis: {
        data: props.data.length < 20 ? xAxisData.slice(0, 20) : xAxisData.slice(0, props.data.length)
      },
      series: [{
        data: props.data
      }]
    })
    setChartAreaStyle()
  })

  useUpdateEffect(() => {
    charts.current?.setOption({
      xAxis: {
        data: props.data.length < 20 ? xAxisData.slice(0, 20) : xAxisData.slice(0, props.data.length)
      },
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
    <div className="h-full w-[120px]" ref={dom} />
  )
}