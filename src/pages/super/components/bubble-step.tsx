import { ToggleGroup, ToggleGroupItem } from "@/components"
import { useContext, useRef, type CSSProperties } from "react"
import { SuperStockContext } from "../ctx"
import { useMount, useUnmount } from "ahooks"

const BubbleStep = () => {
  const ctx = useContext(SuperStockContext)
  const data = (ctx.data?.basic?.children?.bubble.from_datas ?? []) as unknown as { name: string; value: string }[]
  const selection = useRef<string>()
  useMount(() => {
    ctx.register(
      'bubble',
      6,
      () => selection.current,
      () => !!selection.current
    )
  })

  useUnmount(() => {
    ctx.unregister('bubble')
    selection.current = undefined
  })

  return (
    <div className="min-h-20 flex border-0 border-b border-solid border-background items-stretch">
      <div className="w-36 px-4 flex items-center flex-shrink-0  border-t-0 border border-solid border-background">
        第三步：估值泡沫
      </div>
      <div className="flex items-center px-4">
        <ToggleGroup type="single" onValueChange={v => { selection.current = v }} style={{ '--toggle-active-bg': 'hsl(var(--stock-up-color))' } as CSSProperties}>
          {
            data.map(item => (
              <ToggleGroupItem className="w-32 h-8 " variant="outline" key={item.name} value={item.value}>
                {item.name}
              </ToggleGroupItem>
            ))
          }
        </ToggleGroup>
      </div>
    </div >
  )
}

export default BubbleStep