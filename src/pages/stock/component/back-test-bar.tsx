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
  PopoverTrigger
} from '@/components'
import { dateUtils } from '@/utils/date'
import { useMount, useUpdateEffect } from 'ahooks'
import dayjs from 'dayjs'
import { useRef, useState } from 'react'
import { kChartUtils, timeIndex, useKChartStore } from '../lib'
import { renderUtils } from '../lib/utils'
import { useImmer } from 'use-immer'

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
  time: number
  price: number
  record: {
    count: number
    type: 'buy' | 'sell'
  }[]
}

export const BackTestBar = (props: BackTestBarProps) => {
  const [startDate, setStartDate] = useState<string | undefined>(undefined)
  const [speed, setSpeed] = useState<number>(1)
  const [number, setNumber] = useState<number>(100)
  const candlesticksRestore = useRef<StockRawRecord[]>(props.candlesticks)
  //交易记录
  const [tradeRecord, setTradeRecord] = useImmer<TradeRecord[]>([])
  const [timer, setTimer] = useState<number | null>(null)

  useUpdateEffect(() => {
    candlesticksRestore.current = props.candlesticks
  }, [props.candlesticks])

  const onDateChange = (date?: string) => {
    setStartDate(date)

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

    setCandlesticks(candlesticksRestore.current.slice(0, current.length + 1))
  }

  const toLastKLine = () => {}

  const setCandlesticks = (data: StockRawRecord[]) => {
    kChartUtils.setMainData({
      index: props.chartIndex,
      data: data.map(v => [v[0]?.toString(), ...v.slice(1)]) as any,
      timeIndex: useKChartStore.getState().state[props.chartIndex].timeIndex
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

  const buy = () => {
    if (number <= 0) return
    const stock =
      candlesticksRestore.current[useKChartStore.getState().state[props.chartIndex].mainData.history.length - 1]

    setTradeRecord(d => {
      let record = d.find(v => v.time === +stock[0]!)
      if (!record) {
        record = {
          time: +stock[0]!,
          price: +stock[1]!,
          record: [
            {
              count: number,
              type: 'buy'
            }
          ]
        }
        d.push(record)
      } else {
        record.record.push({
          count: number,
          type: 'buy'
        })
      }
    })

    kChartUtils.addBackTestMark({
      index: props.chartIndex,
      time: stock[0]!,
      price: +stock[2]! * number,
      count: number,
      type: '买入'
    })

    setTimeout(() => {
      props.onRender()
    })
  }

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
        <span>0.00</span>
        <Button size="mini" variant="destructive">
          卖出
        </Button>
        <NumberInput value={number} onChange={setNumber} />
        <Button size="mini" className="bg-[#00b058]" onClick={buy}>
          买入
        </Button>
        <Button size="mini" className="bg-[#232323]">
          平仓
        </Button>
      </div>
    </div>
  )
}

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
