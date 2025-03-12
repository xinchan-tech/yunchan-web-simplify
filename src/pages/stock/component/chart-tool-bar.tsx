import { getStockIndicators, getStockTabList, StockChartInterval, type StockIndicator } from '@/api'
import {
  CoilingIndicatorId,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  JknIcon,
  ScrollArea,
  Separator,
  StockAlarm,
  ToggleGroup,
  ToggleGroupItem,
  useModal
} from '@/components'
import { stockUtils } from '@/utils/stock'
import { Fragment, memo, useEffect, useMemo, useRef, useState } from 'react'
import { timeIndex, useSymbolQuery } from '../lib'
import { ChartType, chartManage, useChartManage } from '../lib/store'
import { renderUtils } from '../lib/utils'
import { useQuery } from "@tanstack/react-query"
import { useAuthorized, useStockSearch } from "@/hooks"
import { useLocalStorageState, useVirtualList } from "ahooks"
import { cn } from "@/utils/style"
import { chartEvent } from "../lib/event"

export const ChartToolBar = () => {
  const symbol = useSymbolQuery()

  return (
    <div>
      <div className="flex items-center h-11 py-1 box-border w-full bg-background text-sm text-secondary px-4">
        <div className="flex items-center mr-2">
          <JknIcon.Stock symbol={symbol} />
          &nbsp;
          <span className="text-base text-foreground">{symbol}</span>
        </div>
        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <TimeShareSelect />
        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <PeriodSelect />
        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <ChartTypeSelect />
        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <IndicatorPicker />
        <ViewModeSelect />
        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <StockPkPicker />
        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <OverlayMarkPicker />
        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <AlarmPicker />
        <Separator orientation="vertical" className="h-2 w-[1px] bg-accent mx-1" />
        <BackTest />
      </div>
      <div className="text-tertiary text-sm flex items-center px-4 space-x-4">
        <CoilingBar />
      </div>
    </div>
  )
}

