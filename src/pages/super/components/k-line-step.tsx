import { useContext } from "react"
import { SuperStockContext } from "../ctx"
import { JknIcon } from "@/components"
import { cn } from "@/utils/style"

type StockKLineType = {
  authorized: 0 | 1
  id: string
  name: string
  value: string
}

const SecondaryStep = () => {
  const ctx = useContext(SuperStockContext)

  const data = (ctx.data?.technology?.children?.stock_kline?.from_datas ?? []) as StockKLineType[]

  return (
    <div className="min-h-32 flex  border-0 border-b border-solid border-background items-stretch">
      <div className="w-36 px-4 flex items-center flex-shrink-0  border-t-0 border border-solid border-background">
        第二步：时间周期
      </div>
      <div className="flex-1 flex flex-wrap pl-4 pt-4">
        {
          data.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center justify-center cursor-pointer relative rounded-sm text-center w-20 text-sm mb-2 mr-2  h-10 bg-accent text-secondary',
                item.authorized ? 'hover:opacity-85' : 'cursor-not-allowed'
              )}
            >
              {
                !item.authorized && <JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3" />
              }
              {item.name}

            </div>
          ))
        }
      </div>
    </div>
  )
}

export default SecondaryStep