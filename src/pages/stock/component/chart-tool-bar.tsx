import { getStockIndicators, StockChartInterval, StockIndicator } from '@/api'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  JknIcon,
  Separator,
  Toggle,
  ToggleGroup,
  ToggleGroupItem
} from '@/components'
import { stockUtils } from '@/utils/stock'
import { memo, useMemo, useState } from 'react'
import { timeIndex, useSymbolQuery } from '../lib'
import { ChartType, chartManage, useChartManage } from '../lib/store'
import { renderUtils } from '../lib/utils'
import { useQuery } from "@tanstack/react-query"
import { useAuthorized } from "@/hooks"

export const ChartToolBar = () => {
  const symbol = useSymbolQuery()

  return (
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
    </div>
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

const IndicatorPicker = memo(() => { })

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
    <div className="w-[667px] h-[500px] bg-accent flex flex-col text-secondary text-sm">
      <div className="border-b-primary flex items-center">
        <JknIcon.Svg name="search" size={20} className="text-secondary" />
        <Input placeholder="搜索" className="border-none placeholder:text-secondary text-secondary" />
      </div>
      <div className="flex-1 overflow-hidden flex">
        <div className="border-r-primary w-[160px] h-full px-2 flex-shrink-0 space-y-2 py-2">
          <div data-checked={category === '缠论系统'}
            className="flex items-center pl-2 space-x-2 py-1 hover:bg-accent cursor-pointer data-[checked=true]:bg-accent"
            onClick={() => setCategory('缠论系统')} onKeyDown={() => { }}
          >
            <JknIcon.Svg name="fav" size={16} />
            <span>缠论系统</span>
          </div>
          <div data-checked={category === '特色指标'}
            className="flex items-center pl-2 space-x-2 py-1 hover:bg-accent cursor-pointer data-[checked=true]:bg-accent"
            onClick={() => setCategory('特色指标')} onKeyDown={() => { }}
          >
            <JknIcon.Svg name="chart-indicator-spec" size={16} />
            <span>特色指标</span>
          </div>
          <div data-checked={category === '常规指标'}
            className="flex items-center pl-2 space-x-2 py-1 hover:bg-accent cursor-pointer data-[checked=true]:bg-accent"
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
