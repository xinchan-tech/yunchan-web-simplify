import { getLargeCapIndexes } from '@/api'
import { useStockQuoteSubscribe } from '@/hooks'
import { stockUtils } from '@/utils/stock'
import { cn } from '@/utils/style'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { SubscribeSpan } from '../num-span'

// const codes = ['IXIC', 'SPX', 'DJI']
export const StockBar = () => {
  const query = useQuery({
    queryKey: [getLargeCapIndexes.cacheKey],
    queryFn: () => getLargeCapIndexes(),
    select: data =>
      data
        ?.find(item => item.category_name === '大盘指数')
        ?.stocks.map(item => {
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

  useStockQuoteSubscribe(query.data?.map(o => o.code) ?? [])

  return (
    <div>
      {stockData?.map(item => (
        <span key={item.code}>
          <span className="text-secondary">{item.name}:</span>&nbsp;
          <span className={cn(item.percent >= 0 ? 'text-stock-up' : 'text-stock-down')}>
            <SubscribeSpan.Price
              symbol={item.code}
              initValue={item.price ?? 0}
              initDirection={item.percent > 0}
              decimal={3}
              arrow
              showSign
            />
            &emsp;
            <SubscribeSpan.Percent
              symbol={item.code}
              type="amount"
              initValue={item.offset}
              initDirection={item.percent > 0}
              decimal={3}
              showSign
            />
            &emsp;
            <SubscribeSpan.Percent
              symbol={item.code}
              initValue={item.percent * 100}
              initDirection={item.percent >= 0}
              decimal={2}
              showSign
            />
            &emsp;
          </span>
        </span>
      ))}
    </div>
  )
}
