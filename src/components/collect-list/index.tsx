import { getStockCollects, type StockExtend } from "@/api"
import { AddCollect, CollectCapsuleTabs, JknIcon, NumSpan, ScrollArea } from "@/components"
import { useConfig, useTime } from "@/store"
import { getTradingPeriod } from "@/utils/date"
import echarts, { type ECOption } from "@/utils/echarts"
import { StockSubscribeHandler, stockUtils, type StockRecord } from "@/utils/stock"
import { colorUtil } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import { useMount, useUnmount, useUpdateEffect } from "ahooks"
import Decimal from "decimal.js"
import { type PropsWithChildren, useCallback, useEffect, useRef, useState } from "react"
import { withSort } from "../jkn/jkn-icon/with-sort"
import { useStockQuoteSubscribe, useTableData } from "@/hooks"

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
}

const SortSpan = withSort((props: PropsWithChildren) => <span>{props.children}</span>)

export const CollectList = (props: CollectListProps) => {
  const [collect, setCollect] = useState('1')
  const trading = useTime(s => s.getTrading())
  const [stockList, {setList, updateList, onSort}] = useTableData<TableDataType>([], 'code')

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
      const [lastStock, beforeStock, afterStock] = stockUtils.toStockRecord(stock)
      const thumbs = lastStock?.thumbs ?? []
      const subStock: StockRecord | null = ['afterHours', 'close'].includes(trading) ? afterStock : beforeStock

      return {
        name: stock.name,
        code: stock.symbol,
        thumbs,
        price: lastStock?.close,
        percent: lastStock?.percent,
        subPrice: subStock?.close,
        subPercent: subStock?.percent,
      }
    })

    setList(_stockList)
  }, [stocks.data, trading, setList])

  const stockSubscribeHandler = useCallback<StockSubscribeHandler<'quote'>>((e) => {
    updateList((list) => {
      const _list = list.map(stock => {
        if (stock.code === e.topic) {
          const _stock = { ...stock }
          _stock.price = e.record.close
          _stock.percent = ( e.record.close - e.record.preClose) / e.record.preClose
          return _stock
        }
        return stock
      })
      return _list
    })
  }, [updateList])

  useStockQuoteSubscribe(stocks.data?.items.map(v => v.symbol) ?? [], stockSubscribeHandler)

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
          <span className="w-24 flex-shrink-0 text-right box-border pr-1">
            <SortSpan onSort={_onSort} field="price" sort={sort.field === 'price' ? sort.sort : undefined}>现价</SortSpan>
          </span>
          <span className="w-16 flex-shrink-0 text-right">
            <SortSpan onSort={_onSort} field="percent" sort={sort.field === 'percent' ? sort.sort : undefined}>涨跌幅%</SortSpan>
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
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
            ))
          }
        </div>
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