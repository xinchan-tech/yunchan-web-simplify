import { useConfig } from "@/store"
import { cn } from "@/utils/style"
import { cva, type VariantProps } from "class-variance-authority"
import Decimal from "decimal.js"
import { JknIcon } from ".."
import { useLatest, useUpdateEffect } from "ahooks"
import { useEffect, useRef, useState } from "react"
import { stockSubscribe, type StockSubscribeHandler } from "@/utils/stock"
import { get, isFunction } from "radash"

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
      <style jsx>{`

      `}</style>
    </span>
  )
}

interface NumSpanSubscribeProps extends Omit<NumSpanProps, 'value'> {
  code: string
  field: string | ((data: Parameters<StockSubscribeHandler<'quote'>>[0]) => number | string | undefined)
  value?: number | string
}

export const NumSpanSubscribe = ({ value, code, isPositive, field,...props }: NumSpanSubscribeProps) => {
  const [innerValue, setInnerValue] = useState(value)
  const [isUp, setIsUp] = useState(isPositive)
  const isPos = useLatest(isPositive)
  const fieldFn = useRef<NumSpanSubscribeProps['field']>(field)

  useEffect(() => {
    fieldFn.current = field
  }, [field])

  useEffect(() => {
    const unSubscribe = stockSubscribe.onQuoteTopic(code, (data) => {
     
      let v = isFunction(fieldFn.current) ? fieldFn.current(data) : get(data, fieldFn.current) 
      if(props.percent){
        v = (v as number) * 100
      }
      setInnerValue(v as number | string | undefined)
      if(isPos.current !== undefined){
        setIsUp(data.record.percent > 0)
      }
    })

    return () => {
      unSubscribe()
    }
  }, [code, props.percent, isPos])
  
  useEffect(() => {
    setInnerValue(value)
  }, [value])

  return <NumSpan value={innerValue} isPositive={isUp} {...props} />
}