import type { StockRawRecord } from '@/api'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Input,
  JknDatePicker,
  JknIcon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  useModal
} from '@/components'
import { dateUtils } from '@/utils/date'
import { stockUtils } from '@/utils/stock'
import { cn } from '@/utils/style'
import { useCounter, useUnmount } from 'ahooks'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import { memo, useRef, useState } from 'react'
import { useImmer } from 'use-immer'
import { renderUtils } from '../lib/utils'
import { useChartManage } from "../lib"
import { useLatestRef, useToast } from "@/hooks"

const disabledDate = (d: Date, candlesticks: StockRawRecord[]) => {
  if (!candlesticks.length) return true
  const day = dayjs(d)
  return (
    !dateUtils.isMarketOpen(day) || !dayjs().isAfter(d) || !day.isSameOrAfter(dateUtils.toUsDay(+candlesticks[0][0]!))
  )
}

interface BackTestBarProps {
  chartId: string
  candlesticks: StockRawRecord[]
  onNextCandlesticks: (candlestick: StockRawRecord) => void
  onChangeCandlesticks: (data: StockRawRecord[]) => void
  onAddBackTestRecord: (record: { time: number; price: number; count: number; type: 'buy' | 'sell', index: number }) => void
}

type TradeRecord = {
  sell: {
    index: number
    time: number
    price: number
    count: number
  }[]
  buy: TradeRecord['sell']
}

