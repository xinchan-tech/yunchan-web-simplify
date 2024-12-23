import { getStockBaseCodeInfo } from "@/api"
import { JknIcon, StockSelect } from "@/components"
import { useStockList } from "@/store"
import { stockManager } from "@/utils/stock"
import { cn } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import Decimal from "decimal.js"
import { forwardRef, useMemo } from "react"

interface StockSelectInputProps {
  value?: string
  onChange?: (value: string) => void
}

const StockSelectInput = forwardRef((props: StockSelectInputProps, _) => {
  const stockList = useStockList()

  const query = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, props.value, ['total_share']],
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
      const stock = stockManager.toStockRecord(query.data)[0]
      r.price = stock.close ?? 0
      r.percent = stock.percent ?? 0
    }

    return r
  }, [query.data, stockList.list, props.value])

  return (
    <div className="flex items-center">
      <StockSelect onChange={v => props.onChange?.(v)} />
      <div className="flex items-center ml-4 text-sm">
        <div className="w-6 h-6 mr-2">
          <JknIcon stock={data.icon} className="w-full h-full" />
        </div>
        {
          data.price ? (
            <div>
              <div >
                <span>{data.symbol}</span>&nbsp;&nbsp;
                <span className={cn(data.percent >= 0 ? 'text-stock-up' : 'text-stock-down',)}>
                  {Decimal.create(data.price).toFixed(3)} &nbsp;&nbsp; {Decimal.create(data.percent * 100).toFixed(2)}%
                </span>
              </div>
              <div className="text-tertiary text-xs">{data.name}</div>
            </div>
          ) : (
            <span className="h-[36px]">- &nbsp;&nbsp;-&nbsp;&nbsp;-</span>
          )
        }
      </div>
    </div>
  )
})

export default StockSelectInput