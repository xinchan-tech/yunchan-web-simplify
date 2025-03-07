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
  useModal
} from '@/components'
import { dateUtils } from '@/utils/date'
import { stockUtils } from '@/utils/stock'
import { cn } from '@/utils/style'
import { useCounter, useUnmount, useUpdateEffect } from 'ahooks'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import { memo, useRef, useState } from 'react'
import { useImmer } from 'use-immer'
import { kChartUtils, useKChartStore } from '../lib'
import { chartEvent } from '../lib/event'
import { renderUtils } from '../lib/utils'

const disabledDate = (d: Date, candlesticks: StockRawRecord[]) => {
  const day = dayjs(d)
  // console.log(d, dayjs(d).format('YYYY-MM-DD HH:mm:ss'), !dateUtils.isMarketOpen(day))
  return (
    !dateUtils.isMarketOpen(day) || !dayjs().isAfter(d) || !day.isSameOrAfter(dateUtils.toUsDay(+candlesticks[0][0]!))
  )
}

interface BackTestBarProps {
  candlesticks: StockRawRecord[]
  chartIndex: number
  onRender: () => void
}

type TradeRecord = {
  sell: {
    time: number
    price: number
    count: number
  }[]
  buy: TradeRecord['sell']
}

export const BackTestBar = memo((props: BackTestBarProps) => {
  // const [startDate, setStartDate] = useState<string | undefined>(undefined)
  const [speed, setSpeed] = useState<number>(1)
  const [number, setNumber] = useState<number>(100)
  const candlesticksRestore = useRef<StockRawRecord[]>(props.candlesticks)
  //交易记录
  const [tradeRecord, setTradeRecord] = useImmer<TradeRecord>({ sell: [], buy: [] })
  const [timer, setTimer] = useState<number | null>(null)
  const [profit, setProfit] = useState<number>(0)
  const [positiveProfitCount, { inc: incPositiveProfitCount }] = useCounter(0)
  const [maxProfit, setMaxProfit] = useState<number>(0)

  useUpdateEffect(() => {
    candlesticksRestore.current = props.candlesticks
  }, [props.candlesticks])

  const onDateChange = (date?: string) => {
    // setStartDate(date)

    if (!date) {
      setCandlesticks(candlesticksRestore.current)
    } else {
      const kline = renderUtils.findNearestTime(
        candlesticksRestore.current,
        +dateUtils.toUsDay(date).valueOf().toString().slice(0, -3)
      )

      if (kline) {
        setCandlesticks(candlesticksRestore.current.slice(0, kline.index + 1))
      }
    }
  }

  const toNextLine = () => {
    const current = useKChartStore.getState().state[props.chartIndex].mainData.history
    if (current.length === candlesticksRestore.current.length) {
      resultModel.modal.open()
      return
    }
    setCandlesticks(candlesticksRestore.current.slice(0, current.length + 1))
  }

  const toLastKLine = () => {
    const current = useKChartStore.getState().state[props.chartIndex].mainData.history
    if (current.length === 0) return

    resultModel.modal.open()
    setCandlesticks(candlesticksRestore.current.slice(0, current.length - 1))
  }

  const setCandlesticks = (data: StockRawRecord[]) => {
    chartEvent.event.emit('backTestChange', {
      index: props.chartIndex,
      data: data.map(v => [v[0]?.toString(), ...v.slice(1)]) as any
    })
  }

  const startBackTest = () => {
    const timer = window.setInterval(
      () => {
        toNextLine()

        if (
          useKChartStore.getState().state[props.chartIndex].mainData.history.length ===
          candlesticksRestore.current.length
        ) {
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

  const action = (type: 'buy' | 'sell') => {
    if (number <= 0) return
    const stock =
      candlesticksRestore.current[useKChartStore.getState().state[props.chartIndex].mainData.history.length - 1]

    tradeRecord[type].push({
      time: +stock[0]!,
      price: +stock[2]!,
      count: number
    })
    setTradeRecord({ ...tradeRecord })

    kChartUtils.addBackTestMark({
      index: props.chartIndex,
      time: stock[0]!,
      price: +stock[2]!,
      count: number,
      type: type === 'buy' ? '买入' : '卖出'
    })

    const result = calcProfit(tradeRecord)
    const diffProfit = result - profit
    setMaxProfit(Math.max(diffProfit, maxProfit))
    setProfit(result)

    if (result > 0) {
      incPositiveProfitCount()
    }

    setTimeout(() => {
      props.onRender()
    })
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
    const stock =
      candlesticksRestore.current[useKChartStore.getState().state[props.chartIndex].mainData.history.length - 1]
    const sellCount = tradeRecord.sell.reduce((prev, cur) => prev + cur.count, 0)
    const buyCount = tradeRecord.buy.reduce((prev, cur) => prev + cur.count, 0)

    const diffCount = sellCount - buyCount

    if (diffCount === 0) return

    tradeRecord[diffCount > 0 ? 'buy' : 'sell'].push({
      time: +stock[0]!,
      price: +stock[2]!,
      count: number
    })
    setTradeRecord({ ...tradeRecord })

    const result = calcProfit(tradeRecord)
    const diffProfit = result - profit
    setMaxProfit(Math.max(diffProfit, maxProfit))
    setProfit(result)

    kChartUtils.addBackTestMark({
      index: props.chartIndex,
      time: stock[0]!,
      price: +stock[2]!,
      count: diffCount,
      type: diffCount > 0 ? '买入' : '卖出'
    })
    setTimeout(() => {
      props.onRender()
    })
  }

  const resultModel = useModal({
    title: ' ',
    closeIcon: true,
    footer: false,
    closeOnMaskClick: false,
    content: () => {
      const symbol = useKChartStore.getState().state[props.chartIndex].symbol
      const timeIndex = useKChartStore.getState().state[props.chartIndex].timeIndex
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
    <div className="h-8 box-border items-center flex text-xs justify-between px-2">
      <div className="flex items-center space-x-2">
        <span>开始时间：</span>
        <JknDatePicker onChange={onDateChange} disabled={d => disabledDate(d, props.candlesticks)}>
          {v => <div className="bg-primary rounded-sm px-3 py-1">{v ?? '请选择时间'}</div>}
        </JknDatePicker>
      </div>
      <div className="flex items-center space-x-3">
        {!timer ? (
          <div
            className="border border-solid border-border rounded-sm px-1 py-0.5 flex items-center"
            onClick={startBackTest}
            onKeyDown={() => {}}
          >
            <JknIcon name="ic_huice2" className="w-3 h-3" />
            &nbsp;
            <span>开始</span>
          </div>
        ) : (
          <div
            className="border border-solid border-border rounded-sm px-1 py-0.5 flex items-center"
            onClick={stopBackTest}
            onKeyDown={() => {}}
          >
            <JknIcon name="ic_huice3" className="w-3 h-3" />
            &nbsp;
            <span>暂停</span>
          </div>
        )}

        <div className="border border-solid border-border rounded-sm px-1 py-0.5 flex items-center">
          <BackTestSpeed speed={speed} onChange={setSpeed} />
        </div>

        <JknIcon name="ic_huice4" className="w-3 h-3" onClick={toNextLine} />

        <JknIcon name="ic_huice6" className="w-3 h-3" onClick={toLastKLine} />
      </div>

      <div className="flex items-center space-x-4">
        <span>{Decimal.create(profit).toFixed(3)}</span>
        <Button size="mini" variant="destructive" onClick={() => action('sell')}>
          卖出
        </Button>
        <NumberInput value={number} onChange={setNumber} />
        <Button size="mini" className="bg-[#00b058]" onClick={() => action('buy')}>
          买入
        </Button>
        <Button size="mini" className="bg-[#232323]" onClick={closePosition}>
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
        <div className="w-10 text text-center cursor-pointer">
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
        <div className="min-w-16 text text-center cursor-pointer border border-solid border-border rounded-sm px-1 py-0.5">
          <div>{props.value}</div>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-52 text-sm">
        <div className="p-2">
          <div className="text-center">数量</div>
          <Input
            className="border-border mt-2"
            size="sm"
            value={props.value}
            onChange={e => props.onChange(Number(e.target.value))}
          />
        </div>
        <div className="grid grid-cols-3 text-xs p-2 gap-3">
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer"
            onClick={() => props.onChange(props.value - 1)}
            onKeyDown={() => {}}
          >
            -
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer"
            onClick={() => props.onChange(0)}
            onKeyDown={() => {}}
          >
            清零
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer"
            onClick={() => props.onChange(props.value + 1)}
            onKeyDown={() => {}}
          >
            +
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer"
            onClick={() => props.onChange(props.value + 1)}
            onKeyDown={() => {}}
          >
            1
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer"
            onClick={() => props.onChange(props.value + 5)}
            onKeyDown={() => {}}
          >
            5
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer"
            onClick={() => props.onChange(props.value + 25)}
            onKeyDown={() => {}}
          >
            25
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer"
            onClick={() => props.onChange(props.value + 100)}
            onKeyDown={() => {}}
          >
            100
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer"
            onClick={() => props.onChange(props.value + 500)}
            onKeyDown={() => {}}
          >
            500
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer"
            onClick={() => props.onChange(props.value + 1000)}
            onKeyDown={() => {}}
          >
            1000
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
