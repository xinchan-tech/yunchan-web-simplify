import { getAlarmTypes } from "@/api"
import { ScrollArea, ToggleGroup, ToggleGroupItem } from "@/components"
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

  return (
    <ScrollArea className="h-[90px] w-full text-foreground">
      <ToggleGroup value={props.value} className="grid grid-cols-4 gap-3 w-full" size="xl" hoverColor="#2E2E2E" activeColor="#2E2E2E" variant="ghost" type="multiple" onValueChange={props.onChange} >
        {query.data?.stock_kline.map(item => (
          <ToggleGroupItem disabled={!item.authorized} className="w-full relative text-secondary" key={item.id} value={item.value}>
            {!item.authorized && <JknIcon name="ic_lock" className="absolute right-0 top-0 w-3 h-3" />}
            {item.name}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </ScrollArea>
  )
})