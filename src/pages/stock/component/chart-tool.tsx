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
import { useAuthorized, useDomSize, useToast } from '@/hooks'
import { cn } from '@/utils/style'
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { kChartUtils, useKChartStore } from '../lib'
import { chartEvent } from '../lib/event'
import { ChartType, chartManage, useChartManage } from '../lib/store'
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

  const [authPermission] = useAuthorized('stockCompare')
  const { toast } = useToast()
  const onOverlayClick = (symbol: string) => {
    if (!authPermission()) {
      toast({
        description: '暂无相关权限，请联系客服'
      })
      return
    }
    chartManage.setStockOverlay(symbol)
    chartEvent.get().emit('stockCompareChange', { type: 'add', symbol })
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
  // const mainIndicators = useKChartStore(s => s.state[s.activeChartIndex].mainIndicators)

  // const currentIndex = useKChartStore(s => s.activeChartIndex)
  const mainIndicators = useChartManage(s => s.getActiveChart().mainIndicators)

  const onChangeMainIndicator = async (_: any, data: any, name: string) => {
    const index = mainIndicators.findIndex(v => v.id === data.value)
    if (index > -1) {
      chartManage.removeMainIndicator(data.value)
    } else {
      const indicators = {
        id: data.value,
        type: data.extra.db_type,
        name: name,
        calcType: data.extra.calcType
      }
      chartManage.addMainIndicator(indicators)
    }
  }

  useEffect(() => {
    const systems = indicators?.main.find(o => o.name === '缠论系统')?.indicators
    let systemId: string | undefined = undefined

    if (systems && systems.length > 0) {
      systems.forEach(system => {
        if (system.authorized) {
          systemId = system.id
        }
      })

      kChartUtils.setMainSystem({ system: systemId })

      if (!systemId) {
        kChartUtils.setMainCoiling({ coiling: [] })
      }
    }
  }, [indicators])

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
                value={mainIndicators.map(v => v.id.toString())}
                data={item.indicators.map(v => ({
                  label: v.name ?? '',
                  value: v.id,
                  extra: v,
                  notAuthorized: v.authorized === 0
                }))}
                type="multi"
                name={item.name}
                onChange={onChangeMainIndicator}
              />
            </HoverCardContent>
          </HoverCard>
        ))}
      <div
        className="!ml-auto flex items-center cursor-pointer"
        onClick={() => kChartUtils.setBackTest({})}
        onKeyDown={() => {}}
      >
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
  const onChangeMainChartType = (type: ChartType) => {
    chartManage.setType(type)
  }

  const chartType = useChartManage(s => s.getActiveChart().type)

  return (
    <div className="flex items-center space-x-3 text-xs">
      <div
        onClick={() => onChangeMainChartType(ChartType.Area)}
        onKeyDown={() => {}}
        className={cn('flex items-center cursor-pointer', chartType === ChartType.Area && 'text-primary')}
      >
        <JknIcon name="line_type_1" className="w-4 h-4 mr-1" checked={chartType === ChartType.Area} />
        折线图
      </div>
      <div
        onClick={() => onChangeMainChartType(ChartType.Candle)}
        onKeyDown={() => {}}
        className={cn('flex items-center cursor-pointer', chartType === ChartType.Candle && 'text-primary')}
      >
        <JknIcon name="line_type_2" className="w-4 h-4 mr-1" checked={chartType === ChartType.Candle} />
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

  const overlayMark = useChartManage(s => s.getActiveChart().overlayMark)

  const [authPermission] = useAuthorized('overlayMark')

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
                chartManage.setMarkOverlay(v, mark.key)
                chartEvent
                  .get()
                  .emit('markOverlayChange', { type: 'add', params: { mark: v, type: mark.key, title: d.label } })
              }}
              type="single"
              key={mark.key}
              data={mark.value.map(t => ({
                label: t.name,
                value: t.key,
                extra: { title: t.name },
                notAuthorized: !authPermission()?.some(v => mark.key.startsWith(v))
              }))}
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
  // const system = useKChartStore(s => s.state[s.activeChartIndex].system)
  const system = useChartManage(s => s.getActiveChart().system)
  const indicatorItems = (
    indicators?.main.find(o => o.name === '缠论系统')?.indicators.find(o => o.id === system) as any
  )?.items as StockIndicator[] | undefined
  const coiling = useChartManage(useShallow(s => s.chartStores[s.activeChartId].coiling))
  const [size, dom] = useDomSize<HTMLDivElement>()

  const showCount = useMemo(() => {
    if (!size) return 6
    const count = Math.floor(size?.width / ItemWidth) - 1
    return count
  }, [size])

  return (
    <div className="border-style-primary  !border-t-0 space-x-4" ref={dom}>
      {indicatorItems ? (
        <div className="flex items-center px-2 space-x-2">
          {indicatorItems.slice(0, showCount).map(item => (
            <div key={item.id} className="flex items-center space-x-1">
              <JknIcon.Checkbox
                onClick={() => chartManage.setCoiling(item.id as any)}
                checked={coiling.includes(item.id as any)}
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
                  <DropdownMenuItem key={item.id} onClick={() => chartManage.setCoiling(item.id as any)}>
                    <div key={item.id} className="flex items-center space-x-1">
                      <JknIcon.Checkbox
                        checked={coiling.includes(item.id as any)}
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
