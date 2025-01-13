import { getStockIndicators, type StockIndicator } from "@/api"
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, HoverCard, HoverCardContent, HoverCardTrigger, JknIcon, StockSelect } from "@/components"
import { cn } from "@/utils/style"
import { useQuery } from "@tanstack/react-query"
import { useUpdateEffect } from "ahooks"
import { useMemo, useState } from "react"
import { type CoilingIndicatorId, useKChartContext } from "../lib"
import { MainIndicator } from "./main-indicator"
import { ViewModeSelect } from "./view-mode-select"
import { SearchList } from "./search-list"
import { nanoid } from "nanoid"
import { useDomSize } from "@/hooks"

const CHART_TOOL = ['主图指标', '线型切换', '多图模式', '股票PK', '叠加标记', '画线工具']

const ItemWidth = 76

export const ChartToolSelect = () => {
  const [toolType, setToolType] = useState<string>('主图指标')
  const { state, activeChartIndex, toggleMainChartType, setMainSystem, setMainIndicators, setMainCoiling, addOverlayStock } = useKChartContext()
  const [size, dom] = useDomSize<HTMLDivElement>()

  const showCount = useMemo(() => {
    if (!size) return 6
    const count = Math.floor((size?.width) / ItemWidth) - 1
    return count
  }, [size])


  const activeChart = state[activeChartIndex]
  const onChangeMainChartType = () => {
    toggleMainChartType({})
  }
  const indicators = useQuery({
    queryKey: [getStockIndicators.cacheKey],
    queryFn: () => getStockIndicators()
  })

  useUpdateEffect(() => {
    const s = indicators.data?.main.find(i => i.name === '缠论系统')
    if (s) {
      const activeSystem = state[activeChartIndex].system
      if (s.indicators.find(i => i.id === activeSystem)?.authorized !== 1) {
        const newSys = s.indicators.find(i => i.authorized === 1)?.id
        if (!newSys) return
        setMainSystem({ system: newSys })
      }
    }

  }, [indicators.data, activeChartIndex, state])

  const indicatorItems = (indicators.data?.main.find(o => o.name === '缠论系统')?.indicators.find(o => o.id === activeChart?.system) as any)?.items as StockIndicator[] | undefined

  const onChangeMainCoiling = (id: CoilingIndicatorId) => {
    const coiling = [...activeChart.mainCoiling]
    const index = coiling.indexOf(id)
    if (index === -1) {
      coiling.push(id)
    } else {
      coiling.splice(index, 1)
    }
    setMainCoiling({ coiling })
  }

  const onChangeMainIndicator = (_: any, data: any[]) => {
    setMainIndicators({ indicators: data.map(v => ({ id: v.value, type: v.extra.db_type, timeIndex: activeChart.timeIndex, symbol: activeChart.symbol, key: nanoid() })) })
  }

  const onOverlayClick = (symbol: string) => {
    addOverlayStock({ symbol })
  }

  return (
    <div className="whitespace-nowrap">
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
            '主图指标': (
              <div className="flex items-center space-x-4">
                <MainIndicator data={indicators.data} />
                {
                  indicators.data?.main.filter(i => i.name !== '缠论系统').map(item => (
                    <HoverCard openDelay={100} closeDelay={100} key={item.id}>
                      <HoverCardTrigger className="">
                        <span className="text-sm flex items-center cursor-pointer">
                          <span>{item.name}</span>
                          <JknIcon name="arrow_down" className="w-3 h-3 ml-1" />
                        </span>
                      </HoverCardTrigger>
                      <HoverCardContent side="top" className="w-fit p-0">
                        <SearchList key={item.id} value={Reflect.ownKeys(activeChart.mainIndicators).map(v => v.toString())} data={item.indicators.map(v => ({ label: v.name ?? '', value: v.id, extra: v }))} type="multi" name={item.name} onChange={onChangeMainIndicator} />
                      </HoverCardContent>
                    </HoverCard>

                  ))
                }
              </div>
            ),
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
            '多图模式': <ViewModeSelect />,
            '股票PK': <div className="flex items-center space-x-4 text-sm"><span>叠加股票</span><StockSelect size="mini" onChange={onOverlayClick} /></div>,
            '叠加标记': <MarkList />
          }[toolType] ?? null}
        </div>
      </div>
      <div className="border-style-primary  !border-t-0 space-x-4" ref={dom}>
        {
          indicatorItems ? (
            <div className="flex items-center px-2 space-x-2">
              {
                indicatorItems.slice(0, showCount).map(item => (
                  <div key={item.id} className="flex items-center space-x-1">
                    <JknIcon.Checkbox
                      onClick={() => onChangeMainCoiling(item.id as any)}
                      checked={activeChart.mainCoiling.includes(item.id as any)}
                      checkedIcon={`chan_tool_${item.id}_sel` as IconName}
                      uncheckedIcon={`chan_tool_${item.id}_nor` as IconName}
                      className="w-6 h-6 rounded-none" />
                    <div className="text-xs">{item.name}</div>
                  </div>
                ))
              }
              {
                showCount < indicatorItems.length ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex-shrink-0">
                        <Button reset className="text-xs font-normal h-6">
                          更多
                        </Button>
                        <JknIcon name="arrow_down" className="w-2 h-2  ml-1" />
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {
                        indicatorItems.slice(showCount).map((item) => (
                          <DropdownMenuItem key={item.id} onClick={() => onChangeMainCoiling(item.id as any)}>
                            <div key={item.id} className="flex items-center space-x-1">
                              <JknIcon.Checkbox
                                checked={activeChart.mainCoiling.includes(item.id as any)}
                                checkedIcon={`chan_tool_${item.id}_sel` as IconName}
                                uncheckedIcon={`chan_tool_${item.id}_nor` as IconName}
                                className="w-6 h-6 rounded-none" />
                              <div className="text-xs">{item.name}</div>
                            </div>
                          </DropdownMenuItem>
                        ))
                      }
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : null
              }
            </div>
          ) : null
        }
      </div>
    </div>
  )
}


const MarkList = () => {
  const { overMarkList, state, activeChartIndex, setOverlayMark } = useKChartContext()

  const activeChart = state[activeChartIndex]



  return (
    <div className="flex items-center space-x-4">
      {
        overMarkList.map(mark => (
          <HoverCard key={mark.key} openDelay={100} closeDelay={200}>
            <HoverCardTrigger className="">
              <span className="text-sm flex items-center cursor-pointer">
                <span>{mark.title}</span>
                <JknIcon name="arrow_down" className="w-3 h-3 ml-1" />
              </span>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="w-fit p-0">
              <SearchList search={false} onChange={(v, d) => { setOverlayMark({ mark: v, type: mark.key, title: d.label }) }} type="single" key={mark.key} data={mark.value.map(t => ({ label: t.name, value: t.key, extra: { title: t.name } }))} name={mark.title} value={activeChart.overlayMark?.mark} />
            </HoverCardContent>
          </HoverCard>

        ))
      }
    </div>
  )
}