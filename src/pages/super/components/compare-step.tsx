import { ToggleGroup, ToggleGroupItem } from "@/components"
import { useContext, type CSSProperties } from "react"
import { SuperStockContext } from "../ctx"

const CompareStep = () => {
  const ctx = useContext(SuperStockContext)
  const data = (ctx.data?.basic?.children?.compare.from_datas ?? []) as unknown as { name: string; value: string }[]

  return (
    <div className="min-h-20 flex border-0 border-b border-solid border-background items-stretch">
      <div className="w-36 px-4 flex items-center flex-shrink-0 border-t-0 border border-solid border-background">
        第六步：行业比价
      </div>
      <div className="flex items-center px-4">
        <ToggleGroup type="multiple" style={{ '--toggle-active-bg': 'hsl(var(--stock-up-color))' } as CSSProperties}>
          {
            data.map(item => (
              <ToggleGroupItem size="sm" className="w-24" variant="outline" key={item.name} value={item.value}>
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