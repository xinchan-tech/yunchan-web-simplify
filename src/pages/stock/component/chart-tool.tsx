import { type StockIndicator, getStockIndicators, getStockTabList } from '@/api'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  JknIcon,
  StockSelect
} from '@/components'
import { useDomSize } from '@/hooks'
import { calcIndicator } from '@/utils/coiling'
import { cn } from '@/utils/style'
import { useQuery } from '@tanstack/react-query'
import { nanoid } from 'nanoid'
import { useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { type CoilingIndicatorId, type Indicator, kChartUtils, useKChartStore } from '../lib'
import { chartEvent } from '../lib/event'
import { MainIndicator } from './main-indicator'
import { SearchList } from './search-list'
import { ViewModeSelect } from './view-mode-select'

const CHART_TOOL = ['主图指标', '线型切换', '多图模式', '股票PK', '叠加标记', '画线工具']

const ItemWidth = 76

export const ChartToolSelect = () => {
  const [toolType, setToolType] = useState<string>('主图指标')

  const indicators = useQuery({
    queryKey: [getStockIndicators.cacheKey],
    queryFn: () => getStockIndicators()
  })

  const onOverlayClick = (symbol: string) => {
    kChartUtils.setYAxis({ yAxis: { right: 'percent' } })
    kChartUtils.addOverlayStock({ symbol })
  }

  return (
    <div className="whitespace-nowrap">
      <div className="border-style-primary flex items-center px-2 !border-t-0">
        <div className="flex items-center space-x-3 border-0 border-r border-solid border-border pr-4">
          {CHART_TOOL.map((item, index) => (
            <JknIcon
              key={item}
              label={item}
              className="w-4 h-4 py-1.5"
              name={`stock_${index + 1}` as IconName}
              checked={toolType === item}
              onClick={() => setToolType(item)}
            />
          ))}
        </div>
        <div className="pl-4 h-[30px] flex items-center flex-1">
          {{
            '主图指标': <MainIndicatorSelect indicators={indicators.data} />,
            '线型切换': <LineTypeSelect />,
            '多图模式': <ViewModeSelect />,
            '股票PK': (
              <div className="flex items-center space-x-4 text-sm">
                <span>叠加股票</span>
                <StockSelect size="mini" onChange={onOverlayClick} />
              </div>
            ),
            '叠加标记': <MarkList />
          }[toolType] ?? null}
        </div>
      </div>
      <CoilingList indicators={indicators.data} />
    </div>
  )
}

/**
 * 主图指标
 */
const MainIndicatorSelect = ({ indicators }: { indicators?: Awaited<ReturnType<typeof getStockIndicators>> }) => {
  const timeIndex = useKChartStore(s => s.state[s.activeChartIndex].timeIndex)
  const symbol = useKChartStore(s => s.state[s.activeChartIndex].symbol)
  const mainIndicators = useKChartStore(s => s.state[s.activeChartIndex].mainIndicators)

  const currentIndex = useKChartStore(s => s.activeChartIndex)

  const onChangeMainIndicator = async (_: any, data: any, name: string) => {
    const mainIndicators = useKChartStore.getState().state[useKChartStore.getState().activeChartIndex].mainIndicators
    const indicators: Indicator[] = []
    Object.values(mainIndicators).forEach((value) => {
      if (value.id !== data.value) {
        indicators.push(value)
      }
    })

    if (indicators.length === Object.keys(mainIndicators).length) {
      indicators.push({
        id: data.value,
        type: data.extra.db_type,
        timeIndex,
        symbol,
        key: nanoid(),
        name: name,
        formula: data.extra.formula,
        calcType: data.extra.calcType
      })

      kChartUtils.setMainIndicators({ indicators })
      const candlesticks = useKChartStore.getState().state[useKChartStore.getState().activeChartIndex].mainData.history
      await calcIndicator(
        { formula: data.extra.formula, symbal: symbol, indicatorId: data.value },
        candlesticks,
        timeIndex
      ).then(c => {
        kChartUtils.setIndicatorData({ index: currentIndex, indicatorId: data.value, data: c.data })
      })

    } else {

      kChartUtils.setMainIndicators({ indicators })
      kChartUtils.setIndicatorData({ index: currentIndex, indicatorId: data.value, data: [] })
    }





    // const r = await data.map(v => {
    //   return 
    // })

    // await Promise.all(r).then(data => {
    //   kChartUtils.setIndicatorsData({ index: currentIndex, data })
    // })

    chartEvent.event.emit('indicatorChange', { index: currentIndex })
  }

  return (
    <div className="flex items-center space-x-4 w-full">
      <MainIndicator data={indicators} />
      {indicators?.main
        .filter(i => i.name !== '缠论系统')
        .map(item => (
          <HoverCard openDelay={100} closeDelay={100} key={item.id}>
            <HoverCardTrigger className="">
              <span className="text-sm flex items-center cursor-pointer">
                <span>{item.name}</span>
                <JknIcon name="arrow_down" className="w-3 h-3 ml-1" />
              </span>
            </HoverCardTrigger>
            <HoverCardContent side="top" className="w-fit p-0">
              <SearchList
                key={item.id}
                value={Reflect.ownKeys(mainIndicators).map(v => v.toString())}
                data={item.indicators.map(v => ({ label: v.name ?? '', value: v.id, extra: v }))}
                type="multi"
                name={item.name}
                onChange={onChangeMainIndicator}
              />
            </HoverCardContent>
          </HoverCard>
        ))}
      <div className="!ml-auto flex items-center cursor-pointer" onClick={() => kChartUtils.setBackTest({})} onKeyDown={() => { }}>
        <JknIcon name="ic_replay" className="w-4 h-3.5" />
        <span className="text-sm">回测</span>
      </div>
    </div>
  )
}

/**
 * 线型切换
 * @returns
 */
const LineTypeSelect = () => {
  const onChangeMainChartType = (type?: 'line' | 'k-line') => {
    kChartUtils.toggleMainChartType({ type: type })
  }

  const chartType = useKChartStore(s => s.state[s.activeChartIndex].type)

  return (
    <div className="flex items-center space-x-3 text-xs">
      <div
        onClick={() => onChangeMainChartType('line')}
        onKeyDown={() => { }}
        className={cn('flex items-center cursor-pointer', chartType === 'line' && 'text-primary')}
      >
        <JknIcon name="line_type_1" className="w-4 h-4 mr-1" checked={chartType === 'line'} />
        折线图
      </div>
      <div
        onClick={() => onChangeMainChartType('k-line')}
        onKeyDown={() => { }}
        className={cn('flex items-center cursor-pointer', chartType === 'k-line' && 'text-primary')}
      >
        <JknIcon name="line_type_2" className="w-4 h-4 mr-1" checked={chartType === 'k-line'} />
        蜡烛图
      </div>
    </div>
  )
}

const MarkList = () => {
  const tabList = useQuery({
    queryKey: [getStockTabList.cacheKey],
    queryFn: () => getStockTabList(),
    placeholderData: () => []
  })

  const overlayMark = useKChartStore(s => s.state[s.activeChartIndex].overlayMark)

  return (
    <div className="flex items-center space-x-4">
      {tabList.data?.map(mark => (
        <HoverCard key={mark.key} openDelay={100} closeDelay={200}>
          <HoverCardTrigger className="">
            <span className="text-sm flex items-center cursor-pointer">
              <span>{mark.title}</span>
              <JknIcon name="arrow_down" className="w-3 h-3 ml-1" />
            </span>
          </HoverCardTrigger>
          <HoverCardContent side="top" className="w-fit p-0">
            <SearchList
              search={false}
              onChange={(v, d) => {
                kChartUtils.setOverlayMark({ mark: v, type: mark.key, title: d.label })
              }}
              type="single"
              key={mark.key}
              data={mark.value.map(t => ({ label: t.name, value: t.key, extra: { title: t.name } }))}
              name={mark.title}
              value={overlayMark?.mark}
            />
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  )
}

const CoilingList = ({ indicators }: { indicators?: Awaited<ReturnType<typeof getStockIndicators>> }) => {
  const system = useKChartStore(s => s.state[s.activeChartIndex].system)
  const indicatorItems = (
    indicators?.main.find(o => o.name === '缠论系统')?.indicators.find(o => o.id === system) as any
  )?.items as StockIndicator[] | undefined
  const mainCoiling = useKChartStore(useShallow(s => s.state[s.activeChartIndex].mainCoiling))
  const [size, dom] = useDomSize<HTMLDivElement>()

  const showCount = useMemo(() => {
    if (!size) return 6
    const count = Math.floor(size?.width / ItemWidth) - 1
    return count
  }, [size])

  const onChangeMainCoiling = (id: CoilingIndicatorId) => {
    const coiling = [...mainCoiling]
    const index = coiling.indexOf(id)
    if (index === -1) {
      coiling.push(id)
    } else {
      coiling.splice(index, 1)
    }
    kChartUtils.setMainCoiling({ coiling })
  }

  return (
    <div className="border-style-primary  !border-t-0 space-x-4" ref={dom}>
      {indicatorItems ? (
        <div className="flex items-center px-2 space-x-2">
          {indicatorItems.slice(0, showCount).map(item => (
            <div key={item.id} className="flex items-center space-x-1">
              <JknIcon.Checkbox
                onClick={() => onChangeMainCoiling(item.id as any)}
                checked={mainCoiling.includes(item.id as any)}
                checkedIcon={`chan_tool_${item.id}_sel` as IconName}
                uncheckedIcon={`chan_tool_${item.id}_nor` as IconName}
                className="w-6 h-6 rounded-none"
              />
              <div className="text-xs">{item.name}</div>
            </div>
          ))}
          {showCount < indicatorItems.length ? (
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
                {indicatorItems.slice(showCount).map(item => (
                  <DropdownMenuItem key={item.id} onClick={() => onChangeMainCoiling(item.id as any)}>
                    <div key={item.id} className="flex items-center space-x-1">
                      <JknIcon.Checkbox
                        checked={mainCoiling.includes(item.id as any)}
                        checkedIcon={`chan_tool_${item.id}_sel` as IconName}
                        uncheckedIcon={`chan_tool_${item.id}_nor` as IconName}
                        className="w-6 h-6 rounded-none"
                      />
                      <div className="text-xs">{item.name}</div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
