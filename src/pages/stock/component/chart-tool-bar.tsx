import { addStockIndicatorCollect, getStockIndicators, getStockIndicatorsV2, getStockTabList, removeStockCollectCate, StockChartInterval, type StockIndicator } from '@/api'
import {
  CoilingIndicatorId,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardArrow,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  JknIcon,
  JknSearchInput,
  ScrollArea,
  Separator,
  StockAlarm,
  ToggleGroup,
  ToggleGroupItem,
  useModal
} from '@/components'
import { stockUtils } from '@/utils/stock'
import { Fragment, memo, type PropsWithChildren, type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import { timeIndex, useSymbolQuery } from '../lib'
import { ChartType, chartManage, useChartManage } from '../lib/store'
import { renderUtils } from '../lib/utils'
import { useQuery } from "@tanstack/react-query"
import { useAuthorized, useLatestRef, useOptimisticUpdate, useStockSearch, useToast } from "@/hooks"
import { useLocalStorageState, useVirtualList } from "ahooks"
import { cn } from "@/utils/style"
import { chartEvent } from "../lib/event"
import { IndicatorParamsForm } from "./indicator-param-form"

const WrapperLabel = ({ children, label }: PropsWithChildren<{ label: string | ReactNode }>) => {
  return (
    <HoverCard openDelay={300} closeDelay={300}>
      <HoverCardTrigger asChild>{children}</HoverCardTrigger>

      <HoverCardContent align="center" side="bottom" className="w-fit py-1 px-2 text-sm">
        <HoverCardArrow width={10} height={4} className="text-accent fill-accent" />
        {label}
      </HoverCardContent>
    </HoverCard>
  )
}
export const ChartToolBar = () => {
  const symbol = useSymbolQuery()

  return (
    <div className="">
      <div className="flex items-center h-11 py-1 box-border w-full bg-background text-sm text-foreground px-4 leading-9">
        <WrapperLabel label="股票代码">
          <div className="flex items-center mr-2">
            <JknIcon.Stock symbol={symbol} />
            &nbsp;
            <span className="text-base text-foreground">{symbol}</span>
          </div>
        </WrapperLabel>
        {/* <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" /> */}
        {/* <TimeShareSelect /> */}
        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <WrapperLabel label="股票周期">
          <div className="flex items-center mr-2">
            <PeriodSelect />
          </div>
        </WrapperLabel>
        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <WrapperLabel label="线型切换">
          <div >
            <ChartTypeSelect />
          </div>
        </WrapperLabel>
        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <IndicatorPicker />
        <WrapperLabel label="视图模式">
          <div>
            <ViewModeSelect />
          </div>
        </WrapperLabel>
        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <StockPkPicker />

        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <OverlayMarkPicker />
        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <AlarmPicker />
        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <WrapperLabel label="股票回测">
          <div >
            <BackTest />
          </div>
        </WrapperLabel>
      </div>
    </div>
  )
}

export const CoilingBar = () => {
  // const coiling = useChartManage.getState().getActiveChart().mainIndicators
  // type === 21时是缠论的选择
  // const hasCoiling = useChartManage.getState().getActiveChart().mainIndicators.find(i => +i.type === 21)
  const system = useChartManage(s => s.getActiveChart().system)
  // const indicator = useQuery({
  //   queryKey: [getStockIndicators.cacheKey],
  //   queryFn: getStockIndicators
  // })

  // const coilingList = indicator.data?.main.find(i => i.name === '缠论系统')?.indicators.find(o => o.id === system)?.items
  const coiling = useChartManage(s => s.getActiveChart().coiling)

  const coilingList = [
    { name: '笔', id: CoilingIndicatorId.PEN },
    { name: '1类', id: CoilingIndicatorId.ONE_TYPE },
    { name: '2类', id: CoilingIndicatorId.TWO_TYPE },
    { name: '3类', id: CoilingIndicatorId.THREE_TYPE },
    { name: '中枢', id: CoilingIndicatorId.PIVOT }
  ]

  const _onClickCoiling = (id: string) => {
    if (coiling.includes(id as any)) {
      chartManage.removeCoiling(id as any)
    } else {
      chartManage.addCoiling(id as any)
    }
  }

  if (!coiling) return null

  return (
    <>
      {
        system ? (
          coilingList?.map(c => {
            const render = () => {
              switch (c.id) {
                case CoilingIndicatorId.PEN:
                  return (
                    <span className="cursor-pointer" onClick={() => _onClickCoiling(c.id)} onKeyDown={() => { }}>
                      <JknIcon.Svg name="mins" size={12} className="mr-1" style={{ color: coiling.includes(c.id) ? '#E7C88D' : '#575757' }} />
                      <span style={{ color: coiling.includes(c.id) ? '#DBDBDB' : '#575757' }}>{c.name}</span>
                    </span>
                  )
                case CoilingIndicatorId.ONE_TYPE:
                case CoilingIndicatorId.TWO_TYPE:
                case CoilingIndicatorId.THREE_TYPE:
                  return (
                    <span className="cursor-pointer flex items-center" onClick={() => _onClickCoiling(c.id as any)} onKeyDown={() => { }}>
                      <JknIcon.Checkbox checked={coiling.includes(c.id)} uncheckedIcon="chart-coiling-bs" checkedIcon="chart-coiling-bs-active" className="h-4 w-4 rounded mr-1" />
                      <span style={{ color: coiling.includes(c.id) ? '#DBDBDB' : '#575757' }}>{c.name}</span>
                    </span>
                  )
                case CoilingIndicatorId.PIVOT:
                  return (
                    <span className="cursor-pointer flex items-center" onClick={() => _onClickCoiling(c.id as any)} onKeyDown={() => { }}>
                      <JknIcon.Svg name="poivts" size={16} style={{ color: coiling.includes(c.id) ? '#808080' : '#575757' }} />
                      <span style={{ color: coiling.includes(c.id) ? '#DBDBDB' : '#575757' }}>{c.name}</span>
                    </span>
                  )
                default:
                  return null
              }
            }
            return (
              <Fragment key={c.id}>
                {
                  render()
                }
              </Fragment>
            )
          })
        ) : null
      }
    </>
  )
}

//分时图选择
export const TimeShareSelect = memo(() => {
  const interval = useChartManage(s => s.getActiveChart().interval)

  const intervalStr = useMemo(() => {
    if (!renderUtils.isTimeIndexChart(interval))
      return stockUtils.intervalToStr(StockChartInterval.INTRA_DAY).slice(0, 2)
    return stockUtils.intervalToStr(interval).slice(0, 2)
  }, [interval])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className="cursor-pointer hover:bg-accent inline-block h-full rounded leading-9 px-3">
          {intervalStr}
          &nbsp;
          <JknIcon.Svg name="arrow-down" className="w-2 h-2" />
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" alignOffset={-10}>
        <DropdownMenuItem
          data-checked={interval === StockChartInterval.PRE_MARKET}
          onClick={() => chartManage.setInterval(StockChartInterval.PRE_MARKET)}
        >
          盘前分时
        </DropdownMenuItem>
        <DropdownMenuItem
          data-checked={interval === StockChartInterval.INTRA_DAY}
          onClick={() => chartManage.setInterval(StockChartInterval.INTRA_DAY)}
        >
          盘中分时
        </DropdownMenuItem>
        <DropdownMenuItem
          data-checked={interval === StockChartInterval.AFTER_HOURS}
          onClick={() => chartManage.setInterval(StockChartInterval.AFTER_HOURS)}
        >
          盘后分时
        </DropdownMenuItem>
        <DropdownMenuItem
          data-checked={interval === StockChartInterval.FIVE_DAY}
          onClick={() => chartManage.setInterval(StockChartInterval.FIVE_DAY)}
        >
          多日分时
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

export const PeriodSelect = memo(() => {
  const interval = useChartManage(s => s.getActiveChart().interval)

  const intervalStr = useMemo(() => {
    if (renderUtils.isTimeIndexChart(interval)) return '分时图'
    return stockUtils.intervalToStr(interval)
  }, [interval])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className="cursor-pointer hover:bg-accent inline-block h-full rounded leading-9 px-3">{intervalStr}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" alignOffset={-10}>
        <DropdownMenuItem data-checked={renderUtils.isTimeIndexChart(interval)} onClick={() => chartManage.setInterval(StockChartInterval.INTRA_DAY)}>
          分时图
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-[#2E2E2E]" />
        {timeIndex.slice(4).map(i => (
          <Fragment key={i} >
            <DropdownMenuItem data-checked={interval === i} onClick={() => chartManage.setInterval(i)}>
              {stockUtils.intervalToStr(i)}
            </DropdownMenuItem>
            {
              i === StockChartInterval.FORTY_FIVE_MIN || i === StockChartInterval.FOUR_HOUR ? (
                <DropdownMenuSeparator className="bg-[#2E2E2E]" />
              ) : null
            }
          </Fragment>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

export const ChartTypeSelect = memo(() => {
  const chartType = useChartManage(s => s.getActiveChart().type)
  const interval = useChartManage(s => s.getActiveChart().interval)

  const onChartTypeChange = (type: ChartType) => {
    if (type === ChartType.Candle && renderUtils.isTimeIndexChart(interval)) {
      chartManage.setInterval(StockChartInterval.ONE_MIN)
    }
    chartManage.setType(type)
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className="cursor-pointer hover:bg-accent rounded flex px-3 h-9">
          <JknIcon.Svg
            name={renderUtils.isTimeIndexChart(interval) ? 'chart-area' : chartType === ChartType.Candle ? 'chart-candle' : 'chart-area'}
            size={20}
            className="m-auto"
          />
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" alignOffset={-10}>
        <DropdownMenuItem
          data-checked={renderUtils.isTimeIndexChart(interval) || chartType === ChartType.Area}
          onClick={() => onChartTypeChange(ChartType.Area)}
        >
          <JknIcon.Svg name="chart-area" size={20} />
          折线图
        </DropdownMenuItem>
        <DropdownMenuItem
          data-checked={!renderUtils.isTimeIndexChart(interval) && chartType === ChartType.Candle}
          onClick={() => onChartTypeChange(ChartType.Candle)}
        >
          <JknIcon.Svg name="chart-candle" size={20} />
          K线图
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

const IndicatorPicker = memo(() => {
  const paramsForm = useModal({
    content: <IndicatorParamsForm />,
    title: '指标参数',
    footer: null
  })

  const modal = useModal({
    content: <IndicatorModal onClickParams={() => paramsForm.modal.open()} />,
    title: '指标策略',
    className: 'w-[667px] bg-[#1F1F1F]',
    footer: false,
    closeIcon: true
  })

  useEffect(() => {
    const handler = () => {
      modal.modal.open()
    }
    
   chartEvent.get().on('showIndicatorSetting', handler)

   
    return () => {
      chartEvent.get().off('showIndicatorSetting', handler)
    }
  },  [modal.modal])



  return (
    <>
      <WrapperLabel label="指标策略">
        <div className="cursor-pointer hover:bg-accent h-full rounded px-3 flex items-center" onClick={() => modal.modal.open()} onKeyDown={() => { }}>
          <JknIcon.Svg name="chart-indicator" size={20} />
          &nbsp;
          <span>指标</span>
        </div>
      </WrapperLabel>
      {
        modal.context
      }
      {
        paramsForm.context
      }
    </>
  )
})

export const IndicatorModal = (props: { onClickParams: () => void }) => {
  // const indicator = useQuery({
  //   queryKey: [getStockIndicators.cacheKey],
  //   queryFn: getStockIndicators
  // })
  const indicator = useQuery({
    queryKey: [getStockIndicatorsV2.cacheKey],
    queryFn: getStockIndicatorsV2
  })
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<Nullable<string>>()
  const [type, setType] = useState<'main' | 'secondary'>('main')
  const mainIndicators = useChartManage(s => s.getActiveChart().mainIndicators)
  const secondaryIndicators = useChartManage(s => s.getActiveChart().secondaryIndicators)
  const system = useChartManage(s => s.getActiveChart().system)

  const onSearch = (keyword?: string) => {
    setSearch(keyword ?? '')
  }

  useEffect(() => {
    if (indicator.data && !category) {
      setCategory(indicator.data[0]?.id)
    }
  }, [indicator.data, category])

  const indicators = useMemo(() => {
    if (!indicator.data) return []

    const allList: StockIndicator[] = []

    if (category) {
      const list = indicator.data.find(i => i.id === category)

      if (!list) return []

      if (list.name === '收藏') {
        list.indicators?.forEach(i => {
          allList.push(i)
        })
        return allList
      }

      const t = list.items?.find(i => i.name.includes(type === 'main' ? '主图' : '副图'))

      if (!t) return []

      t.indicators?.forEach(i => {
        if (search && !i.name?.includes(search)) return

        allList.push(i)
      })

      return allList
    }

    return []

  }, [indicator.data, search, category, type])

  const [_, toastNotAuth] = useAuthorized()

  const onCheck = (i: StockIndicator) => {
    if (!i.authorized) {
      toastNotAuth()
      return
    }

    if (type === 'main') {
      if (mainIndicators.find(ii => ii.id === i.id)) {
        if (+i.type === 21) {
          chartManage.setSystem(undefined)
        }
        chartManage.removeMainIndicator(i.id)
      } else {
        if (+i.type === 21) {
          chartManage.setSystem(i.id)
        }
        chartManage.addMainIndicator({ id: i.id, name: i.name!, type: i.db_type!, calcType: i.value })
      }
    } else {
      if (secondaryIndicators.find(ii => ii.id === i.id)) {
        chartManage.removeSecondaryIndicator(i.id)
      } else {
        chartManage.addSecondaryIndicator({ id: i.id, name: i.name!, type: i.db_type!, calcType: i.value })
      }
    }
  }

  const checkedIndicator = useMemo(() => {
    const r = new Set<string>()

    mainIndicators.forEach(i => r.add(i.id))
    secondaryIndicators.forEach(i => r.add(i.id))
    system && r.add(system)

    return r
  }, [mainIndicators, secondaryIndicators, system])

  const collect = useOptimisticUpdate({
    cacheKey: [getStockIndicatorsV2.cacheKey],
    action: (params: { id: string, collect: boolean }) => params.collect ? addStockIndicatorCollect([params.id]) : removeStockCollectCate([params.id]),
    onOptimisticUpdate: (params: { id: string, collect: boolean }, draft: NonNullable<typeof indicator.data>) => {
      draft.forEach(i => {
        i.items?.forEach(o => {
          o.indicators?.forEach(oo => {
            if (oo.id === params.id) {
              oo.collect = params.collect ? 1 : 0
            }
          })
        })
      })
    },
    // onSuccess: () => {
    //   indicator.refetch()
    // }
  })



  return (
    <div className="h-[500px] flex flex-col text-secondary text-sm">
      <div className="border-b-primary flex items-center pr-4 pl-2">
        <JknSearchInput onSearch={onSearch} placeholder="搜索" className="h-8 placeholder:text-tertiary" rootClassName="text-tertiary flex-1" />
        <JknIcon.Svg name="setting" size={16} className="text-tertiary cursor-pointer" onClick={() => props.onClickParams()} />
      </div>
      <div className="flex-1 overflow-hidden flex">
        <div className="border-r-primary w-[160px] h-full flex-shrink-0 py-2">
          {/* <div data-checked={category === '缠论系统'}
            className="flex items-center pl-4 space-x-2 py-3 hover:bg-accent cursor-pointer data-[checked=true]:bg-accent"
            onClick={() => setCategory('缠论系统')} onKeyDown={() => { }}
          >
            <JknIcon.Svg name="fav" size={16} />
            <span>缠论系统</span>
          </div> */}
          {/* <div data-checked={category === '特色指标'}
            className="flex items-center pl-4 space-x-2 py-3 hover:bg-accent cursor-pointer data-[checked=true]:bg-accent"
            onClick={() => setCategory('特色指标')} onKeyDown={() => { }}
          >
            <JknIcon.Svg name="chart-indicator-spec" size={16} />
            <span>特色指标</span>
          </div>
          <div data-checked={category === '常规指标'}
            className="flex items-center pl-4 space-x-2 py-3 hover:bg-accent cursor-pointer data-[checked=true]:bg-accent"
            onClick={() => setCategory('常规指标')} onKeyDown={() => { }}
          >
            <JknIcon.Svg name="chart-indicator-normal" size={16} />
            <span>常规指标</span>
          </div> */}
          {
            indicator.data?.map(i => (
              <div data-checked={category === i.id} key={i.id}
                className="flex items-center pl-4 space-x-2 py-3 hover:bg-accent cursor-pointer data-[checked=true]:bg-accent"
                onClick={() => setCategory(i.id)} onKeyDown={() => { }}
              >
                <JknIcon.Svg name="chart-indicator-normal" size={16} />
                <span>{i.name}</span>
              </div>
            ))
          }
        </div>
        <div className="flex-1 overflow-auto py-2 box-border">
          {
            indicator.data?.find(i => i.id === category)?.name !== '收藏' ? (
              <ToggleGroup className="ml-8 my-2" type="single" value={type} onValueChange={setType as any}>
                <ToggleGroupItem value="main" className="rounded-2xl h-[24px] text-xs px-3 leading-1">主图</ToggleGroupItem>
                <ToggleGroupItem value="secondary" className="rounded-2xl h-[24px] text-xs px-3 leading-1">副图</ToggleGroupItem>
              </ToggleGroup>
            ) : null
          }
          {
            indicators.map(i => (
              <div key={i.name}
                className="flex items-center pl-2.5 pr-3.5 space-x-2 hover:bg-accent cursor-pointer py-1.5 data-[checked=true]:bg-[#2962FF4D] text-transparent hover:text-[#B8B8B8]"
                data-checked={checkedIndicator.has(i.id)}
                onClick={() => onCheck(i)} onKeyDown={() => { }}
              >
                {
                  i.collect === 1 ? (
                    <JknIcon.Svg name="fav-star" className="text-[#FFC440] p-1 rounded" size={16} onClick={(e) => { e.stopPropagation(); e.preventDefault(); collect.mutate({ id: i.id, collect: false }) }} />
                  ) : (
                    <JknIcon.Svg name="fav" className="hover:bg-[#4A4A4A] p-1 rounded" size={16} onClick={(e) => { e.stopPropagation(); e.preventDefault(); collect.mutate({ id: i.id, collect: true }) }} />
                  )
                }
                <span className="text-foreground">{i.name}</span>
                {
                  !i.authorized ? (
                    <JknIcon name="ic_lock" className="rounded-none" />
                  ) : null
                }
                {
                  checkedIndicator.has(i.id) ? (
                    <JknIcon.Svg name="check" size={10} className="rounded-none text-foreground !ml-auto mr-1" />
                  ) : null
                }
              </div>
            ))
          }
        </div>
      </div>
    </div>
  )
}

const viewModeMenuItems = [
  { name: '1图', icon: 'frame_1', value: 'single' },
  { name: '2图-上下', icon: 'frame_2_1', value: 'double' },
  { name: '2图-左右', icon: 'frame_2_2', value: 'double-vertical' },
  { name: '3图-上下', icon: 'frame_3_1', value: 'three-vertical-top-single' },
  { name: '3图-上下', icon: 'frame_3_2', value: 'three-vertical-bottom-single' },
  { name: '3图-左右', icon: 'frame_3_3', value: 'three-left-single' },
  { name: '3图-左右', icon: 'frame_3_4', value: 'three-right-single' },
  { name: '4图', icon: 'frame_4', value: 'four' },
  { name: '6图', icon: 'frame_5', value: 'six' },
  { name: '9图', icon: 'frame_6', value: 'nine' },
]

const ViewModeSelect = () => {
  const viewMode = useChartManage(s => s.viewMode)
  const onClick = (mode: string) => {
    chartManage.setViewMode(mode as any)
  }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className="cursor-pointer hover:bg-accent  h-9 rounded leading-9 px-3 flex items-center justify-center">
          <JknIcon name={viewModeMenuItems.find(i => i.value === viewMode)?.icon as any} className="w-5 h-5 rounded-none" />
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" alignOffset={-10}>
        {
          viewModeMenuItems.map(menu => (
            <DropdownMenuItem data-checked={viewMode === menu.value} key={menu.value} onClick={() => onClick(menu.value)}>
              <JknIcon className="w-4 h-4 rounded-none" name={menu.icon as any} />
              <span>{menu.name}</span>
            </DropdownMenuItem>
          ))
        }
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const StockPkPicker = () => {
  const modal = useModal({
    content: <StockPkModal />,
    title: '股票PK',
    className: 'w-[667px]',
    footer: false,
    closeIcon: true
  })

  return (
    <>
      <WrapperLabel label="股票PK">
        <div className="cursor-pointer hover:bg-accent  h-9 rounded px-3 flex items-center" onClick={() => modal.modal.open()} onKeyDown={() => { }}>
          <JknIcon.Svg name="chart-pk" size={20} />
        </div>
      </WrapperLabel>
      {
        modal.context
      }
    </>
  )
}

const StockPkModal = () => {
  const [search, setSearch] = useState('')

  const [searchResult] = useStockSearch(search)

  const pk = useChartManage(s => s.getActiveChart().overlayStock)

  const { toast } = useToast()

  const onClick = (symbol: string, name: string) => {
    if (pk.find(p => p.symbol === symbol)) return false
    const current = useChartManage.getState().getActiveChart().symbol

    if (current === symbol) {
      toast({
        description: '相同股票不能进行PK'
      })
      return false
    }

    const len = useChartManage.getState().getActiveChart().overlayStock.length

    if (len >= 5) {
      toast({
        description: '最多只能添加5只股票'
      })
      return false
    }

    chartManage.setStockOverlay(symbol, name)

    if (searchHistory?.find(p => p.symbol === symbol)) return true

    setSearchHistory([...(searchHistory ?? []), { symbol, name }])

    return true
  }

  const [searchHistory, setSearchHistory] = useLocalStorageState<typeof pk>('stock-pk-history', {
    defaultValue: []
  })

  return (
    <div className="flex h-[500px] flex-col text-sm">
      <div className="border-b-primary flex items-center px-4 flex-shrink-0 ">
        <JknIcon.Svg name="search" size={20} className="text-secondary" />
        <Input placeholder="搜索" value={search} onChange={(e) => setSearch(e.target.value)} className="border-none placeholder:text-tertiary text-secondary" />
      </div>

      {
        !search ? (
          <ScrollArea className="flex-1">
            <div className="px-4 text-xs text-tertiary mb-2 mt-4">已添加</div>
            <div>
              {
                pk.map(p => (
                  <div key={p.symbol} className="flex items-center px-4 py-1.5">
                    <JknIcon.Stock symbol={p.symbol} />
                    <div>
                      <div className="text-base leading-5">{p.symbol}</div>
                      <span className="text-xs text-tertiary">{p.name}</span>
                    </div>
                    <div
                      className="ml-auto px-1 py-1 rounded cursor-pointer hover:bg-accent flex items-center justify-center"
                      onClick={() => chartManage.removeStockOverlay(p.symbol)}
                      onKeyDown={() => { }}
                    >
                      <JknIcon.Svg name="check" size={10} />
                    </div>
                  </div>
                ))
              }
            </div>
            <div className="px-4 text-xs text-tertiary mb-2 mt-4 flex items-center">
              最近搜索
              <div className="ml-auto cursor-pointer text-tertiary flex items-center" onClick={() => setSearchHistory([])} onKeyDown={() => { }}>
                <JknIcon.Svg name="delete" size={14} />
                &nbsp;
                <span>清空</span>
              </div>
            </div>
            <div>
              {
                searchHistory?.map(p => (
                  <div key={p.symbol} className="flex items-center px-4 py-2 hover:bg-accent cursor-pointer" onClick={() => onClick(p.symbol, p.name)} onKeyDown={() => { }}>
                    <JknIcon.Stock symbol={p.symbol} />
                    <div>
                      <div className="text-base leading-5">{p.symbol}</div>
                      <span className="text-xs text-tertiary">{p.name}</span>
                    </div>
                  </div>
                ))
              }
            </div>
          </ScrollArea>
        ) : (
          <StockVirtualList list={searchResult} onClick={(s, n) => {
            onClick(s, n) && setSearch('')
          }} />
        )
      }
    </div >
  )
}

const StockVirtualList = (props: { list: any[], onClick: (symbol: string, name: string) => void }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const [list] = useVirtualList(props.list, {
    containerTarget: () => containerRef.current?.querySelector('[data-radix-scroll-area-viewport]'),
    wrapperTarget: wrapperRef,
    itemHeight: 52,
    overscan: 20
  })

  return (
    <ScrollArea className="flex-1" ref={containerRef}>
      <div ref={wrapperRef}>
        {list.map(ele => (
          <div
            className="py-2 px-4 flex items-center hover:bg-accent cursor-pointer"
            key={ele.index}
            onClick={() => props.onClick(ele.data[1], ele.data[3])}
            onKeyDown={() => { }}
          >
            <div className="flex-shrink-0">
              {ele.data[0] ? (
                <JknIcon stock={ele.data[0]} className="h-6 w-6 mr-3" />
              ) : (
                <div className="h-6 w-6 mr-3 leading-6 text-center rounded-full bg-black">
                  {ele.data[1].slice(0, 1)}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <div className="text-sm">{ele.data[1]}</div>
              <div className="w-full overflow-hidden text-xs text-ellipsis whitespace-nowrap text-tertiary">
                {ele.data[3]}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  )
}

const OverlayMarkPicker = () => {
  const modal = useModal({
    content: <OverlayMarkModal />,
    title: '叠加标记',
    className: 'w-[667px]',
    footer: false,
    closeIcon: true
  })

  return (
    <>
      <WrapperLabel label="股票叠加">
        <div className="cursor-pointer hover:bg-accent  h-9 rounded px-3 flex items-center" onClick={() => modal.modal.open()} onKeyDown={() => { }}>
          <JknIcon.Svg name="chart-fav" size={20} />
        </div>
      </WrapperLabel>
      {
        modal.context
      }
    </>
  )
}

export const OverlayMarkModal = () => {
  const tabList = useQuery({
    queryKey: [getStockTabList.cacheKey],
    queryFn: () => getStockTabList(),
    placeholderData: () => []
  })

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>()

  const overlayMark = useChartManage(s => s.getActiveChart().overlayMark)

  useEffect(() => {
    if (!tabList.data?.length) return
    if (category) {
      if (tabList.data.find(t => t.key === category)) return
    }

    setCategory(tabList.data[0].key)

  }, [tabList.data, category])

  const marks = useMemo(() => {
    if (!tabList.data) return []

    if (!category) return []

    const list = tabList.data.find(t => t.key === category)

    if (!list) return []


    return list.value.filter(v => v.name.includes(search))
  }, [tabList.data, search, category])

  const [auth, toastNotAuth] = useAuthorized('overlayMark')

  const onCheck = (mark: ArrayItem<typeof marks>) => {
    if (mark.key === overlayMark?.mark) {
      chartManage.removeMarkOverlay()
      return
    }

    const authList = auth()

    let key = ''

    for (let i = 0; i < tabList.data!.length; i++) {
      const tabs = tabList.data![i]
      for (let j = 0; j < tabs.value.length; j++) {
        const item = tabs.value[j]
        if (item.key === mark.key) {
          key = tabs.key
          if (!authList?.some(a => tabs.key.includes(a))) {
            toastNotAuth()
            return
          }
        }
      }
    }
    chartManage.setInterval(StockChartInterval.DAY)
    chartManage.setMarkOverlay(mark.key, key)
  }

  return (
    <div className="h-[380px] flex flex-col text-secondary text-sm">
      <div className="border-b-primary flex items-center px-4">
        <JknIcon.Svg name="search" size={20} className="text-secondary" />
        <Input value={search} placeholder="搜索" className="border-none placeholder:text-tertiary text-secondary" onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="flex-1 overflow-hidden flex">
        <div className="border-r-primary w-[160px] h-full flex-shrink-0 py-2">
          {
            tabList.data?.map(t => (
              <div key={t.key}
                className="flex items-center pl-4 space-x-2 py-3 hover:bg-accent cursor-pointer data-[checked=true]:bg-accent"
                data-checked={category === t.key}
                onClick={() => setCategory(t.key)} onKeyDown={() => { }}
              >
                <span>{t.title}</span>
              </div>
            ))
          }
        </div>
        <div className="flex-1 overflow-auto py-2 box-border">
          {
            marks.map(i => (
              <div key={i.name}
                className="flex items-center w-full box-border justify-between px-4 hover:bg-accent cursor-pointer py-2 overlay-mark-item"
                data-checked={i.key === overlayMark?.mark}
                onClick={() => onCheck(i)} onKeyDown={() => { }}
              >
                <span>{i.name}</span>
                <span className={cn('ml-auto rounded-full w-4 h-4 overlay-mark-check flex items-center justify-center', overlayMark?.mark === i.key ? '!bg-[#089981]' : '')}>
                  {
                    overlayMark?.mark === i.key ? (
                      <JknIcon.Svg name="check" size={10} />
                    ) : null
                  }
                </span>
              </div>
            ))
          }
        </div>
      </div>
      <style jsx>
        {
          `
          .overlay-mark-item:hover .overlay-mark-check {
            background-color: #4A4A4A;
          }
          `
        }
      </style>
    </div>
  )
}

const AlarmPicker = () => {
  const symbol = useChartManage(s => s.getActiveChart().symbol)
  return (
    <>
      <StockAlarm code={symbol}>
        <WrapperLabel label="股票报警">
          <div className="cursor-pointer hover:bg-accent h-full rounded px-3 flex items-center text-sm py-2">
            <JknIcon.Svg name="chart-alarm" size={20} />&nbsp;
            <span>警报</span>
          </div>
        </WrapperLabel>
      </StockAlarm>
      {/* <div className="cursor-pointer hover:bg-accent h-full rounded px-3 flex items-center" onClick={() => modal.modal.open()} onKeyDown={() => { }}>
        <JknIcon.Svg name="chart-alarm" size={20} />
      </div>
      {
        modal.context
      } */}
    </>
  )
}


const BackTest = () => {
  const mode = useChartManage(s => s.getActiveChart().mode)
  const interval = useChartManage(s => s.getActiveChart().interval)
  const [auth, toast] = useAuthorized('backTestTime')
  const onChangeMode = () => {
    const time = auth()
    if (!time || interval < time) {
      toast()
      return
    }
    chartManage.setMode(mode === 'normal' ? 'backTest' : 'normal')
  }
  return (
    <div className={cn('cursor-pointer hover:bg-accent h-full rounded px-3 box-border flex items-center text-sm py-2', mode === 'backTest' && 'text-primary')} onClick={onChangeMode} onKeyDown={() => { }}>
      <JknIcon.Svg name="chart-back-test" size={20} />&nbsp;
      <span>回测</span>
    </div>
  )
}