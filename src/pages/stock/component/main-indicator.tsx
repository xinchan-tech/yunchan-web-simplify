import type { getStockIndicators } from '@/api'
import { HoverCard, HoverCardContent, HoverCardTrigger, JknIcon } from '@/components'
import { useCallback } from 'react'
import { chartManage, useChartManage } from '../lib/store'
import { SearchList } from './search-list'

interface MainIndicatorProps {
  data?: Awaited<ReturnType<typeof getStockIndicators>>
}
export const MainIndicator = (props: MainIndicatorProps) => {
  const system = useChartManage(s => s.getActiveChart().system)
  const _setMainSystem = useCallback((system: string) => {
    chartManage.setSystem(system)
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
          data={
            props.data?.main
              .find(i => i.name === '缠论系统')
              ?.indicators.map(item => ({
                label: item.name ?? '',
                value: item.id,
                extra: item,
                notAuthorized: item.authorized !== 1
              })) ?? []
          }
          name="缠论系统"
          value={system}
          onChange={_setMainSystem}
          type="single"
        />
      </HoverCardContent>
    </HoverCard>
  )
}
