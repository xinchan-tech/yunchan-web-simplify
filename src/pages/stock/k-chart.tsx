import { getStockIndicators, StockChartInterval, type StockIndicator } from "@/api"
import { Button, CapsuleTabs, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, JknIcon, Separator } from "@/components"
import { useMemo, useState } from "react"
import { Fragment } from "react/jsx-runtime"
import { useImmer } from "use-immer"
import { createDefaultChartState, KChartContext, type KChartState, timeIndex, useKChartContext, useSymbolQuery } from "./lib"
import { MainChart } from "./component/main-chart"
import { cn } from "@/utils/style"
import { ViewModeSelect } from "./component/view-mode-select"
import { useQuery } from "@tanstack/react-query"
import { MainIndicator } from "./component/main-indicator"
import { useUpdateEffect } from "ahooks"
import { ChartContextMenu } from "./component/chart-context-menu"

const leftMenu = ['盘前分时', '盘中分时', '盘后分时', '多日分时']
const rightMenu = ['周线', '月线', '季线', '半年', '年线']

const rightMenuStartIndex = timeIndex.length - rightMenu.length
export const KChart = () => {
  const [context, setContext] = useImmer<KChartState>({
    viewMode: 'single',
    secondaryIndicators: ['9', '10'],
    state:
      [
        createDefaultChartState()
      ],
    activeChartIndex: 1
  })

  const chartCount = useMemo(() => {
    switch (context.viewMode) {
      case 'single':
        return 1
      case 'double':
        return 2
      case 'double-vertical':
        return 2
      case 'three-left-single':
        return 3
      case 'three-right-single':
        return 3
      case 'three-vertical-top-single':
        return 3
      case 'three-vertical-bottom-single':
        return 3
      case 'four':
        return 4
      case 'six':
        return 6
      case 'nine':
        return 9
      default:
        return 1
    }
  }, [context.viewMode])

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <KChartContext.Provider value={{ ...context, setState: setContext }}>
        <div className="w-full flex-shrink-0">
          <div className="flex border border-solid border-border px-4">
            <TimeIndexSelect />
          </div>
          <ChartToolSelect />
        </div>
        <div className={cn('flex-1 overflow-hidden main-chart', `main-chart-${context.viewMode}`)} >

          {
            Array.from({ length: chartCount }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <ChartContextMenu key={index} index={index + 1}>
                <MainChart index={index + 1} />
              </ChartContextMenu>
            ))
          }

        </div>
      </KChartContext.Provider>
      <style jsx>{`
         .main-chart {
           display: grid;
           grid-template-columns: 1fr;
           grid-template-rows: 1fr;
         }

         .main-chart-single{
          grid-template-areas: 'chart-1';
         }

         .main-chart-double {
           grid-template-areas: 'chart-1 chart-2';
           grid-template-columns: 50% 50%;
         }

         .main-chart-double-vertical {
           grid-template-areas: 
           'chart-1'
           'chart-2';
           grid-template-rows: 50% 50%;
           grid-template-columns: 1fr;
         }
      `}</style>
    </div >
  )
}

