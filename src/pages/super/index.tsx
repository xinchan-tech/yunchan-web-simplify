import { cn } from "@/utils/style"
import { useState } from "react"
import FirstStep from "./components/first-step"
import KLineType from "./components/k-line-step"
import { Button, ScrollArea } from "@/components"
import { getStockCategoryData } from "@/api"
import { useQuery } from "@tanstack/react-query"
import { SuperStockContext } from "./ctx"
import MethodStep from "./components/method-step"
import FactorStep from "./components/factor-step"
import MarketCap from "./components/market-cap"
import BubbleStep from "./components/bubble-step"
import FinanceStep from "./components/finance-step"
import PeriodStep from "./components/period-step"
import CompareStep from "./components/compare-step"

enum SuperStockType {
  Tech = 0,
  Basic = 1,
  Super = 2,
}

const SuperStock = () => {
  const [type, setType] = useState<SuperStockType>(SuperStockType.Tech)
  const { data: category } = useQuery({
    queryKey: [getStockCategoryData.cacheKey],
    queryFn: () => getStockCategoryData(),
    placeholderData: {}
  })

  return (
    <SuperStockContext.Provider value={{ data: category as unknown as SuperStockContext['data'] }} >
      <ScrollArea className="bg-muted h-full">
        <div className="p-12 box-border ">
          <div className="flex justify-center text-secondary mb-12">
            <SuperStockTypeTab type={type} onChange={setType} />
          </div>
          {
            type === SuperStockType.Super && (
              <div className="mt-8 bg-accent py-1 text-center text-sm">
                技术面
              </div>
            )
          }
          <div>
            <FirstStep />
          </div>
          {
            (type === SuperStockType.Tech || type === SuperStockType.Super) && (
              <>
                <KLineType />
                <MethodStep />
                <FactorStep />
              </>
            )
          }
          {
            type === SuperStockType.Super && (
              <div className="mt-8 bg-accent py-1 text-center text-sm">
                基本面
              </div>
            )
          }
          {
            (type === SuperStockType.Basic || type === SuperStockType.Super) && (
              <>
                <MarketCap />
                <BubbleStep />
                <FinanceStep />
                <PeriodStep />
                <CompareStep />
              </>
            )
          }
          <div className="text-center mt-12">
            <Button className="w-24">确定</Button>
          </div>
        </div>
      </ScrollArea>
    </SuperStockContext.Provider >
  )
}



interface SuperStockTypeTabProps {
  onChange?: (type: SuperStockType) => void
  type?: SuperStockType
}



const SuperStockTypeTab = (props: SuperStockTypeTabProps) => {
  const _onClick = (type: SuperStockType) => {
    props.onChange?.(type)
  }

  return (
    <div className="super-stock-type">
      <div className={cn(props.type === SuperStockType.Tech && 'super-stock-type-active')} onClick={() => _onClick(SuperStockType.Tech)} onKeyDown={() => { }}>技术面</div>
      <div className={cn(props.type === SuperStockType.Basic && 'super-stock-type-active')} onClick={() => _onClick(SuperStockType.Basic)} onKeyDown={() => { }}>基本面</div>
      <div className={cn(props.type === SuperStockType.Super && 'super-stock-type-active')} onClick={() => _onClick(SuperStockType.Super)} onKeyDown={() => { }}>超级组合</div>

      <style jsx>{`
        {
          .super-stock-type{
            border-width: 1px;
            border-style: solid;
            border-color: hsl(var(--border));
            display: flex;
            align-items: center;
            height: 36px;
            line-height: 34px;
            box-sizing: border-box;
            border-radius: 32px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            user-select: none;
            overflow: hidden;
          }

          .super-stock-type > div{
            padding:0 32px;
            height: 100%;
            border-left: 1px solid hsl(var(--border));
          }

          .super-stock-type > div.super-stock-type-active{
            background-color: hsl(var(--primary));
            color: hsl(var(--foreground));
            transition: all 0.2s ease;
          }
        }
        `}</style>
    </div>
  )
}

export default SuperStock