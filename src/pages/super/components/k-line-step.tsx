import { useContext, useRef } from "react"
import { SuperStockContext } from "../ctx"
import { JknIcon, ToggleGroup, ToggleGroupItem } from "@/components"
import { useMount, useUnmount } from "ahooks"

type StockKLineType = {
  authorized: 0 | 1
  id: string
  name: string
  value: string
}

const SecondaryStep = () => {
  const ctx = useContext(SuperStockContext)

  const data = (ctx.data?.technology?.children?.stock_kline?.from_datas ?? []) as StockKLineType[]

  const selection = useRef<string[]>([])

  useMount(() => {
    ctx.register('stock_cycle', 2, () => [...selection.current], () => selection.current.length > 0)
  })

  useUnmount(() => {
    ctx.unregister('stock_cycle')
    selection.current = []
  })


  return (
    <div className="min-h-32 flex  border-0 border-b border-solid border-background items-stretch">
      <div className="w-36 px-4 flex items-center flex-shrink-0  border-t-0 border border-solid border-background">
        第二步：时间周期
      </div>
      <div className="flex-1 flex flex-wrap pl-4 pt-4">
        <ToggleGroup type="multiple" onValueChange={v => {selection.current = v}}>
          {
            data.map(item => (
              <ToggleGroupItem disabled={!item.authorized} className="w-20 relative" key={item.id} value={item.value}>
                {
                  !item.authorized && <JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3" />
                }
                {item.name}
              </ToggleGroupItem>
            ))
          }
        </ToggleGroup>
      </div>
    </div>
  )
}

export default SecondaryStep