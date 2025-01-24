import { useConfig } from "@/store"
import { cn } from "@/utils/style"
import { cva, type VariantProps } from "class-variance-authority"
import Decimal from "decimal.js"
import { JknIcon } from ".."
import { useLatest, useUpdateEffect } from "ahooks"
import { type HTMLAttributes, useEffect, useRef, useState } from "react"
import { stockSubscribe, type StockSubscribeHandler } from "@/utils/stock"
import { get, isFunction } from "radash"
import { usePropValue } from "@/hooks"

const numSpanVariants = cva(
  '',
  {
    variants: {
      isPositive: {
        default:
          'text-foreground',
        false:
          'text-stock-down',
        true:
          'text-stock-up'
      },
      block: {
        default: "",
        true: "box-border w-full rounded-[2px] text-center px-2 py-1"
      }
    },
    compoundVariants: [
      {
        isPositive: true,
        block: true,
        className: "text-foreground bg-stock-up"
      },
      {
        isPositive: false,
        block: true,
        className: "text-foreground bg-stock-down"
      }
    ],
    defaultVariants: {
      isPositive: "default",
      block: "default",
    },
  })

interface NumSpanProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof numSpanVariants> {
  /**
   * 值
   */
  value: number | string | Decimal | undefined
  /**
   * 百分比
   */
  percent?: boolean
  /**
   * 是否符号
   */
  symbol?: boolean

  /**
   * 分数位数
   */
  decimal?: number

  /**
   * 单位
   */
  unit?: boolean

  /**
   * 箭头
   */
  arrow?: boolean

  /**
   * 对齐
   */
  align?: 'left' | 'center' | 'right'

  /**
   * 闪烁
   */
  blink?: boolean
}



export const NumSpan = ({ isPositive, block, percent, value, symbol, className, arrow, decimal = 3, unit = false, blink, align = 'left', ...props }: NumSpanProps) => {
  const { setting: { upOrDownColor, priceBlink } } = useConfig()
  const lastValue = useRef(value)
  const span = useRef<HTMLSpanElement>(null)
  const priceBlinkTimer = useRef<number>()
  // console.log(lastValue.current, value)
  useUpdateEffect(() => {
    if (blink && priceBlink === '1') {

      if (!priceBlinkTimer.current) {

        if (lastValue.current === undefined || !value) return

        if (lastValue.current === value) return

        const randomDelay = Math.random() * 500

        priceBlinkTimer.current = window.setTimeout(() => {
          const blinkState = lastValue.current! < value ? 'down' : 'up'
          lastValue.current = value
          span.current?.setAttribute('data-blink', blinkState)

          setTimeout(() => {
            span.current?.removeAttribute('data-blink')
            priceBlinkTimer.current = undefined
          }, 500)
        }, randomDelay)
      }
    }
  }, [value, blink, priceBlink])

  if (!value && value !== 0) return '-'
  const num = Decimal.isDecimal(value) ? value : new Decimal(value)

  return (
    <span className={cn(
      'inline-flex items-center flex-nowrap space-x-0.5 box-border stock-blink',
      (block || blink) && 'w-full h-full',
      blink && 'px-1',
      align === 'left' && 'justify-start',
      align === 'center' && 'justify-center',
      align === 'right' && 'justify-end'
    )} ref={span}>
      <span className={cn(
        numSpanVariants({ isPositive, block, className }),
      )} {...props}>
        {symbol && num.gte(0) ? '+' : ''}
        {
          unit !== false ? num.toDecimalPlaces(decimal).toShortCN() : num.toFixed(decimal)
        }
        {percent && '%'}
      </span>
      {
        arrow ? (
          upOrDownColor === 'upGreenAndDownRed' ? (
            <JknIcon className="w-4 h-4" name={isPositive ? 'ic_price_up_green' : 'ic_price_down_red'} />
          ) : (
            <JknIcon className="w-4 h-4" name={isPositive ? 'ic_price_up_red' : 'ic_price_down_green'} />
          )
        ) : null
      }
    </span>
  )
}

interface NumSpanSubscribeProps extends Omit<NumSpanProps, 'value'> {
  code: string
  field: keyof Parameters<StockSubscribeHandler<'quote'>>[0]['record'] | ((data: Parameters<StockSubscribeHandler<'quote'>>[0]['record']) => number | string | undefined)
  value?: number | string
  subscribe?: boolean
}

export const NumSpanSubscribe = ({ value, code, isPositive, field, subscribe = true, ...props }: NumSpanSubscribeProps) => {
  const [innerValue, setInnerValue] = useState(value && props.percent ? +value * 100 : value)
  const [isUp, setIsUp] = usePropValue(isPositive)
  const isPos = useRef(isPositive)
  const fieldFn = useRef<NumSpanSubscribeProps['field']>(field)

  useEffect(() => {
    fieldFn.current = field
  }, [field])

  useEffect(() => {
    if (!subscribe) return
    const unSubscribe = stockSubscribe.onQuoteTopic(code, (data) => {

      let v = isFunction(fieldFn.current) ? fieldFn.current(data.record) : get(data.record, fieldFn.current)

      if (props.percent) {
        v = (v as number) * 100
      }
      setInnerValue(v as number | string | undefined)
      if (isPos.current !== undefined) {
        setIsUp(data.record.percent > 0)
      }
    })

    return () => {
      unSubscribe()
    }
  }, [code, props.percent, subscribe, setIsUp])

  useEffect(() => {
    setInnerValue(value && props.percent ? +value * 100 : value)
  }, [value, props.percent])

  return (
    <>
      {
        subscribe ? (
          <NumSpan value={innerValue} isPositive={isUp} {...props} />
        ) : (
          <NumSpan value={value} isPositive={isPositive} {...props}  />
        )
      }
    </>
  )
}

/**
 * 一个订阅股票数据span标签
 */
interface SubscribeSpanProps extends HTMLAttributes<HTMLSpanElement> {
  value: number | string | undefined
  symbol: string
  field: keyof Parameters<StockSubscribeHandler<'quote'>>[0]['record'] | ((data: Parameters<StockSubscribeHandler<'quote'>>[0]) => number | string | undefined)
  positive?: boolean
  format: (value?: number | string) => string | number | undefined
}


export const SubscribeSpan = ({ value, symbol, field, positive, format, ...props }: SubscribeSpanProps) => {
  const [innerValue, setInnerValue] = usePropValue(value)
  const spanRef = useRef<HTMLSpanElement>(null)
  const isPos = useRef(positive)
  const fieldFn = useRef(field)
  const formatFn = useRef(format)


  useEffect(() => {
    const unSubscribe = stockSubscribe.onQuoteTopic(symbol, (data) => {

      let v = isFunction(fieldFn.current) ? fieldFn.current(data) : get(data.record, fieldFn.current) as number | string | undefined

      if (formatFn.current) {
        v = formatFn.current(v)
      }

      setInnerValue(v as number | string | undefined)
      if (isPos.current !== undefined) {

        spanRef.current?.classList.remove('text-stock-up')
        spanRef.current?.classList.remove('text-stock-down')

        if (data.record.percent > 0) {
          spanRef.current?.classList.add('text-stock-up')
        } else {
          spanRef.current?.classList.add('text-stock-down')
        }
      }
    })

    return () => {
      unSubscribe()
    }
  }, [symbol, setInnerValue])


  return <span ref={spanRef} {...props}>{innerValue}</span>
}