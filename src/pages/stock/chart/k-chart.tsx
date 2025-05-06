import { useQueryParams } from '@/hooks'
import { AESCrypt } from '@/utils/string'
import { cn } from '@/utils/style'
import { useEffect, useMemo } from 'react'
import { CoilingBar } from '../component/chart-tool-bar'
import { DrawToolBox } from '../component/draw-tool-box'
import { MainChart } from '../component/main-chart'
import { chartEvent } from '../lib/event'
import { chartManage, useKChart } from '../lib/store'
import { renderUtils } from '../lib/utils'

// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
interface KChartProps { }

const getChartIdByIndex = (index: number) => `chart-${index}`

/**
 * @examples
 */
export const KChart = (_props: KChartProps) => {
  // const currentSymbol = useKChart(s => s.currentSymbol)
  const viewMode = useKChart(s => s.viewMode)
  // const symbol = useSymbolQuery()
  const [queryParams, setQueryParams] = useQueryParams<{ symbol: string; q?: string }>()
  const active = useKChart(s => s.activeChartId)


  useEffect(() => {
    chartEvent.get().emit('symbolChange', queryParams.symbol ?? 'QQQ')

    if (queryParams.q) {
      const q = JSON.parse(AESCrypt.decrypt(queryParams.q)) as { interval?: number }
      if (q.interval !== undefined) {
        chartManage.setInterval(q.interval)
      }
    }
  }, [queryParams.symbol, queryParams.q])

  const onChangeActive = (index: number) => {
    chartManage.setActiveChart(getChartIdByIndex(index))
    const activeSymbol = chartManage.getChart(getChartIdByIndex(index))?.symbol
    if (queryParams.symbol !== activeSymbol) {
      setQueryParams({ symbol: chartManage.getChart(getChartIdByIndex(index))?.symbol })
    }
  }

  const chartCount = useMemo(() => renderUtils.getViewMode(viewMode), [viewMode])

  return (
    <div className="w-full h-full flex relative">
      <div className="h-full overflow-hidden flex flex-col bg-background relative flex-1">
        <div className="text-foreground text-sm flex items-center px-4 space-x-4 pt-1">
          <CoilingBar />
        </div>
        <div className={cn('flex-1 overflow-hidden main-chart', `main-chart-${viewMode}`)} id="stock-chart-container">
          {Array.from({ length: chartCount }).map((_, index, arr) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              key={index}
              className={cn(
                `chart-item-${index + 1}`,
                active === getChartIdByIndex(index) && arr.length > 1 ? 'active' : ''
              )}
              onClick={() => onChangeActive(index)}
              onKeyDown={() => { }}
            >
              <MainChart chartId={getChartIdByIndex(index)} />
            </div>
          ))}
        </div>
      </div>
      <DrawToolBox /> 
    </div>


  )
}
