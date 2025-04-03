import { StockChartInterval, getLargeCapIndexes, getStockChartQuote } from '@/api'
import { ChartTypes, JknChart, JknIcon, SubscribeSpan } from '@/components'
import { useSnapshotOnce, useStockBarSubscribe, useStockQuoteSubscribe } from '@/hooks'
import { useConfig, useTime } from '@/store'
import { type Stock, stockSubscribe, type StockTrading, stockUtils } from '@/utils/stock'
import { cn, colorUtil } from '@/utils/style'
import { useQuery } from '@tanstack/react-query'
import Decimal from 'decimal.js'
import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router'
import { ScrollContainer } from './components/scroll-container'

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

  const onPreStock = () => {
    if (activeStock) {
      const currentIndex = stocks.findIndex(stock => stock.symbol === activeStock)
      const nextIndex = (currentIndex - 1 + stocks.length) % stocks.length
      onActiveStockChange(stocks[nextIndex].symbol)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <ScrollContainer onNextStock={onNextStock} onPrevStock={onPreStock}>
        {/* <div className=""> */}
        {stocks.map(stock => (
          <StockBarItem key={stock.symbol} stock={stock} check={activeStock === stock.symbol} onActiveStockChange={onActiveStockChange} />
        ))}
      </ScrollContainer>

      <div className="flex-1 relative">
        <div onClick={onChartDoubleClick} onKeyDown={() => { }} className="w-full h-full box-border">
          <LargeCapChart code={activeStock} type={stockType} />
        </div>

      </div>
    </div>
  )
}

interface StockBarItemProps {
  stock: Stock
  check: boolean
  onActiveStockChange: (symbol: string) => void
}

const StockBarItem = ({ stock, check, onActiveStockChange }: StockBarItemProps) => {

  return (
    <div
      key={stock.name}
      data-stock-symbol={stock.symbol}
      className={cn(
        'large-cap-stock-select hover:bg-hover text-center py-3 px-3 box-border cursor-pointer transition-all duration-300 w-[220px] h-[57px] flex items-center flex-shrink-0 rounded-[300px]',
        {
          'bg-accent': check
        }
      )}
      onClick={() => onActiveStockChange(stock.symbol)}
      onKeyDown={() => { }}
    >
      <JknIcon.Stock symbol={stock.symbol} className="w-[28px] h-[28px]" />
      <div className="ml-3 flex flex-col">
        <span className="text-sm text-left">{stock.name}</span>
        <div className="flex items-center mt-1 space-x-2">
          <SubscribeSpan.Price
            trading={['SPX', 'IXIC', 'DJI'].includes(stock.symbol) ? 'intraDay' : ['preMarket', 'intraDay', 'afterHours']}
            initValue={stock.close}
            symbol={stock.symbol}
            initDirection={stockUtils.isUp(stock)}
            decimal={3}
            arrow
          />
          <SubscribeSpan.Percent
            className="text-sm"
            trading={['SPX', 'IXIC', 'DJI'].includes(stock.symbol) ? 'intraDay' : ['preMarket', 'intraDay', 'afterHours']}
            initValue={stockUtils.getPercent(stock)}
            symbol={stock.symbol}
            initDirection={stockUtils.isUp(stock)}
            decimal={2}
          />
        </div>
      </div>
    </div>
  )
}

interface LargeCapChartProps {
  code?: string
  type: StockChartInterval
}



