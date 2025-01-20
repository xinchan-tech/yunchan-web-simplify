import { ToggleGroup, ToggleGroupItem } from "@/components"
import { useContext, useRef, type CSSProperties } from "react"
import { SuperStockContext } from "../ctx"
import { useMount, useUnmount } from "ahooks"

const CompareStep = () => {
  const ctx = useContext(SuperStockContext)
  const data = (ctx.data?.basic?.children?.compare.from_datas ?? []) as unknown as { name: string; value: string }[]

  const selection = useRef<string[]>([])
  useMount(() => {
    ctx.register(
      'compare',
      9,
      () => [...selection.current],
      () => selection.current.length > 0
    )
  })

  useUnmount(() => {
    ctx.unregister('compare')
    selection.current = []
  })

  return (
    <div className="min-h-20 flex border-0 border-b border-solid border-background items-stretch">
      <div className="w-36 px-4 flex items-center flex-shrink-0 border-t-0 border border-solid border-background">
        第六步：行业比价
      </div>
      <div className="flex items-center px-4">
        <ToggleGroup onValueChange={v => { selection.current = v }} type="multiple" style={{ '--toggle-active-bg': 'hsl(var(--stock-up-color))' } as CSSProperties}>
          {
            data.map(item => (
              <ToggleGroupItem size="sm" className="w-32" key={item.name} value={item.value}>
                {item.name}
              </ToggleGroupItem>
            ))
          }
        </ToggleGroup>
      </div>
    </div>
  )
}

export default CompareStep