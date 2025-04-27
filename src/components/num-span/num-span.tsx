import { usePropValue } from '@/hooks'
import { useConfig } from '@/store'
import { type StockTrading, stockUtils } from '@/utils/stock'
import { cn } from '@/utils/style'
import { useUpdateEffect } from 'ahooks'
import { type VariantProps, cva } from 'class-variance-authority'
import Decimal from 'decimal.js'
import { get, isFunction, isNumber } from 'radash'
import { type HTMLAttributes, memo, useEffect, useRef, useState } from 'react'
import { JknIcon } from '..'
import { stockSubscribe, type SubscribeQuoteType } from "@/utils/stock/subscribe"

const numSpanVariants = cva('', {
  variants: {
    isPositive: {
      default: 'text-foreground',
      false: 'text-stock-down',
      true: 'text-stock-up'
    },
    block: {
      default: '',
      true: 'box-border rounded-[2px] text-center px-1 py-0.5 w-[70px]'
    }
  },
  compoundVariants: [
    {
      isPositive: true,
      block: true,
      className: 'text-foreground bg-stock-up'
    },
    {
      isPositive: false,
      block: true,
      className: 'text-foreground bg-stock-down'
    }
  ],
  defaultVariants: {
    isPositive: 'default',
    block: 'default'
  }
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

  /**
   * 是否显示颜色
   */
  showColor?: boolean

  /**
   * 0时显示
   */
  zeroText?: string
}

/**
 * @deprecated 颜色不再由组件控制
 * @returns
 */
export const NumSpan = ({
  isPositive,
  block,
  percent,
  value,
  symbol,
  className,
  arrow,
  decimal = 3,
  unit = false,
  blink,
  align = 'left',
  showColor,
  zeroText,
  ...props
}: NumSpanProps) => {
  const {
    setting: { priceBlink }
  } = useConfig()
  const lastValue = useRef(value)
  const span = useRef<HTMLSpanElement>(null)
  const priceBlinkTimer = useRef<number>()

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

  const formattedValue =
    unit !== false
      ? num.toDP(decimal).toShortCN()
      : percent
        ? `${num.mul(100).toFixed(decimal)}%`
        : num.toFixed(decimal)

  return (
    <span
      className={cn(
        'inline-flex items-center flex-nowrap space-x-0.5 box-border stock-blink',
        (block || blink) && 'w-full h-full',
        blink && 'px-0',
        align === 'left' && 'justify-start',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end'
      )}
      ref={span}
    >
      <span
        className={cn(numSpanVariants({ isPositive: showColor === false ? undefined : isPositive, block, className }))}
        {...props}
      >
        {symbol && num.gte(0) ? '+' : ''}
        {zeroText && num.eq(0) ? zeroText : formattedValue}
      </span>
      {arrow ? <JknIcon.Arrow direction={isPositive ? 'up' : 'down'} /> : null}
    </span>
  )
}

interface NumSpanSubscribeProps extends Omit<NumSpanProps, 'value'> {
  code: string
  field:
    | keyof SubscribeQuoteType['record']
    | ((data: SubscribeQuoteType['record']) => number | string | undefined)
  value?: number | string
  subscribe?: boolean
}

/**
 * @deprecated
 * @returns
 */
export const NumSpanSubscribe = ({
  value,
  code,
  isPositive,
  field,
  subscribe = true,
  showColor,
  ...props
}: NumSpanSubscribeProps) => {
  const [innerValue, setInnerValue] = useState(value)
  const [isUp, setIsUp] = usePropValue(isPositive)
  const fieldFn = useRef<NumSpanSubscribeProps['field']>(field)

  useEffect(() => {
    fieldFn.current = field
  }, [field])

  useEffect(() => {
    if (!subscribe) return
    const unSubscribe = stockSubscribe.onQuoteTopic(code, data => {
      const v = isFunction(fieldFn.current) ? fieldFn.current(data.record) : get(data.record, fieldFn.current as string)

      setInnerValue(v as number | string | undefined)
      setIsUp(data.record.percent > 0)
    })

    return () => {
      unSubscribe()
    }
  }, [code, subscribe, setIsUp])

  useEffect(() => {
    setInnerValue(value)
  }, [value])

  /**
   * 临时处理
   */
  const _showColor = isFunction(fieldFn.current) ? false : showColor

  return (
    <>
      {subscribe ? (
        <NumSpan value={innerValue} isPositive={isUp} showColor={_showColor} {...props} />
      ) : (
        <NumSpan value={value} isPositive={isPositive} showColor={_showColor} {...props} />
      )}
    </>
  )
}

/**
 * 一个订阅股票数据span标签
 */
interface SubscribeSpanProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'onChange'> {
  value: number | string | undefined
  visibleOptimization?: boolean
  symbol: string
  formatter: (data: SubscribeQuoteType) => number | string | undefined
  /**
   * 周期
   */
  trading?: StockTrading | StockTrading[]
  /**
   * 是否订阅
   */
  subscribe?: boolean
  onChange?: (
    data: SubscribeQuoteType,
    extra: { changeDirection?: 'up' | 'down'; lastValue?: string | number; newValue?: number | string }
  ) => void
}

export const SubscribeSpan = memo(
  ({
    value,
    symbol,
    formatter,
    trading = 'intraDay',
    subscribe = true,
    onChange,
    className,
    visibleOptimization = true,
    ...props
  }: SubscribeSpanProps) => {
    const [innerValue, setInnerValue] = usePropValue(value)
    const spanRef = useRef<HTMLSpanElement>(null)
    const formatFn = useRef(formatter)
    const changeFn = useRef(onChange)
    const lastValue = useRef(value)
    const [visible, setVisible] = useState(!visibleOptimization)

    useEffect(() => {
      formatFn.current = formatter
    }, [formatter])

    useEffect(() => {
      changeFn.current = onChange
    }, [onChange])

    useEffect(() => {
      if (!visibleOptimization) {
        setVisible(true)
        return
      }

      const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          setVisible(entry.isIntersecting)
        })
      })

      observer.observe(spanRef.current!)

      return () => {
        observer.disconnect()
      }
    }, [visibleOptimization])

    useEffect(() => {
      if (!subscribe) return
      if (!visible) return
      const unSubscribe = stockSubscribe.onQuoteTopic(symbol, data => {
        if (symbol !== data.topic) {
          console.warn('SubscribeSpan: symbol not match', symbol, data.topic)
          return
        }
        if (trading) {
          const _trading = stockUtils.getTrading(stockUtils.parseTime(data.record.time.toString()))
          if (Array.isArray(trading)) {
            if (!trading.includes(_trading)) return
          } else {
            if (trading !== _trading) return
          }
        }

        const v = formatFn.current(data)

        if (v === lastValue.current) return

        let changeDirection: 'up' | 'down' | undefined = undefined

        if (isNumber(v) && isNumber(lastValue.current)) {
          changeDirection = v > lastValue.current ? 'up' : 'down'
        }
        const _lastValue = lastValue.current
        lastValue.current = v
        setInnerValue(v)
        changeFn.current?.(data, { changeDirection, lastValue: _lastValue, newValue: v })
      })

      return () => {
        unSubscribe()
      }
    }, [symbol, setInnerValue, trading, subscribe, visible])

    return (
      <span ref={spanRef} className={cn('subscribe-span', className)} {...props}>
        {innerValue}
      </span>
    )
  }
)
