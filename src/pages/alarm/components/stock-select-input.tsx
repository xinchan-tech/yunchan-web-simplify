import { getStockBaseCodeInfo } from "@/api"
import { StockSelect } from "@/components"
import { StockRecord, useStockList } from "@/store"
import { numToFixed } from "@/utils/price"
import { cn } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import { forwardRef, useMemo } from "react"

interface StockSelectInputProps {
  value?: string
  onChange?: (value: string) => void
}

const StockSelectInput = forwardRef((props: StockSelectInputProps, _) => {
  const stockList = useStockList()
  const query = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, props.value],
    queryFn: () => getStockBaseCodeInfo({ symbol: props.value!, extend: ['total_share'] }),
    enabled: !!props.value
  })

  const data = useMemo(() => {
    const s = stockList.list.find(s => s[1] === props.value)
    const r = {
      symbol: s?.[1],
      icon: s?.[0],
      name: s?.[3],
      total: 0,
      price: 0,
      percent: 0,
    }

    if (query.data) {
      const stock = new StockRecord(query.data.stock, query.data.extend)
      r.price = stock.close
      r.percent = stock.percent
    }

    return r
  }, [query.data, stockList.list, props.value])

  return (
    <div className="flex items-center">
      <StockSelect onChange={v => props.onChange?.(v)} />
      <div className="flex items-center ml-4 text-sm">
        <div className="w-4 h-4 mr-2">{data.symbol}</div>
        {
          data.price ? (
            <div>
              <div >
                <span>{data.symbol}</span>&nbsp;&nbsp;
                <span className={cn(data.percent >= 0 ? 'text-stock-up' : 'text-stock-down',)}>
                  {numToFixed(data.price, 3)} &nbsp;&nbsp; {numToFixed(data.percent * 100, 2)}%
                </span>
              </div>
              <div className="text-tertiary text-xs">{data.name}</div>
            </div>
          ) : (
            <span>- &nbsp;&nbsp;-&nbsp;&nbsp;-</span>
          )
        }
      </div>
    </div>
  )
})

export default StockSelectInput