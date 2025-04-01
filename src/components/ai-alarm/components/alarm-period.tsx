import { getAlarmTypes } from "@/api"
import { ToggleGroup, ToggleGroupItem } from "@/components"
import { JknIcon } from "@/components/jkn/jkn-icon"
import { useQuery } from "@tanstack/react-query"
import { forwardRef, useState } from "react"

interface StockCycleSelectProps {
  value?: string[]
  onChange?: (value: string[]) => void
}
export const StockCycleSelect = forwardRef((props: StockCycleSelectProps, _) => {
  const query = useQuery({
    queryKey: [getAlarmTypes.cacheKey],
    queryFn: () => getAlarmTypes()
  })

  const [expand, setExpand] = useState(false)



  return (
    <ToggleGroup value={props.value} className="grid grid-cols-4 gap-3 w-full" variant="outline" type="multiple" onValueChange={props.onChange} >
      {query.data?.stock_kline.slice(0, !expand ? 11 : query.data?.stock_kline.length).map(item => (
        <ToggleGroupItem disabled={!item.authorized} className="w-full relative" key={item.id} value={item.value}>
          {!item.authorized && <JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3" />}
          {item.name}
        </ToggleGroupItem>
      ))}
      {
        !expand && (
          <div className="" onClick={e => { e.stopPropagation(); e.preventDefault(); setExpand(true) }} onKeyDown={() => { }}>
            <ToggleGroupItem className="w-full relative" key="expand" value="expand" onClick={() => setExpand(true)}>
              更多
            </ToggleGroupItem>
          </div>
        )
      }
    </ToggleGroup>
  )
})