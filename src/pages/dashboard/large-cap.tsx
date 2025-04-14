import { StockChartInterval, getLargeCapIndexes, getStockChartQuote } from '@/api'
import {  JknIcon, SubscribeSpan } from '@/components'
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
          <StockBarItem
            key={stock.symbol}
            stock={stock}
            check={activeStock === stock.symbol}
            onActiveStockChange={onActiveStockChange}
          />
        ))}
      </ScrollContainer>

      <div className="flex-1 relative">
        <div onClick={onChartDoubleClick} onKeyDown={() => {}} className="w-full h-full box-border">
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
      onKeyDown={() => {}}
    >
      <JknIcon.Stock symbol={stock.symbol} className="w-[28px] h-[28px]" />
      <div className="ml-3 flex flex-col">
        <span className="text-sm text-left">{stock.name}</span>
        <div className="flex items-center mt-1 space-x-2">
          <SubscribeSpan.Price
            trading={
              ['SPX', 'IXIC', 'DJI'].includes(stock.symbol) ? 'intraDay' : ['preMarket', 'intraDay', 'afterHours']
            }
            initValue={stock.close}
            symbol={stock.symbol}
            initDirection={stockUtils.isUp(stock)}
            decimal={3}
            arrow
          />
          <SubscribeSpan.Percent
            className="text-sm"
            trading={
              ['SPX', 'IXIC', 'DJI'].includes(stock.symbol) ? 'intraDay' : ['preMarket', 'intraDay', 'afterHours']
            }
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


  return <div/>
}

export default LargeCap