export const BackTestBar = memo((props: BackTestBarProps) => {
  const [speed, setSpeed] = useState<number>(1)
  const [number, setNumber] = useState<number>(100)
  const candlesticksRestore = useLatestRef<StockRawRecord[]>(props.candlesticks)
  //交易记录
  const [tradeRecord, setTradeRecord] = useImmer<TradeRecord>({ sell: [], buy: [] })
  const [timer, setTimer] = useState<number | null>(null)
  const [profit, setProfit] = useState<number>(0)
  const [positiveProfitCount, { inc: incPositiveProfitCount }] = useCounter(0)
  const [maxProfit, setMaxProfit] = useState<number>(0)
  const currentKline = useRef<number>(-1)
  // const klineCount = useRef<number>(0)


  const onDateChange = (date?: string) => {
    // setStartDate(date)

    if (!date) {
      props.onChangeCandlesticks(candlesticksRestore.current)
      currentKline.current = -1
    } else {
      const kline = renderUtils.findNearestTime(
        candlesticksRestore.current,
        +dateUtils.toUsDay(date).valueOf().toString().slice(0, -3)
      )

      if (kline) {
        props.onChangeCandlesticks(candlesticksRestore.current.slice(0, kline.index + 1))
        currentKline.current = kline.index
      }
    }
  }

  const toNextLine = () => {
    if (currentKline.current === -1) {
      toast({
        description: '请先选择日期'
      })

      return false
    }

    if (currentKline.current >= candlesticksRestore.current.length) {
      resultModel.modal.open()
      return false
    }

    const next = candlesticksRestore.current[currentKline.current + 1]

    if (!next) {
      toast({
        description: '已到最新数据'
      })
      return false
    }
    props.onNextCandlesticks(next)
    currentKline.current++

    return true
  }

  const toLastKLine = () => {
    if (currentKline.current === -1) return
    resultModel.modal.open()
    props.onChangeCandlesticks(candlesticksRestore.current)
    currentKline.current = -1
  }

  const startBackTest = () => {
    const timer = window.setInterval(
      () => {
        if (!toNextLine()) {
          window.clearInterval(timer!)
          setTimer(null)
        }
      },
      (1 / speed) * 1000
    )
    setTimer(timer)
  }

  const stopBackTest = () => {
    window.clearInterval(timer!)
    setTimer(null)
  }

  const { toast } = useToast()

  const action = (type: 'buy' | 'sell') => {
    if (number <= 0) return

    if (currentKline.current === -1) {
      toast({
        description: '请先选择日期'
      })

      return
    }

    const stock = candlesticksRestore.current[currentKline.current]

    tradeRecord[type].push({
      index: currentKline.current,
      time: +stock[0]!,
      price: +stock[2]!,
      count: number
    })
    setTradeRecord({ ...tradeRecord })

    const record = {
      index: currentKline.current,
      time: stock[0]! as unknown as number,
      price: +stock[2]!,
      count: number,
      type
    }

    props.onAddBackTestRecord(record)

    const result = calcProfit(tradeRecord)
    const diffProfit = result - profit
    setMaxProfit(Math.max(diffProfit, maxProfit))
    setProfit(result)

    if (result > 0) {
      incPositiveProfitCount()
    }
  }

  useUnmount(() => {
    setTimer(null)
    setTradeRecord({ buy: [], sell: [] })
  })

  const calcProfit = (record: TradeRecord) => {
    const buyLength = record.buy.length
    const sellLength = record.sell.length

    const count =
      buyLength < sellLength
        ? record.buy.reduce((prev, cur) => prev + cur.count, 0)
        : record.sell.reduce((prev, cur) => prev + cur.count, 0)

    let shellPrice = 0
    let c = 0
    record.sell.forEach((shell, index) => {
      if (c + index < count) {
        shellPrice += shell.price * shell.count
        c += shell.count
      } else {
        shellPrice += shell.price * (count - c)
        c += count - c
      }
    })

    c = 0
    let buyPrice = 0

    record.buy.forEach((buy, index) => {
      if (c + index < count) {
        buyPrice += buy.price * buy.count
        c += buy.count
      } else {
        buyPrice += buy.price * (count - c)
        c += count - c
      }
    })

    return shellPrice - buyPrice
  }

  //平仓
  const closePosition = () => {
    if (currentKline.current === -1) {
      toast({
        description: '请先选择日期'
      })

      return
    }

    const stock = candlesticksRestore.current[currentKline.current]
    const sellCount = tradeRecord.sell.reduce((prev, cur) => prev + cur.count, 0)
    const buyCount = tradeRecord.buy.reduce((prev, cur) => prev + cur.count, 0)

    const diffCount = sellCount - buyCount

    if (diffCount === 0) return

    tradeRecord[diffCount > 0 ? 'buy' : 'sell'].push({
      index: currentKline.current,
      time: +stock[0]!,
      price: +stock[2]!,
      count: number
    })
    setTradeRecord({ ...tradeRecord })

    const result = calcProfit(tradeRecord)
    const diffProfit = result - profit
    setMaxProfit(Math.max(diffProfit, maxProfit))
    setProfit(result)
    props.onAddBackTestRecord({
      index: currentKline.current,
      time: +stock[0]!,
      price: +stock[2]!,
      count: Math.abs(diffCount),
      type: diffCount > 0 ? 'buy' : 'sell'
    })
  }

  const resultModel = useModal({
    title: ' ',
    closeIcon: true,
    footer: false,
    closeOnMaskClick: false,
    content: () => {
      const symbol = useChartManage.getState().chartStores[props.chartId].symbol
      const timeIndex = useChartManage.getState().chartStores[props.chartId].interval
      const total = tradeRecord.buy.length + tradeRecord.sell.length

      return (
        <div className="text-center px-4">
          <div className="my-4 text-4xl">再接再厉，交易员！</div>
          <div className="text-lg">
            您在 {symbol} - {stockUtils.intervalToStr(timeIndex)} 的回测中
          </div>
          <div className="flex justify-between items-center my-12 space-x-4">
            <div className="flex-1 border border-solid border-border rounded py-4">
              <div className="text-xl mb-2">现金盈利</div>
              <div>
                <span className={cn('text-3xl', profit > 0 ? 'text-stock-up' : 'text-stock-down')}>
                  {Decimal.create(profit).toShort()}
                </span>
                <span> USD</span>
              </div>
            </div>
            <div className="flex-1 border border-solid border-border rounded py-4">
              <div className="text-xl mb-2">成功率</div>
              <div>
                <span className={cn('text-3xl', profit > 0 ? 'text-stock-up' : 'text-stock-down')}>
                  {' '}
                  {total === 0 ? '0.00' : Decimal.create(positiveProfitCount).div(total).mul(100).toFixed(2)}
                </span>
                <span> %</span>
              </div>
            </div>
            <div className="flex-1 border border-solid border-border rounded py-4">
              <div className="text-xl mb-2"> 最赚钱的交易</div>
              <div>
                <span className={cn('text-3xl', profit > 0 ? 'text-stock-up' : 'text-stock-down')}>
                  {Decimal.create(maxProfit).toShort()}
                </span>
                <span> USD</span>
              </div>
            </div>
          </div>
        </div>
      )
    }
  })

  return (
    <div className="h-8 box-border grid grid-cols-3 text-xs px-2 w-full">
      <div />
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <JknDatePicker onChange={onDateChange} disabled={d => disabledDate(d, props.candlesticks ?? [])}>
            {v => <div className="hover:bg-accent rounded-xs px-3 py-1 cursor-pointer "><JknIcon.Svg name="calendar-2" className="align-middle pb-1" size={14} />&nbsp;{v ?? '选择日期'}</div>}
          </JknDatePicker>
        </div>
        <Separator orientation="vertical" className="h-4 w-[1px] mx-2" />
        <div className="flex items-center space-x-3">
          {!timer ? (
            <div
              className="border cursor-pointer hover:bg-accent px-1 py-1 flex items-center rounded-xs"
              onClick={startBackTest}
              onKeyDown={() => { }}
            >
              <JknIcon.Svg name="play" size={16} />
            </div>
          ) : (
            <div
              className="border cursor-pointer hover:bg-accent rounded-xs px-1 py-1 flex items-center"
              onClick={stopBackTest}
              onKeyDown={() => { }}
            >
              { /* TODO: 暂停ICON */}
              <JknIcon name="ic_huice3" className="w-3 h-3" />
              &nbsp;
              <span>暂停</span>
            </div>
          )}
          <div
            className="border cursor-pointer hover:bg-accent px-1 py-1 flex items-center rounded-xs"
            onClick={toNextLine}
            onKeyDown={() => { }}
          >
            <JknIcon.Svg name="play-x1" size={16} />
          </div>
          <div className="border cursor-pointer hover:bg-accent rounded-xs px-1 py-1 flex items-center">
            <BackTestSpeed speed={speed} onChange={setSpeed} />
          </div>
          <Separator orientation="vertical" className="h-4 w-[1px] mx-2" />
          <div
            className="border cursor-pointer hover:bg-accent px-1 py-1 flex items-center rounded-xs"
            onClick={toLastKLine}
            onKeyDown={() => { }}
          >
            <JknIcon.Svg name="play-x2" size={16} />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 justify-end">
        <span data-direction={profit > 0 ? 'up' : 'down'} data-direction-sign>{Decimal.create(profit).toFixed(3)}</span>
        <Separator orientation="vertical" className="h-4 w-[1px] mx-2" />
        <Button size="mini" variant="destructive" className="bg-[#F23645] w-[72px] box-border" onClick={() => action('sell')}>
          卖出
        </Button>
        <NumberInput value={number} onChange={setNumber} />
        <Button size="mini" className="bg-[#22AB94] w-[72px] box-border text-white" onClick={() => action('buy')}>
          买入
        </Button>
        <Button size="mini" variant="outline" className="w-[72px]" onClick={closePosition}>
          平仓
        </Button>
      </div>
      {resultModel.context}
    </div>
  )
})

