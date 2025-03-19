import { cn } from '@/utils/style'
import { useEffect, useMemo } from 'react'
import { ChartToolBar } from '../component/chart-tool-bar'
import { MainChart } from '../component/main-chart'
import { useSymbolQuery } from '../lib'
import { chartEvent } from '../lib/event'
import { chartManage, useChartManage } from '../lib/store'
import { renderUtils } from '../lib/utils'

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
  const symbol = useSymbolQuery()
  const active = useChartManage(s => s.activeChartId)

  useEffect(() => {
    chartEvent.get().emit('symbolChange', symbol)
  }, [symbol])

  const onChangeActive = (index: number) => {
    chartManage.setActiveChart(getChartIdByIndex(index))
  }

  const chartCount = useMemo(() => renderUtils.getViewMode(viewMode), [viewMode])

  return (
    <div className="h-full overflow-hidden flex flex-col bg-background">
      <ChartToolBar />
      <div className={cn('flex-1 overflow-hidden main-chart', `main-chart-${viewMode}`)}>
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