const LargeCapChart = ({ code, type }: LargeCapChartProps) => {
  const chart = useRef<ComponentRef<typeof JknChart>>(null)

  useEffect(() => {
    const tick = stockUtils.getIndexTimeTick()
    const c = chart.current?.getChart()
    const splitId = 'split-indicator-large-cap'
    if ('IXIC' === code || 'DJI' === code || 'SPX' === code) {
      tick.pre = 0
      tick.after = 0
      tick.total = tick.pre + tick.post + tick.after
      c?.removeIndicator({
        id: splitId
      })
    } else {
      c?.createIndicator({
        name: 'split-indicator',
        id: splitId,
        calcParams: [[tick.pre / (tick.total), (tick.post + tick.pre) / (tick.total)]],
      }, true, {
        id: ChartTypes.MAIN_PANE_ID
      })
    }


    c?.setXAxisTick(tick.total)
    c?.setLeftMinVisibleBarCount(1)
    c?.setScrollEnabled(false)
    c?.setZoomEnabled(false)

    const upColor = useConfig.getState().getStockColor(true, 'hex')
    const downColor = useConfig.getState().getStockColor(false, 'hex')

    c?.setStyles({
      grid: {
        vertical: {
          show: false
        },
        horizontal: {
          show: false
        }
      },
      yAxis: {
        axisLine: {
          show: false
        }
      },
      xAxis: {
        tickText: {
          color: '#B8B8B8'
        },
        axisLine: {
          show: false
        }
      },
      candle: {
        type: 'area' as any,
        area: {
          lineColor: data => {
            const postData = data.slice(0, tick.pre + tick.post).pop()
            const lastData = data[data.length - 1]
            const lastColor = Decimal.create(lastData?.close).gt(lastData?.prevClose ?? 0) ? upColor : downColor

            const preColor = data.length > tick.pre ? '#50535E' : lastColor

            const afterColor = data.length >= tick.total ? '#50535E' : lastColor

            return [
              { type: 'segment', color: preColor, offset: tick.pre },
              { type: 'segment', color: Decimal.create(postData?.close).gt(postData?.prevClose ?? 0) ? upColor : downColor, offset: tick.post + tick.pre },
              { type: 'segment', color: afterColor },
            ]
          },
          backgroundColor(data) {
            const postData = data.slice(0, tick.pre + tick.post).pop()
            const lastData = data[data.length - 1]
            const lastColor = Decimal.create(lastData?.close).gt(lastData?.prevClose ?? 0) ? upColor : downColor

            const color = Decimal.create(postData?.close).gt(postData?.prevClose ?? 0) ? upColor : downColor

            const preColor = data.length > tick.pre ? '#DBDBDB' : lastColor
            const afterColor = data.length >= tick.total ? '#DBDBDB' : lastColor

            return [
              {
                type: 'segment', offset: tick.pre, color: [{
                  offset: 0,
                  color: colorUtil.rgbaToString(colorUtil.hexToRGBA(preColor, 0))
                }, {
                  offset: 1,
                  color: colorUtil.rgbaToString(colorUtil.hexToRGBA(preColor, 0.1))
                }]
              },
              {
                type: 'segment', offset: tick.pre + tick.post, color: [{
                  offset: 0,
                  color: colorUtil.rgbaToString(colorUtil.hexToRGBA(color, 0.0))
                }, {
                  offset: 1,
                  color: colorUtil.rgbaToString(colorUtil.hexToRGBA(color, 0.1))
                }]
              },
              {
                type: 'segment', color: [{
                  offset: 0,
                  color: colorUtil.rgbaToString(colorUtil.hexToRGBA(afterColor, 0.0))
                }, {
                  offset: 1,
                  color: colorUtil.rgbaToString(colorUtil.hexToRGBA(afterColor, 0.1))
                }]
              },
            ]
          },
        },
        tooltip: {
          custom: [],
          expand: false
        },
        priceMark: {
          last: {
            line: {
              type: 'full'
            },
            text: {

            },
            color(data) {
              const lastData = data.slice(-1)[0]
              return Decimal.create(lastData.close).gt(lastData.prevClose) ? colorUtil.rgbaToString(colorUtil.hexToRGBA(upColor, 1)) : colorUtil.rgbaToString(colorUtil.hexToRGBA(downColor, 1))
            },
          }
        }
      },


    })

    c?.setPaneOptions({
      id: ChartTypes.MAIN_PANE_ID,
      axis: {
        gap: {
          top: 0,
          bottom: 0
        }
      }
    })
  }, [code])



  const candlesticks = useQuery({
    queryKey: [getStockChartQuote.cacheKey, code],
    queryFn: () => getStockChartQuote(code!, ['IXIC', 'DJI', 'SPX'].includes(code!) ? StockChartInterval.INTRA_DAY : 'full-day'),
    enabled: !!code && type !== undefined,
    placeholderData: () => ([]),
    select: (list) => {
      return list.map(s => stockUtils.toStock(s))
    }
  })

  useEffect(() => {
    chart.current?.applyNewData(candlesticks.data ?? [])
    const tick = stockUtils.getIndexTimeTick()
    if (candlesticks.data?.length === tick.total) {
      chart.current?.getChart()?.setStyles({
        candle: {
          priceMark: {
            last: {
              line: {
                show: true
              }
            }
          }
        }
      })
    }
  }, [candlesticks])

  useStockBarSubscribe(code ? [`${code}@quote`] : [], useCallback((data) => {
    const c = chart.current?.getChart()
    const stock = stockUtils.toStock(data.rawRecord)
    const lastData = c?.getDataList()[c.getDataList().length - 1]
    if (!lastData) {
      chart.current?.applyNewData([stock])
    } else {
      chart.current?.appendCandlestick({
        ...stock,
        quote: lastData.quote,
        prevQuote: lastData?.prevQuote
      }, 1)
    }
  }, []))

  useEffect(() => {
    if (!code) return
    const unSubscribe = stockSubscribe.onQuoteTopic(code, data => {
      const c = chart.current?.getChart()
      const lastData = c?.getDataList()?.slice(-1)[0]

      if (!lastData) return

      chart.current?.appendCandlestick({
        ...lastData,
        quote: data.record.close,
        prevQuote: data.record.preClose
      }, 1)
    })

    return unSubscribe
  }, [code])

  // useStockQuoteSubscribe(code ? [code] : [], useCallback<StockSubscribeHandler<'quote'>>((data) => {
  //   console.log(data)
  //   const c = chart.current?.getChart()
  //   const lastData = c?.getDataList()?.slice(-1)[0]

  //   if (!lastData) return

  //   chart.current?.appendCandlestick({
  //     ...lastData,
  //     quote: data.record.close,
  //     prevQuote: data.record.preClose
  //   }, 1)
  // }, []))


  return <JknChart ref={chart} className="w-full h-full" showLogo />
}

export default LargeCap
