import type { getStockIndicators } from "@/api"
import { HoverCard, HoverCardContent, HoverCardTrigger, JknIcon } from "@/components"
import { SearchList } from "./search-list"
import { CoilingIndicatorId, kChartUtils, useKChartStore } from "../lib"
import { useCallback } from "react"

interface MainIndicatorProps {
  data?: Awaited<ReturnType<typeof getStockIndicators>>
}
export const MainIndicator = (props: MainIndicatorProps) => {
  //TODO, 修改缠论系统版本时，去除不在目标版本里的指标
  const system = useKChartStore(s => s.state[s.activeChartIndex].system)
  const _setMainSystem = useCallback((system: string) => {
    kChartUtils.setMainSystem({ system })
    if(system){
      kChartUtils.setMainCoiling({coiling: [
        CoilingIndicatorId.PEN,
        CoilingIndicatorId.ONE_TYPE,
        CoilingIndicatorId.TWO_TYPE,
        CoilingIndicatorId.THREE_TYPE,
        CoilingIndicatorId.PIVOT
      ]})
    }else{
      kChartUtils.setMainCoiling({coiling: []})
    }
  }, [])

  return (

    <HoverCard openDelay={100} closeDelay={200}>
      <HoverCardTrigger className="">
        <span className="text-sm flex items-center cursor-pointer">
          <span>缠论系统</span>
          <JknIcon name="arrow_down" className="w-3 h-3 ml-1" />
        </span>
      </HoverCardTrigger>
      <HoverCardContent side="top" className="w-fit p-0">
        <SearchList
          data={props.data?.main.find(i => i.name === '缠论系统')?.indicators.map(item => ({ label: item.name ?? '', value: item.id, extra: item, notAuthorized: item.authorized !== 1 })) ?? []}
          name="缠论系统"
          value={system}
          onChange={_setMainSystem}
          type="single"
        />
      </HoverCardContent>
    </HoverCard>

  )
}