const TimeIndexSelect = () => {
  const { state, setState, activeChartIndex } = useKChartContext()
  const activeChart = state[activeChartIndex - 1]
  const setActiveMin = (min: StockChartInterval) => {
    setState(state => {
      state.state[state.activeChartIndex - 1].timeIndex = min
      if ([StockChartInterval.PRE_MARKET, StockChartInterval.AFTER_HOURS, StockChartInterval.INTRA_DAY, StockChartInterval.FIVE_DAY].includes(min)) {
        state.state[state.activeChartIndex - 1].type = 'line'
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div>
            <Button reset className="text-xs font-normal">
              {
                timeIndex.findIndex(v => v === activeChart.timeIndex) > 3 ? '分时' : (
                  <span className="text-primary">{{
                    '-2': '盘后',
                    '0': '盘中',
                    '-1': '盘前',
                    '7200': '多日'
                  }[activeChart.timeIndex.toString()] ?? null}</span>
                )
              }
            </Button>
            <JknIcon name="arrow_down" className="w-2 h-2  ml-1" />
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          {
            leftMenu.map((item, index) => (
              <DropdownMenuItem key={item} onClick={() => setActiveMin(timeIndex[index])}>{item}</DropdownMenuItem>
            ))
          }
        </DropdownMenuContent>
      </DropdownMenu>
      <CapsuleTabs type="text" activeKey={activeChart.timeIndex.toString()} onChange={v => setActiveMin(+v)}>
        {
          timeIndex.slice(4).slice(0, -5).map(item => (
            <Fragment key={item}>
              {
                item < 60 ? (
                  <CapsuleTabs.Tab label={`${item}分钟`} value={item.toString()} />
                ) : item < 1440 ? (
                  <CapsuleTabs.Tab label={`${item / 60}小时`} value={item.toString()} />
                ) : (
                  <CapsuleTabs.Tab label="日线" value={item.toString()} />
                )
              }
            </Fragment>
          ))
        }
      </CapsuleTabs>
      <div className="ml-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div>
              <Button reset className="text-xs font-normal">
                {
                  timeIndex.findIndex(v => v === activeChart.timeIndex) < rightMenuStartIndex ? '周期' : (
                    <span className="text-primary">{rightMenu[timeIndex.findIndex(v => v === activeChart.timeIndex) - rightMenuStartIndex]}</span>
                  )
                }
              </Button>
              <JknIcon name="arrow_down" className="w-2 h-2  ml-1" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {
              rightMenu.map((item, index) => (
                <DropdownMenuItem key={item} onClick={() => setActiveMin(timeIndex[index + rightMenuStartIndex])}>{item}</DropdownMenuItem>
              ))
            }
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}

const CHART_TOOL = ['主图指标', '线型切换', '多图模式', '股票PK', '叠加标记', '画线工具']

const ChartToolSelect = () => {
  const [toolType, setToolType] = useState<string>('主图指标')
  const { state, setState, activeChartIndex } = useKChartContext()

  const activeChart = state[activeChartIndex - 1]
  const onChangeMainChartType = () => {
    if ([StockChartInterval.PRE_MARKET, StockChartInterval.AFTER_HOURS, StockChartInterval.INTRA_DAY, StockChartInterval.FIVE_DAY].includes(activeChart.timeIndex)) return
    setState(d => { d.state[d.activeChartIndex - 1].type = activeChart.type === 'k-line' ? 'line' : 'k-line' })
  }
  const indicators = useQuery({
    queryKey: [getStockIndicators.cacheKey],
    queryFn: () => getStockIndicators()
  })

  useUpdateEffect(() => {
    const s = indicators.data?.main.find(i => i.name === '缠论系统')
    if (s) {
      const activeSystem = state[activeChartIndex - 1].system
      if (s.indicators.find(i => i.id === activeSystem)?.authorized !== 1) {
        const newSys = s.indicators.find(i => i.authorized === 1)?.id
        if (!newSys) return
        setState(d => { d.state[activeChartIndex - 1].system = newSys })
      }
    }

  }, [indicators.data, activeChartIndex, state])

  const indicatorItems = (indicators.data?.main.find(o => o.name === '缠论系统')?.indicators.find(o => o.id === activeChart.system) as any)?.items as StockIndicator[] | undefined

  const onChangeMainIndicator = (id: string) => {
    setState(d => {
      const index = d.state[d.activeChartIndex - 1].mainIndicators.indexOf(id)
      if (index === -1) {
        d.state[d.activeChartIndex - 1].mainIndicators.push(id)
      } else {
        d.state[d.activeChartIndex - 1].mainIndicators.splice(index, 1)
      }
    })
  }
  return (
    <>
      <div className="border-style-primary flex items-center px-2 !border-t-0">
        <div className="flex items-center space-x-3 border-0 border-r border-solid border-border pr-4">
          {
            CHART_TOOL.map((item, index) => (
              <JknIcon key={item} label={item} className="w-4 h-4 py-1.5" name={`stock_${index + 1}` as IconName} checked={toolType === item} onClick={() => setToolType(item)} />
            ))
          }
        </div>
        <div className="pl-4 h-[30px] flex items-center">
          {{
            '主图指标': <MainIndicator data={indicators.data} />,

            '线型切换': (
              <div className="flex items-center space-x-3 text-xs">
                <div
                  onClick={onChangeMainChartType} onKeyDown={() => { }}
                  className={cn('flex items-center cursor-pointer', activeChart.type === 'line' && 'text-primary')}><JknIcon name="line_type_1" className="w-4 h-4 mr-1" checked={activeChart.type === 'line'} />折线图</div>
                <div
                  onClick={onChangeMainChartType} onKeyDown={() => { }}
                  className={cn('flex items-center cursor-pointer', activeChart.type === 'k-line' && 'text-primary')}><JknIcon name="line_type_2" className="w-4 h-4 mr-1" checked={activeChart.type === 'k-line'} />蜡烛图</div>
              </div>
            ),
            '多图模式': <ViewModeSelect />
          }[toolType] ?? null}
        </div>
      </div>
      <div className="border-style-primary flex items-center px-2 !border-t-0 space-x-4">
        {
          indicatorItems ? (
            indicatorItems.map(item => (
              <div key={item.id} className="flex items-center space-x-1">
                <JknIcon.Checkbox
                  onClick={() => onChangeMainIndicator(item.id)}
                  checked={activeChart.mainIndicators.includes(item.id)}
                  checkedIcon={`chan_tool_${item.id}_sel` as IconName}
                  uncheckedIcon={`chan_tool_${item.id}_nor` as IconName}
                  className="w-6 h-6 rounded-none" />
                <div className="text-xs">{item.name}</div>
              </div>
            ))
          ) : null
        }
      </div>
    </>
  )
}
