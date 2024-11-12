import type { StockCategory } from "@/api"
import { JknIcon, ToggleGroup, ToggleGroupItem } from "@/components"
import { type CSSProperties, useContext } from "react"
import { SuperStockContext } from "../ctx"

const FactorStep = () => {
  const ctx = useContext(SuperStockContext)
  const data = (ctx.data?.technology?.children?.factor.children) as unknown as StockCategory[]
  
  return (
    <div className="min-h-24 flex border-0 border-b border-solid border-background items-stretch">
      <div className="w-36 px-4 flex items-center flex-shrink-0  border-t-0 border border-solid border-background">
        第四步：叠加策略
      </div>
      <div className="flex-1 flex items-stretch">
        <div className="flex-shrink-0 px-4 flex items-center text-sm text-stock-up">
          <JknIcon name="ic_price_up_green" />
          底部信号
        </div>
        <ToggleGroup style={{
          '--toggle-active-bg': 'hsl(var(--stock-up-color))',
        } as CSSProperties} type="multiple" className="flex-1 flex">
          {data?.map((child) => (
            child.name !== '' ? (
              <ToggleGroupItem className="w-36 h-full" key={child.id} value={child.id}>
                {child.name}
              </ToggleGroupItem>
            ) : null
          ))}
        </ToggleGroup>

      </div>
    </div>
  )
}

export default FactorStep