import { cn } from '@/utils/style'
import { useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { ChartToolBar, IndicatorModal } from '../component/chart-tool-bar'
import { MainChart } from '../component/main-chart'
import { useSymbolQuery } from '../lib'
import { chartEvent } from '../lib/event'
import { useChartManage } from '../lib/store'
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

  useEffect(() => {
    chartEvent.get().emit('symbolChange', symbol)
  }, [symbol])

  const navigate = useNavigate()

  // useUpdateEffect(() => {
  //   navigate(`/stock/trading?symbol=${currentSymbol}`)
  // }, [currentSymbol])

  const chartCount = useMemo(() => renderUtils.getViewMode(viewMode), [viewMode])

  return (
    <div className="h-full overflow-hidden flex flex-col bg-background">
      <ChartToolBar />
      {/* <div className="w-full flex-shrink-0">
        <div className="flex border border-solid border-border px-4 items-center">
          <JknIcon name="ic_leftbar" className={cn(
            'rounded-none h-4 w-4 mr-1 flex-shrink-0',
            props.leftSideVisible !== 'hide' ? 'icon-checked' : ''
          )} onClick={props.onChangeLeftSide} />
          <span className="flex-shrink-0 text-primary text-xs mr-2">
            {symbol}
          </span>
          <div className="flex-1">
            <TimeIndexSelect />
          </div>
          <JknIcon name="ic_rightbar" className={cn(
            'rounded-none h-4 w-4 mr-2 flex-shrink-0',
            props.rightSideVisible !== 'hide' ? 'icon-checked' : ''
          )} onClick={props.onChangeRightSize} />
        </div>
        <ChartToolSelect />
      </div> */}
      <div className={cn('flex-1 overflow-hidden main-chart', `main-chart-${viewMode}`)}>
        {Array.from({ length: chartCount }).map((_, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
          <MainChart key={index} chartId={getChartIdByIndex(index)} />
        ))}
      </div>
    </div>
  )
}