const CoilingBar = () => {
  const system = useChartManage(s => s.getActiveChart().system)
  const indicator = useQuery({
    queryKey: [getStockIndicators.cacheKey],
    queryFn: getStockIndicators
  })

  const coilingList = indicator.data?.main.find(i => i.name === '缠论系统')?.indicators.find(o => o.id === system)?.items
  const coiling = useChartManage(s => s.getActiveChart().coiling)

  if (!coiling) return null

  const _onClickCoiling = (id: string) => {
    if (coiling.includes(id as any)) {
      chartManage.removeCoiling(id as any)
    } else {
      chartManage.addCoiling(id as any)
    }
  }

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
                      <span style={{ color: coiling.includes(c.id) ? '#808080' : '#575757' }}>{c.name}</span>
                    </span>
                  )
                case CoilingIndicatorId.ONE_TYPE:
                case CoilingIndicatorId.TWO_TYPE:
                case CoilingIndicatorId.THREE_TYPE:
                  return (
                    <span className="cursor-pointer flex items-center" onClick={() => _onClickCoiling(c.id as any)} onKeyDown={() => { }}>
                      <JknIcon.Checkbox checked={coiling.includes(c.id)} uncheckedIcon="chart-coiling-bs" checkedIcon="chart-coiling-bs-active" className="h-4 w-4 rounded mr-1" />
                      <span style={{ color: coiling.includes(c.id) ? '#808080' : '#575757' }}>{c.name}</span>
                    </span>
                  )
                case CoilingIndicatorId.PIVOT:
                  return (
                    <span className="cursor-pointer flex items-center" onClick={() => _onClickCoiling(c.id as any)} onKeyDown={() => { }}>
                      <JknIcon.Svg name="poivts" size={16} style={{ color: coiling.includes(c.id) ? '#808080' : '#575757' }} />
                      <span style={{ color: coiling.includes(c.id) ? '#808080' : '#575757' }}>{c.name}</span>
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
    if (renderUtils.isTimeIndexChart(interval)) return stockUtils.intervalToStr(StockChartInterval.ONE_MIN)
    return stockUtils.intervalToStr(interval)
  }, [interval])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className="cursor-pointer hover:bg-accent inline-block h-full rounded leading-9 px-3">{intervalStr}</span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" alignOffset={-10}>
        {timeIndex.slice(4).map(i => (
          <DropdownMenuItem key={i} data-checked={interval === i} onClick={() => chartManage.setInterval(i)}>
            {stockUtils.intervalToStr(i)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

export const ChartTypeSelect = memo(() => {
  const chartType = useChartManage(s => s.getActiveChart().type)

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span className="cursor-pointer hover:bg-accent h-full rounded flex px-3">
          <JknIcon.Svg
            name={chartType === ChartType.Candle ? 'chart-candle' : 'chart-area'}
            size={20}
            className="m-auto"
          />
        </span>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" alignOffset={-10}>
        <DropdownMenuItem
          data-checked={chartType === ChartType.Area}
          onClick={() => chartManage.setType(ChartType.Area)}
        >
          <JknIcon.Svg name="chart-area" size={20} />
          折线线
        </DropdownMenuItem>
        <DropdownMenuItem
          data-checked={chartType === ChartType.Candle}
          onClick={() => chartManage.setType(ChartType.Candle)}
        >
          <JknIcon.Svg name="chart-candle" size={20} />
          K线图
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

const IndicatorPicker = memo(() => {
  const modal = useModal({
    content: <IndicatorModal />,
    title: '指标策略',
    className: 'w-[667px]',
    footer: false,
    closeIcon: true
  })

  useEffect(() => {
    const cancelEvent = chartEvent.get().on('showIndicatorSetting', () => {
      modal.modal.open()
    })

    return cancelEvent
  }, [modal])

  return (
    <>
      <div className="cursor-pointer hover:bg-accent h-full rounded px-3 flex items-center" onClick={() => modal.modal.open()} onKeyDown={() => { }}>
        <JknIcon.Svg name="chart-indicator" size={20} />
        &nbsp;
        <span>指标</span>
      </div>
      {
        modal.context
      }
    </>
  )
})

export const IndicatorModal = () => {
  const indicator = useQuery({
    queryKey: [getStockIndicators.cacheKey],
    queryFn: getStockIndicators
  })
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('缠论系统')
  const [type, setType] = useState<'main' | 'secondary'>('main')
  const mainIndicators = useChartManage(s => s.getActiveChart().mainIndicators)
  const secondaryIndicators = useChartManage(s => s.getActiveChart().secondaryIndicators)
  const system = useChartManage(s => s.getActiveChart().system)

  const indicators = useMemo(() => {
    if (!indicator.data) return []

    const allList: StockIndicator[] = []

    if (type === 'main' || category === '缠论系统') {
      indicator.data.main.forEach(i => {
        if (category && i.name !== category) return

        i.indicators.forEach(ii => {
          if (search && !ii.name?.includes(search)) return

          allList.push(ii)
        })

      })
    } else {
      indicator.data.secondary.forEach(i => {
        if (category && i.name !== category) return

        i.indicators.forEach(ii => {
          if (search && !ii.name?.includes(search)) return

          allList.push(ii)
        })

      })
    }

    return allList
  }, [indicator.data, search, category, type])

  const [_, toastNotAuth] = useAuthorized()

  const onCheck = (i: StockIndicator) => {
    if (!i.authorized) {
      toastNotAuth()
      return
    }

    if (category === '缠论系统') {
      chartManage.setSystem(i.id)
    } else {
      if (type === 'main') {
        if (mainIndicators.find(ii => ii.id === i.id)) {
          chartManage.removeMainIndicator(i.id)
        } else {
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
  }

  const checkedIndicator = useMemo(() => {
    const r = new Set<string>()

    mainIndicators.forEach(i => r.add(i.id))
    secondaryIndicators.forEach(i => r.add(i.id))
    system && r.add(system)

    return r
  }, [mainIndicators, secondaryIndicators, system])


  return (
    <div className="h-[500px] flex flex-col text-secondary text-sm">
      <div className="border-b-primary flex items-center px-4">
        <JknIcon.Svg name="search" size={20} className="text-secondary" />
        <Input placeholder="搜索" className="border-none placeholder:text-tertiary text-secondary" />
      </div>
      <div className="flex-1 overflow-hidden flex">
        <div className="border-r-primary w-[160px] h-full flex-shrink-0 py-2">
          <div data-checked={category === '缠论系统'}
            className="flex items-center pl-4 space-x-2 py-3 hover:bg-accent cursor-pointer data-[checked=true]:bg-accent"
            onClick={() => setCategory('缠论系统')} onKeyDown={() => { }}
          >
            <JknIcon.Svg name="fav" size={16} />
            <span>缠论系统</span>
          </div>
          <div data-checked={category === '特色指标'}
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
          </div>
        </div>
        <div className="flex-1 overflow-auto py-2 box-border">
          {
            category !== '缠论系统' ? (
              <ToggleGroup className="ml-8 my-2" type="single" value={type} onValueChange={setType as any}>
                <ToggleGroupItem value="main" className="rounded-2xl h-[24px] text-xs px-3 leading-1">主图</ToggleGroupItem>
                <ToggleGroupItem value="secondary" className="rounded-2xl h-[24px] text-xs px-3 leading-1">副图</ToggleGroupItem>
              </ToggleGroup>
            ) : null
          }
          {
            indicators.map(i => (
              <div key={i.name}
                className="flex items-center pl-2 space-x-2 hover:bg-accent cursor-pointer py-1.5 data-[checked=true]:bg-[#2962FF4D]"
                data-checked={checkedIndicator.has(i.id)}
                onClick={() => onCheck(i)} onKeyDown={() => { }}
              >
                <JknIcon.Svg name="fav-star" className="opacity-0" size={16} />
                <span>{i.name}</span>
                {
                  !i.authorized ? (
                    <JknIcon name="ic_lock" className="rounded-none" />
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
        <span className="cursor-pointer hover:bg-accent h-full rounded leading-9 px-3 flex items-center justify-center">
          <JknIcon name={viewModeMenuItems.find(i => i.value === viewMode)?.icon as any} className="w-5 h-5" />
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
      <div className="cursor-pointer hover:bg-accent h-full rounded px-3 flex items-center" onClick={() => modal.modal.open()} onKeyDown={() => { }}>
        <JknIcon.Svg name="chart-pk" size={20} />
      </div>
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

  const onClick = (symbol: string, name: string) => {
    if (pk.find(p => p.symbol === symbol)) return

    chartManage.setStockOverlay(symbol, name)
    if (searchHistory?.find(p => p.symbol === symbol)) return
    setSearchHistory([...(searchHistory ?? []), { symbol, name }])
  }

  const [searchHistory, setSearchHistory] = useLocalStorageState<typeof pk>('stock-pk-history', {
    defaultValue: []
  })

  return (
    <div className="flex h-[500px] flex-col text-sm">
      <div className="border-b-primary flex items-center px-4 flex-shrink-0">
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
            onClick(s, n)
            setSearch('')
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
      <div className="cursor-pointer hover:bg-accent h-full rounded px-3 flex items-center" onClick={() => modal.modal.open()} onKeyDown={() => { }}>
        <JknIcon.Svg name="chart-fav" size={20} />
      </div>
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
        <div className="cursor-pointer hover:bg-accent h-full rounded px-3 flex items-center text-sm py-2">
          <JknIcon.Svg name="chart-alarm" size={20} />&nbsp;
          <span>警报</span>
        </div>
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
  const onChangeMode = () => {
    chartManage.setMode(mode === 'normal' ? 'backTest' : 'normal')
  }
  return (
    <div className="cursor-pointer hover:bg-accent h-full rounded px-3 box-border flex items-center text-sm py-2" onClick={onChangeMode} onKeyDown={() => { }}>
      <JknIcon.Svg name="chart-back-test" size={20} />&nbsp;
      <span>回测</span>
    </div>
  )
}