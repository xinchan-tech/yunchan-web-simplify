import { getLargeCapIndexes } from "@/api"
import { cn } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import { NumSpan } from "../num-span"
import { type StockSubscribeHandler, stockUtils } from "@/utils/stock"
import { useCallback, useEffect, useState } from "react"
import { useStockQuoteSubscribe } from "@/hooks"

// const codes = ['IXIC', 'SPX', 'DJI']
export const StockBar = () => {
  const query = useQuery({
    queryKey: [getLargeCapIndexes.cacheKey],
    queryFn: () => getLargeCapIndexes(),
    select: data => data?.find(item => item.category_name === '大盘指数')?.stocks.map(item => {
      const stock = stockUtils.toStockRecord(item)[0]
      return {
        name: stock.symbol === 'IXIC' ? '纳指' : stock.symbol === 'SPX' ? '标指' : '道指',
        price: stock?.close,
        code: stock.symbol,
        percent: stock?.percent ?? 0,
        offset: (stock?.close ?? 0) - (stock?.prevClose ?? 0)
      }
    })
  })

  const [stockData, setStockData] = useState<typeof query.data>(query.data)

  useEffect(() => {
    setStockData(query.data)
  }, [query.data])

  const updateQuoteHandler = useCallback<StockSubscribeHandler<'quote'>>((data) => {
    setStockData(s => {
      if (!s) return []
      const items = s.map((item) => {
        if (item.code === data.topic) {
          const _item = { ...item }
          _item.price = data.record.close
          _item.percent = (data.record.close - data.record.preClose) / data.record.preClose
          _item.offset = data.record.close - data.record.preClose
          return _item
        }
        return item
      })

      return items
    })
  }, [])

  useStockQuoteSubscribe(query.data?.map(o => o.code) ?? [], updateQuoteHandler)

  return (
    <div>
      {
        stockData?.map(item => (
          <span key={item.code}>
            <span>{item.name}:</span>&nbsp;
            <span className={cn(item.percent >= 0 ? 'text-stock-up' : 'text-stock-down')}>
              <NumSpan value={item.price ?? 0} isPositive={item.percent >= 0} decimal={3} arrow />
              {/* <JknIcon className="w-4 h-4 -mb-0.5" name={item.percent >= 0 ? 'ic_price_up_green' : 'ic_price_down_red'} /> */}
              &emsp;
              <NumSpan value={item.offset} isPositive={item.percent >= 0} symbol />&emsp;
              <NumSpan value={item.percent * 100} decimal={2} isPositive={item.percent >= 0} percent symbol />&emsp;
            </span>
          </span>
        ))
      }
    </div>
  )
}