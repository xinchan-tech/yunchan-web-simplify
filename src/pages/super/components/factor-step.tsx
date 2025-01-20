import type { StockCategory } from "@/api"
import { JknIcon, ToggleGroup, ToggleGroupItem } from "@/components"
import { type CSSProperties, useContext, useRef, useState } from "react"
import { SuperStockContext } from "../ctx"
import { useMount, useUnmount } from "ahooks"
import { appEvent } from "@/utils/event"

const FactorStep = () => {
  const ctx = useContext(SuperStockContext)
  const data = (ctx.data?.technology?.children?.factor.children) as unknown as StockCategory[]

  const [selection, setSelection] = useState<string[]>([])
  const result = useRef<string[]>([])
  useMount(() => {
    ctx.register(
      'category_ids_ext',
      10,
      () => [...result.current],
      () => true
    )
  })

  useUnmount(() => {
    ctx.unregister('category_ids_ext')
    result.current = []
    setSelection([])
  })
  

  //TODO 临时方案 待优化
  useMount(() => {
    appEvent.on('cleanPickerStockFactor', () => {
      result.current = []
      setSelection([])
    })
  })

  useUnmount(() => {
    appEvent.off('cleanPickerStockFactor')
  })

  const _onValueChange = (e: string[]) => {
    appEvent.emit('cleanPickerStockMethod')
    result.current = e
    setSelection(e)
  }

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
        } as CSSProperties} type="multiple" value={selection} className="flex-1 flex" onValueChange={ _onValueChange}>
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