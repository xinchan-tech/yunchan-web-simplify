import type { StockRawRecord } from '@/api'
import resultImg from '@/assets/image/back-result.png'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  Input,
  JknDatePicker,
  JknIcon,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Separator,
  useModal
} from '@/components'
import { useLatestRef, useStack, useToast } from '@/hooks'
import { dateUtils } from '@/utils/date'
import { stockUtils } from '@/utils/stock'
import { cn } from '@/utils/style'
import { useMount, useUnmount } from 'ahooks'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import { memo, useRef, useState } from 'react'
import { useChartManage } from '../lib'
import { renderUtils } from '../lib/utils'
import confetti from 'canvas-confetti'

const disabledDate = (d: Date, candlesticks: StockRawRecord[]) => {
  if (!candlesticks.length) return true
  const day = dayjs(d)
  return (
    !dateUtils.isMarketOpen(day) || !dayjs().isAfter(d) || !day.isSameOrAfter(dateUtils.toUsDay(+candlesticks[0][0]!))
  )
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface BackTestBarProps {
  chartId: string
  candlesticks: StockRawRecord[]
  onNextCandlesticks: (candlestick: StockRawRecord) => void
  onPrevCandlesticks: (count: number) => void
  onChangeCandlesticks: (data: StockRawRecord[]) => void
  onAddBackTestRecord: (record: {
    time: number
    price: number
    count: number
    type: 'buy' | 'sell' | 'sellToZero' | 'buyToZero'
    index: number
    cost: number
  }) => void
  onSetBackTestRecord: (records: any[]) => void
}

type TradeRecord = {
  sell: {
    index: number
    time: number
    price: number
    count: number
    zero?: boolean
  }[]
  buy: TradeRecord['sell']
}

export const BackTestBar = memo((props: BackTestBarProps) => {
  const [speed, setSpeed] = useState<number>(1)
  const speedRef = useLatestRef(speed)
  const [number, setNumber] = useState<number>(100)
  const candlesticksRestore = useRef<StockRawRecord[]>(props.candlesticks)
  //交易记录
  const [tradeRecord, setTradeRecord] = useState<TradeRecord>({ sell: [], buy: [] })
  const [timer, setTimer] = useState<number | null>(null)

  const currentKline = useRef<number>(-1)
  const maxProfit = useStack<{ max: number; index: number }>([])
  const profit = useStack<{ profit: number; index: number }>([])
  const positiveProfitCount = useStack<{ count: number; index: number; total: number }>([])
  const [loading, setLoading] = useState<boolean>(false)

  const onDateChange = async (date?: string) => {
    // setStartDate(date)

    if (!date) {
      props.onChangeCandlesticks(candlesticksRestore.current)
      currentKline.current = -1
    } else {
      const kline = renderUtils.findNearestTime(
        candlesticksRestore.current,
        +dateUtils.toUsDay(date).valueOf().toString().slice(0, -3)
      )
      /**
       * 假的
       */
      setLoading(true)

      await sleep(Math.random() * 1000 + 500)

      setLoading(false)

      if (kline) {
        props.onChangeCandlesticks(candlesticksRestore.current.slice(0, kline.index + 1))
        currentKline.current = kline.index
        setTradeRecord({ buy: [], sell: [] })
        window.clearInterval(timer!)
        setTimer(null)
        profit.clear()
        maxProfit.clear()
        positiveProfitCount.clear()
        props.onSetBackTestRecord([])
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
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      return false
    }

    const next = candlesticksRestore.current[currentKline.current + 1]

    if (!next) {
      //最后一笔平仓
      closePosition(candlesticksRestore.current.length - 1)

      resultModel.modal.open()
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
      currentKline.current = -1
      return false
    }
    props.onNextCandlesticks(next)
    currentKline.current++

    return true
  }

  const toPrevLine = () => {
    if (currentKline.current === -1) return
    if (currentKline.current === 0) return
    // const prev = candlesticksRestore.current.slice(0, currentKline.current)

    props.onPrevCandlesticks(1)

    const current = candlesticksRestore.current[currentKline.current]

    const _tradeRecord = {
      buy: tradeRecord.buy.filter(t => t.time < +current[0]!),
      sell: tradeRecord.sell.filter(t => t.time < +current[0]!)
    }

    setTradeRecord(_tradeRecord)

    props.onSetBackTestRecord([
      ..._tradeRecord.buy.map(item => ({ ...item })),
      ..._tradeRecord.sell.map(item => ({ ...item }))
    ])

    if (profit.peek()?.index === currentKline.current) {
      profit.pop()
    }

    if (maxProfit.peek()?.index === currentKline.current) {
      maxProfit.pop()
    }

    if (positiveProfitCount.peek()?.index === currentKline.current) {
      positiveProfitCount.pop()
    }

    currentKline.current--
  }

  const toLastKLine = () => {
    if (currentKline.current === -1) return
    closePosition(currentKline.current)
    window.clearInterval(timer!)
    setTimer(null)
    resultModel.modal.open()
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    })
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
      (1 / speedRef.current) * 1000
    )
    setTimer(timer)
  }

  const stopBackTest = () => {
    window.clearInterval(timer!)
    setTimer(null)
  }

  const onChangeSpeed = (v: number) => {
    setSpeed(v)
    if (timer) {
      window.clearInterval(timer!)
      setTimer(null)
      window.setTimeout(() => {
        startBackTest()
      })
    }
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

    const _tradeRecord = { ...tradeRecord }

    const record = {
      index: currentKline.current,
      time: stock[0]! as unknown as number,
      price: +stock[2]!,
      count: number,
      type,
      cost: 0
    }

    _tradeRecord[type].push(record)

    const { profit: result, cost } = calcProfit(_tradeRecord)

    record.cost = cost

    setTradeRecord(_tradeRecord)

    props.onAddBackTestRecord(record)

    const lastProfit = profit.peek()
    const lastMaxProfit = maxProfit.peek()
    const diffProfit = result - (lastProfit?.profit ?? 0)

    if ((lastMaxProfit?.max ?? 0) < diffProfit) {
      if (lastMaxProfit?.index !== currentKline.current) {
        maxProfit.push({ max: diffProfit, index: currentKline.current })
      } else {
        maxProfit.pop()
        maxProfit.push({ max: diffProfit, index: currentKline.current })
      }
    }

    if (lastProfit?.index !== currentKline.current) {
      profit.push({ profit: result, index: currentKline.current })
    } else {
      profit.pop()
      profit.push({ profit: result, index: currentKline.current })
    }

    if (result !== 0) {
      const lastPositiveProfitCount = positiveProfitCount.peek()
      if (lastPositiveProfitCount?.index !== currentKline.current) {
        positiveProfitCount.push({
          count: (lastPositiveProfitCount?.count ?? 0) + (diffProfit > 0 ? 1 : 0),
          index: currentKline.current,
          total: (lastPositiveProfitCount?.total ?? 0) + 1
        })
      } else {
        positiveProfitCount.pop()
        positiveProfitCount.push({
          count: lastPositiveProfitCount.count + (diffProfit > 0 ? 1 : 0),
          index: currentKline.current,
          total: (lastPositiveProfitCount?.total ?? 0) + 1
        })
      }
    }
  }

  const calcProfit = (record: TradeRecord) => {
    const count = Math.min(
      record.buy.reduce((prev, cur) => prev + cur.count, 0),
      record.sell.reduce((prev, cur) => prev + cur.count, 0)
    )

    let buyTotal = 0
    let buyCount = count
    let buyCost = 0

    record.buy.forEach(({ price, count }) => {
      if (buyCount > count) {
        buyTotal += price * count
        buyCount -= count
      } else {
        buyTotal += price * buyCount
        buyCost += price * (count - buyCount)
        buyCount = 0
      }
    })

    let sellTotal = 0
    let sellCount = count
    let sellCost = 0
    record.sell.forEach(({ price, count }) => {
      if (sellCount > count) {
        sellTotal += price * count
        sellCount -= count
      } else {
        sellTotal += price * sellCount
        sellCost += -price * (count - sellCount)
        sellCount = 0
      }
    })

    return {
      profit: sellTotal - buyTotal,
      cost: buyCost + sellCost
    }
  }

  //平仓
  const closePosition = (index?: number) => {
    const current = index === undefined ? currentKline.current : index
    if (current === -1) {
      toast({
        description: '请先选择日期'
      })

      return
    }

    const stock = candlesticksRestore.current[current]
    const sellCount = tradeRecord.sell.reduce((prev, cur) => prev + cur.count, 0)
    const buyCount = tradeRecord.buy.reduce((prev, cur) => prev + cur.count, 0)

    const diffCount = sellCount - buyCount

    if (diffCount === 0) {
      // toast({
      //   description: '没有持仓'
      // })
      return
    }

    // if (diffCount === 0) return

    const _tradeRecord = { ...tradeRecord }

    const record = {
      index: current,
      time: +stock[0]!,
      price: +stock[2]!,
      count: Math.abs(diffCount),
      type: diffCount > 0 ? 'buyToZero' : 'sellToZero',
      cost: 0
    }

    _tradeRecord[buyCount > sellCount ? 'sell' : 'buy'].push(record)

    const { profit: result, cost } = calcProfit(_tradeRecord)

    record.cost = cost

    setTradeRecord(_tradeRecord)

    // setTradeRecord(s => {
    //   s[diffCount > 0 ? 'buy' : 'sell'].push({
    //     index: current,
    //     time: +stock[0]!,
    //     price: +stock[2]!,
    //     count: Math.abs(diffCount)
    //   })
    // })

    const lastProfit = profit.peek()
    const lastMaxProfit = maxProfit.peek()
    const diffProfit = result - (lastProfit?.profit ?? 0)

    if ((lastMaxProfit?.max ?? 0) < diffProfit) {
      if (lastMaxProfit?.index !== current) {
        maxProfit.push({ max: diffProfit, index: current })
      } else {
        maxProfit.pop()
        maxProfit.push({ max: diffProfit, index: current })
      }
    }

    if (lastProfit?.index !== current) {
      profit.push({ profit: result, index: current })
    } else {
      profit.pop()
      profit.push({ profit: result, index: current })
    }

    if (result !== 0) {
      const lastPositiveProfitCount = positiveProfitCount.peek()
      if (lastPositiveProfitCount?.index !== currentKline.current) {
        positiveProfitCount.push({
          count: (lastPositiveProfitCount?.count ?? 0) + (diffProfit > 0 ? 1 : 0),
          index: currentKline.current,
          total: (lastPositiveProfitCount?.total ?? 0) + 1
        })
      } else {
        positiveProfitCount.pop()
        positiveProfitCount.push({
          count: lastPositiveProfitCount.count + (diffProfit > 0 ? 1 : 0),
          index: currentKline.current,
          total: (lastPositiveProfitCount?.total ?? 0) + 1
        })
      }
    }

    props.onAddBackTestRecord(record as any)
  }

  const resultModel = useModal({
    title: undefined,
    closeIcon: true,
    footer: false,
    className: 'w-[540px]',
    closeOnMaskClick: false,
    content: () => {
      const symbol = useChartManage.getState().chartStores[props.chartId].symbol
      const timeIndex = useChartManage.getState().chartStores[props.chartId].interval

      const total = Math.max(tradeRecord.buy.length, tradeRecord.sell.length)

    
      return (
        <div className="text-center px-4 h-[444px] ">
          <div className="h-[108px] w-[100px] mx-auto mt-8">
            <img src={resultImg} className="w-full h-full" alt="" />
          </div>
          <div className="my-1 text-2xl text-white">再接再厉，交易员！</div>
          <div className="text-base text-foreground">
            您在 {symbol} - {stockUtils.intervalToStr(timeIndex)} 的表现
          </div>
          <div className="flex justify-between items-center mt-6 space-x-2 mx-auto w-[321px] h-[98px] border border-solid border-[#2E2E2E] rounded-lg">
            <div className="flex-1 rounded py-4">
              <div className="text-sm text-tertiary mb-3">
                {Decimal.create(profit.peek()?.profit).gt(0) ? '现金盈利' : '现金亏损'}
              </div>
              <div>
                <span
                  className={cn(
                    'text-3xl',
                    Decimal.create(profit.peek()?.profit).gt(0) ? 'text-stock-up' : 'text-stock-down'
                  )}
                >
                  {Decimal.create(profit.peek()?.profit).toShort()}
                </span>
                <span> USD</span>
              </div>
            </div>
            <Separator orientation="vertical" className="h-8 w-[1px] bg-[#2E2E2E]" />
            <div className="flex-1 rounded py-4">
              <div className="text-sm text-tertiary mb-3">成功率</div>
              <div>
                <span
                  className={cn(
                    'text-3xl',
                    Decimal.create(positiveProfitCount.peek()?.count).gt(0) ? 'text-stock-up' : 'text-stock-down'
                  )}
                >
                  {' '}
                  {total > 0 ? Decimal.create(positiveProfitCount.peek()?.count).div(total).mul(100).toFixed(2) : 0}
                </span>
                <span> %</span>
              </div>
            </div>
          </div>
          <div
            className="w-[321px] h-[42px] border border-solid border-[#2E2E2E] rounded-[30px] text-center mx-auto mt-8 leading-[42px] text-sm cursor-pointer"
            onClick={() => resultModel.modal.close()}
            onKeyDown={() => {}}
          >
            好的
          </div>
        </div>
      )
    }
  })

  useUnmount(() => {
    window.clearInterval(timer!)
    setTimer(null)
    setTradeRecord({ buy: [], sell: [] })
    profit.clear()
    maxProfit.clear()
    positiveProfitCount.clear()
  })

  return (
    <div className="h-12 box-border grid grid-cols-3 text-xs px-2 w-full">
      <div />
      <div className="flex items-center justify-center text-sm">
        <div className="flex items-center space-x-2">
          <JknDatePicker onChange={onDateChange} disabled={d => disabledDate(d, props.candlesticks ?? [])}>
            {v => (
              <div className="hover:bg-accent rounded-xs px-3 py-1 cursor-pointer flex items-center">
                <JknIcon.Svg name="calendar-3" className="align-middle" size={20} />
                &nbsp;<span className="text-sm">{v ?? '选择日期'}</span>
              </div>
            )}
          </JknDatePicker>
        </div>
        <Separator orientation="vertical" className="h-4 w-[1px] mx-2" />
        <div className="flex items-center space-x-3">
          {!timer ? (
            <div
              className="border cursor-pointer hover:bg-accent px-1 py-1 flex items-center rounded-xs"
              onClick={startBackTest}
              onKeyDown={() => {}}
            >
              <JknIcon.Svg name="play" size={16} label="开始" />
            </div>
          ) : (
            <div
              className="border cursor-pointer hover:bg-accent rounded-xs px-1 py-1 flex items-center"
              onClick={stopBackTest}
              onKeyDown={() => {}}
            >
              {/* TODO: 暂停ICON */}
              <JknIcon name="ic_huice3" className="w-3 h-3" label="暂停" />
              &nbsp;
              <span>暂停</span>
            </div>
          )}
          <div
            className="border cursor-pointer hover:bg-accent px-1 py-1 flex items-center rounded-xs"
            onClick={toPrevLine}
            onKeyDown={() => {}}
          >
            <JknIcon.Svg name="play-pre" size={16} label="上一根K线" />
          </div>
          <div
            className="border cursor-pointer hover:bg-accent px-1 py-1 flex items-center rounded-xs"
            onClick={toNextLine}
            onKeyDown={() => {}}
          >
            <JknIcon.Svg name="play-x1" size={16} label="下一根K线" />
          </div>
          <div className="border cursor-pointer hover:bg-accent rounded-xs px-1 py-1 flex items-center">
            <BackTestSpeed speed={speed} onChange={onChangeSpeed} />
          </div>
          <Separator orientation="vertical" className="h-4 w-[1px] mx-2" />
          <div
            className="border cursor-pointer hover:bg-accent px-1 py-1 flex items-center rounded-xs"
            onClick={toLastKLine}
            onKeyDown={() => {}}
          >
            <JknIcon.Svg name="play-x2" size={16} label="跳转到实时" />
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-4 justify-end">
        <span className="text-sm" data-direction={(profit.peek()?.profit ?? 0) > 0 ? 'up' : 'down'} data-direction-sign>
          {Decimal.create(profit.peek()?.profit ?? 0).toFixed(3)}
        </span>
        <Separator orientation="vertical" className="h-4 w-[1px] mx-2" />
        <Button
          size="sm"
          variant="destructive"
          className="bg-[#F23645] w-[72px] box-border h-8"
          onClick={() => action('sell')}
        >
          卖出
        </Button>
        <NumberInput value={number} onChange={setNumber} />
        <Button size="sm" className="bg-[#22AB94] w-[72px] box-border text-white h-8" onClick={() => action('buy')}>
          买入
        </Button>
        <Button size="sm" variant="outline" className="w-[72px] h-8" onClick={() => closePosition()}>
          平仓
        </Button>
      </div>
      {resultModel.context}
      {loading && (
        <div className="fixed left-0 right-0 bottom-0 top-0 bg-background/35 flex items-center justify-center z-10">
          <div className="w-60 bg-background/95 p-12 flex flex-col items-center">
            <JknIcon className="w-48 h-48" name="load" />
            <div className="text-center mt-4">回测准备中</div>
          </div>
        </div>
      )}
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
    <HoverCard openDelay={300} closeDelay={300}>
      <HoverCardTrigger className="flex items-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="w-6 text text-center cursor-pointer">
              <span>x{props.speed}</span>
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top">
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
      </HoverCardTrigger>
      <HoverCardContent align="center" side="bottom" className="w-fit py-1 px-2 text-sm">
        回测速度
      </HoverCardContent>
    </HoverCard>
  )
}

const NumberInput = (props: { value: number; onChange: (v: number) => void }) => {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <div className="min-w-4 text text-center cursor-pointer bg-accent rounded-sm px-2 h-8 box-border leading-8">
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
            onKeyDown={() => {}}
          >
            1
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value + 5)}
            onKeyDown={() => {}}
          >
            5
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value + 25)}
            onKeyDown={() => {}}
          >
            25
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value + 100)}
            onKeyDown={() => {}}
          >
            100
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value + 500)}
            onKeyDown={() => {}}
          >
            500
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value + 1000)}
            onKeyDown={() => {}}
          >
            1000
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(0)}
            onKeyDown={() => {}}
          >
            清零
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value - 1)}
            onKeyDown={() => {}}
          >
            -
          </div>
          <div
            className="text-center border border-solid border-border rounded-sm leading-6 cursor-pointer hover:bg-accent"
            onClick={() => props.onChange(props.value + 1)}
            onKeyDown={() => {}}
          >
            +
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
