import { getLargeCapIndexes } from "@/api"
import { useStock } from "@/store"
import { cn } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import NumSpan from "../num-span"
import JknIcon from "../jkn/jkn-icon"

const codes = ['IXIC', 'SPX', 'DJI']
export const StockBar = () => {
  useQuery({
    queryKey: [getLargeCapIndexes.cacheKey],
    queryFn: () => getLargeCapIndexes(),
  })
  const stock = useStock()

  const data = (() => {
    const r = []

    for (const code of codes) {
      const s = stock.getLastRecordByTrading(code, 'intraDay')
  
      r.push({
        name: code === 'IXIC' ? '纳指' : code === 'SPX' ? '标指' : '道指',
        price: s?.close,
        code: code,
        percent: s?.percent ?? 0,
        offset: (s?.close ?? 0) - (s?.prevClose ?? 0)
      })
    }

    return r
  })()


  return (
    <div>
      {
        data.map(item => (
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