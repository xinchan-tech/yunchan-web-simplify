import { JknIcon, NumSpan, RadioGroup, RadioGroupItem, StockSelect, ToggleGroup, ToggleGroupItem } from "@/components"
import { stockBaseCodeInfoExtend, useSymbolQuery } from "../lib"
import { useQuery } from "@tanstack/react-query"
import { getStockBaseCodeInfo, getStockFinanceTotal } from "@/api"
import { useMemo } from "react"
import { stockManager } from "@/utils/stock"
import Decimal from "decimal.js"
import { useStockList } from "@/store"
import dayjs from "dayjs"

export const FinanceCore = () => {
  const symbol = useSymbolQuery()

  const stockBaseInfo = useQuery({
    queryKey: [getStockBaseCodeInfo.cacheKey, symbol, stockBaseCodeInfoExtend],
    queryFn: () => getStockBaseCodeInfo({ symbol, extend: stockBaseCodeInfoExtend }),
    enabled: !!symbol
  })

  const { data: stockFinance } = useQuery({
    queryKey: [getStockFinanceTotal.cacheKey, symbol],
    queryFn: () => getStockFinanceTotal(symbol),
    enabled: !!symbol
  })

  const { listMap } = useStockList()

  const stockIcon = listMap[symbol]

  const stock = useMemo(() => stockBaseInfo.data ? stockManager.toStockRecord(stockBaseInfo.data)[0] : undefined, [stockBaseInfo.data])

  return (
    <div className="w-[960px] mx-auto">
      <div className="flex items-center py-2 space-x-4 text-sm w-full">
        <div className="flex items-center space-x-2 ">
          <JknIcon stock={stockIcon?.[0]} className="w-8 h-8" />
          <span>{stockIcon?.[1]}</span>
        </div>
        <NumSpan value={stock?.close} isPositive={stock?.isUp} decimal={3} />
        <NumSpan value={stock?.percentAmount} isPositive={stock?.isUp} decimal={3} symbol />
        <NumSpan value={Decimal.create(stock?.percent).mul(100)} isPositive={stock?.isUp} decimal={2} symbol percent />

        <span className="!ml-auto text-tertiary text-xs flex items-center space-x-4">
          <span>更新时间: {dayjs(stockFinance?.totals.updated_at).format('YYYY-MM-DD')}</span>
          <StockSelect placeholder="搜索股票" />
        </span>
      </div>

      <div className="my-4">
        <div className="flex items-center space-x-4">
          <ToggleGroup
            value="1" onValueChange={v => console.log(v)} type="single" className="justify-around w-full"
            activeColor="hsl(var(--accent))" 
          >
            <ToggleGroupItem value={'1'} className="h-16" variant="outline">
              <div className="w-32">
                <div className="text-sm">总营收</div>
                <div className="text-lg text-stock-up font-bold">{Decimal.create(stockFinance?.totals.revenues).toShortCN(2)}</div>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem value={'2'} className="h-16" variant="outline">
              <div className="w-32">
                <div className="text-sm">净利润</div>
                <div className="text-lg text-stock-up font-bold">{Decimal.create(stockFinance?.totals.net_income_loss).toShortCN(2)}</div>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem value={'3'} className="h-16" variant="outline">
              <div className="w-32">
                <div className="text-sm">现金流</div>
                <div className="text-lg text-stock-up font-bold">{Decimal.create(stockFinance?.totals.net_cash_flow_free).toShortCN(2)}</div>
              </div>
            </ToggleGroupItem>
            <ToggleGroupItem value={'4'} className="h-16" variant="outline">
              <div className="w-32">
                <div className="text-sm">负债率</div>
                <div className="text-lg text-stock-up font-bold">{Decimal.create(stockFinance?.totals.liabilities_rate).mul(100).toFixed(2)}%</div>
              </div>
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
    </div>
  )

}