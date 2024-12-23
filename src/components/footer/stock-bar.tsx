import { getLargeCapIndexes } from "@/api"
import { cn } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import NumSpan from "../num-span"
import JknIcon from "../jkn/jkn-icon"
import { stockManager } from "@/utils/stock"

const codes = ['IXIC', 'SPX', 'DJI']
export const StockBar = () => {
  const query = useQuery({
    queryKey: [getLargeCapIndexes.cacheKey],
    queryFn: () => getLargeCapIndexes(),
    select: data => data?.find(item => item.category_name === '大盘指数')?.stocks.map(item => {
      const stock = stockManager.toStockRecord(item)[0]
      return {
        name: stock.symbol === 'IXIC' ? '纳指' : stock.symbol === 'SPX' ? '标指' : '道指',
        price: stock?.close,
        code: stock.symbol,
        percent: stock?.percent ?? 0,
        offset: (stock?.close ?? 0) - (stock?.prevClose ?? 0)
      }
    })
  })

  return (
    <div>
      {
        query.data?.map(item => (
          <span key={item.code}>
            <span>{item.name}:</span>&nbsp;
            <span className={cn(item.percent >= 0 ? 'text-stock-up' : 'text-stock-down')}>
              <NumSpan value={item.price ?? 0} decimal={3} />
              <JknIcon className="w-4 h-4 -mb-0.5" name={item.percent >= 0 ? 'ic_price_up_green' : 'ic_price_down_red'} />
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