const speedOptions = [
  { value: 10, label: '每秒更新10次' },
  { value: 7, label: '每秒更新7次' },
  { value: 5, label: '每秒更新5次' },
  { value: 3, label: '每秒更新3次' },
  { value: 1, label: '每秒更新1次' },
  { value: 0.5, label: '每2秒更新1次' },
  { value: 0.3, label: '每3秒更新1次' },
  { value: 0.1, label: '每10秒更新1次' }
]

const BackTestSpeed = (props: { speed: number; onChange: (v: number) => void }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="w-6 text text-center cursor-pointer">
          <span>x{props.speed}</span>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top">
        <div className="text-center">回放速度</div>
        {speedOptions.map(option => (
          <DropdownMenuItem key={option.value} onClick={() => props.onChange(option.value)}>
            <div className="flex items-center cursor-pointer">
              <span className="w-10">x{option.value}</span>
              <span className="text-tertiary">{option.label}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

const NumberInput = (props: { value: number; onChange: (v: number) => void }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="min-w-4 text text-center cursor-pointer bg-accent rounded-sm px-2 py-1">
          <div>{props.value}</div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-52 text-sm">
        <div className="p-2">
          <div className="text-left text-tertiary text-xs">数量</div>
          <Input
            className="border-border mt-2"
            size="sm"
            value={props.value}
            onChange={e => props.onChange(Number(e.target.value))}
          />
        </div>
        <div className="grid grid-cols-3 text-xs p-2 gap-1">
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value + 1)}
            onKeyDown={() => { }}
          >
            1
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value + 5)}
            onKeyDown={() => { }}
          >
            5
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value + 25)}
            onKeyDown={() => { }}
          >
            25
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value + 100)}
            onKeyDown={() => { }}
          >
            100
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value + 500)}
            onKeyDown={() => { }}
          >
            500
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value + 1000)}
            onKeyDown={() => { }}
          >
            1000
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(0)}
            onKeyDown={() => { }}
          >
            清零
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value - 1)}
            onKeyDown={() => { }}
          >
            -
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value + 1)}
            onKeyDown={() => { }}
          >
            +
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
