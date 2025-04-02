import { cn } from '@/utils/style'
import { useEffect, useMemo } from 'react'
import { MainChart } from '../component/main-chart'
import { useSymbolQuery } from '../lib'
import { chartEvent } from '../lib/event'
import { chartManage, useChartManage } from '../lib/store'
import { renderUtils } from '../lib/utils'
import { CoilingBar } from "../component/chart-tool-bar"
import { useQueryParams } from "@/hooks"
import { AESCrypt } from "@/utils/string"

interface KChartProps {
  onChangeLeftSide: () => void
  leftSideVisible: 'full' | 'half' | 'hide'
  onChangeRightSize: () => void
  rightSideVisible: 'full' | 'hide'
}

const getChartIdByIndex = (index: number) => `chart-${index}`

/**
 * @examples
 */
export const KChart = (props: KChartProps) => {
  // const currentSymbol = useChartManage(s => s.currentSymbol)
  const viewMode = useChartManage(s => s.viewMode)
  // const symbol = useSymbolQuery()
  const [queryParams] = useQueryParams<{ symbol: string; q?: string }>()
  const active = useChartManage(s => s.activeChartId)

  useEffect(() => {
    chartEvent.get().emit('symbolChange', queryParams.symbol ?? 'QQQ')

    if (queryParams.q) {
      const q = JSON.parse(AESCrypt.decrypt(queryParams.q)) as { interval?: number }
      if(q.interval !== undefined){
        chartManage.setInterval(q.interval)
      }
    }
  }, [queryParams.symbol, queryParams.q])

  const onChangeActive = (index: number) => {
    chartManage.setActiveChart(getChartIdByIndex(index))
  }

  const chartCount = useMemo(() => renderUtils.getViewMode(viewMode), [viewMode])

  return (
    <div className="h-full overflow-hidden flex flex-col bg-background">
      <div className="text-foreground text-sm flex items-center px-4 space-x-4 pt-1">
        <CoilingBar />
      </div>
      <div className={cn('flex-1 overflow-hidden main-chart', `main-chart-${viewMode}`)} id="stock-chart-container">
        {Array.from({ length: chartCount }).map((_, index, arr) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <div key={index} className={cn(`chart-item-${index + 1}`, (active === getChartIdByIndex(index) && arr.length > 1) ? 'active' : '')} onClick={() => onChangeActive(index)} onKeyDown={() => { }}>
            <MainChart chartId={getChartIdByIndex(index)} />
          </div>
        ))}
      </div>
    </div>
  )
}
