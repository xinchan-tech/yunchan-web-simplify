import { useConfig } from "@/store"
import { priceToCnUnit } from "@/utils/price"
import { cn } from "@/utils/style"
import { cva, type VariantProps } from "class-variance-authority"
import Decimal from "decimal.js"
import { JknIcon } from ".."
import { useLatest, useMount, useUpdateEffect } from "ahooks"
import { useEffect, useRef } from "react"

const numSpanVariants = cva(
  '',
  {
    variants: {
      isPositive: {
        default:
          'text-stock-up',
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



const NumSpan = ({ isPositive, block, percent, value, symbol, className, arrow, decimal = 3, unit = false, blink, align = 'left', ...props }: NumSpanProps) => {
  const { setting: { upOrDownColor, priceBlink } } = useConfig()
  const lastValue = useRef(value)
  const span = useRef<HTMLSpanElement>(null)
  const priceBlinkTimer = useRef<number>()
  // console.log(lastValue.current, value)
  useUpdateEffect(() => {
    if (blink && priceBlink === '1') {

      if (!priceBlinkTimer.current) {

        if(lastValue.current === undefined || !value) return

        const blinkState = lastValue.current < value ? 'down' : 'up'
        lastValue.current = value
        span.current?.setAttribute('data-blink', blinkState)

        priceBlinkTimer.current = setTimeout(() => {
          span.current?.removeAttribute('data-blink')
          priceBlinkTimer.current = undefined
        }, 100)
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
    )}  ref={span}>
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

export default NumSpan