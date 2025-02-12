import { type ComponentType, memo, useCallback, useMemo, useRef, type ComponentProps } from 'react'
import { SubscribeSpan } from './num-span'
import { JknIcon } from '../jkn/jkn-icon'
import { usePropValue } from '@/hooks'
import Decimal from 'decimal.js'

type SubscribeSpanProps = ComponentProps<typeof SubscribeSpan>
type OnValueChangeFn = NonNullable<SubscribeSpanProps['onChange']>

interface NumberSubscribeSpanProps {
  /**
   * 0时显示
   */
  zeroText?: string
  /**
   * 保留小数位数
   */
  decimal?: number
  /**
   * 是否显示符号
   */
  showSign?: boolean
  initValue?: string | number
  initDirection?: boolean
  showColor?: boolean
  onValueChange?: OnValueChangeFn
}

const BaseNumberFormatter = (v: number | string | undefined, decimal: number, zeroText?: string) => {
  if (zeroText) {
    if (!v) {
      return zeroText
    }

    if (!+v) {
      return zeroText
    }
  } else if (!v) {
    if (v === 0) {
      return v.toFixed(decimal)
    }
    return v
  }

  return (+v).toFixed(decimal)
}

const useBaseSubscribe = (
  initValue: string | number | undefined,
  initDirection: boolean | undefined,
  formatter: (v?: number | string) => string | number | undefined,
  onValueChange?: NumberSubscribeSpanProps['onValueChange']
) => {
  const [direction, setDirection] = usePropValue<'up' | 'down' | undefined>(
    initDirection !== undefined ? (initDirection ? 'up' : 'down') : undefined
  )
  const value = useMemo(() => formatter(initValue), [initValue, formatter])

  const onChange = useCallback<OnValueChangeFn>(
    (data, extra) => {
      const newDirection = data.record.close - data.record.preClose > 0 ? 'up' : 'down'
      if (newDirection !== direction) {
        setDirection(newDirection)
      }

      onValueChange?.(data, extra)
    },
    [direction, setDirection, onValueChange]
  )

  return {
    onChange,
    value,
    direction
  }
}

/**
 * 价格订阅组件
 */
interface PriceSubscribeSpanProps
  extends NumberSubscribeSpanProps,
    Omit<ComponentProps<typeof SubscribeSpan>, 'onChange' | 'formatter' | 'value'> {
  /**
   * 是否显示箭头
   */
  arrow?: boolean
}

export const PriceSubscribeSpan = memo(
  ({
    zeroText,
    decimal = 2,
    arrow,
    showSign = false,
    showColor,
    initValue,
    initDirection,
    onValueChange,
    ...props
  }: PriceSubscribeSpanProps) => {
    const numberFormatter = useCallback(
      (v?: number | string) => {
        return BaseNumberFormatter(v, decimal, zeroText)
      },
      [decimal, zeroText]
    )

    const { value, direction, onChange } = useBaseSubscribe(initValue, initDirection, numberFormatter, onValueChange)
    const subscribeFormatter = useCallback<SubscribeSpanProps['formatter']>(
      data => {
        return numberFormatter(data.record.close)
      },
      [numberFormatter]
    )

    if (arrow) {
      return (
        <span>
          <SubscribeSpan
            data-direction={direction}
            data-direction-show={showColor}
            data-direction-sign={showSign}
            value={value}
            formatter={subscribeFormatter}
            onChange={onChange}
            {...props}
          />
          {value === zeroText ? null : <JknIcon.Arrow direction={direction} />}
        </span>
      )
    }

    return (
      <SubscribeSpan
        value={value}
        data-direction={direction}
        data-direction-show={showColor}
        data-direction-sign={showSign}
        formatter={subscribeFormatter}
        onChange={onChange}
        {...props}
      />
    )
  }
)

/**
 * 涨跌幅订阅组件
 */
interface PercentSubscribeSpanProps
  extends NumberSubscribeSpanProps,
    Omit<ComponentProps<typeof SubscribeSpan>, 'onChange' | 'formatter' | 'value'> {
  type?: 'percent' | 'amount'
  nanText?: string
}

export const PercentSubscribeSpan = memo(
  ({
    zeroText,
    decimal = 2,
    showSign = false,
    initValue,
    initDirection,
    showColor,
    type = 'percent',
    nanText,
    onValueChange,
    ...props
  }: PercentSubscribeSpanProps) => {
    const numberFormatter = useCallback(
      (v?: number | string) => {
        if (type === 'percent') {
          if ((Number.isNaN(v) || !Number.isFinite(v)) && nanText) {
            return nanText
          }
          const r = BaseNumberFormatter(+(v || 0) * 100, decimal, zeroText)
          return r === zeroText ? r : `${r}%`
        }
        return BaseNumberFormatter(v, decimal, zeroText)
      },
      [decimal, zeroText, type, nanText]
    )

    const { value, direction, onChange } = useBaseSubscribe(initValue, initDirection, numberFormatter, onValueChange)

    const subscribeFormatter = useCallback<SubscribeSpanProps['formatter']>(
      data => {
        if (type === 'percent') {
          return numberFormatter((data.record.close - data.record.preClose) / data.record.preClose)
        }
        return numberFormatter(data.record.close - data.record.preClose)
      },
      [numberFormatter, type]
    )

    return (
      <SubscribeSpan
        value={value}
        data-direction={direction}
        data-direction-show={showColor && value !== nanText}
        data-direction-sign={showSign && value !== nanText}
        formatter={subscribeFormatter}
        onChange={onChange}
        {...props}
      />
    )
  }
)

interface PercentSubscribeBlockProps extends PercentSubscribeSpanProps {}

export const PercentSubscribeBlock = memo(
  ({
    zeroText,
    decimal = 2,
    showSign = false,
    initValue,
    initDirection,
    showColor,
    type = 'percent',
    nanText,
    onValueChange,
    ...props
  }: PercentSubscribeBlockProps) => {
    const numberFormatter = useCallback(
      (v?: number | string) => {
        if (type === 'percent') {
          if ((Number.isNaN(v) || !Number.isFinite(v)) && nanText) {
            return nanText
          }
          const r = BaseNumberFormatter(+(v || 0) * 100, decimal, zeroText)
          return r === zeroText ? r : `${r}%`
        }
        return BaseNumberFormatter(v, decimal, zeroText)
      },
      [decimal, zeroText, type, nanText]
    )

    const { value, direction, onChange } = useBaseSubscribe(initValue, initDirection, numberFormatter, onValueChange)

    const subscribeFormatter = useCallback<SubscribeSpanProps['formatter']>(
      data => {
        if (type === 'percent') {
          return numberFormatter((data.record.close - data.record.preClose) / data.record.preClose)
        }
        return numberFormatter(data.record.close - data.record.preClose)
      },
      [numberFormatter, type]
    )

    return (
      <div
        className="inline-block text-center w-[70px] whitespace-nowrap leading-6 rounded-[2px] box-border"
        data-direction-bg={direction}
        data-direction-nan={value === nanText}
      >
        <SubscribeSpan
          value={value}
          data-direction-show={false}
          formatter={subscribeFormatter}
          onChange={onChange}
          {...props}
        />
      </div>
    )
  }
)

/**
 * 成交额订阅组件
 */
interface TurnoverSubscribeSpanProps
  extends Omit<NumberSubscribeSpanProps, 'showSign'>,
    Omit<ComponentProps<typeof SubscribeSpan>, 'onChange' | 'formatter' | 'value'> {}

export const TurnoverSubscribeSpan = memo(
  ({
    zeroText,
    decimal = 2,
    initValue,
    initDirection,
    showColor,
    onValueChange,
    ...props
  }: TurnoverSubscribeSpanProps) => {
    const numberFormatter = useCallback(
      (v?: number | string) => {
        const r = BaseNumberFormatter(v, decimal, zeroText)

        if (r === zeroText) {
          return r
        }

        return Decimal.create(r).toShortCN(decimal)
      },
      [decimal, zeroText]
    )

    const { value, direction, onChange } = useBaseSubscribe(initValue, initDirection, numberFormatter, onValueChange)

    const subscribeFormatter = useCallback<SubscribeSpanProps['formatter']>(
      data => {
        return numberFormatter(data.record.turnover)
      },
      [numberFormatter]
    )

    return (
      <SubscribeSpan
        value={value}
        data-direction={direction}
        data-direction-show={showColor}
        formatter={subscribeFormatter}
        onChange={onChange}
        {...props}
      />
    )
  }
)

/**
 * 总市值订阅组件
 */
interface MarketValueSubscribeSpanProps
  extends Omit<NumberSubscribeSpanProps, 'showSign'>,
    Omit<ComponentProps<typeof SubscribeSpan>, 'onChange' | 'formatter' | 'value'> {
  totalShare: number
}

export const MarketValueSubscribeSpan = memo(
  ({
    zeroText,
    decimal = 2,
    initValue,
    initDirection,
    showColor,
    totalShare,
    onValueChange,
    ...props
  }: MarketValueSubscribeSpanProps) => {
    const numberFormatter = useCallback(
      (v?: number | string) => {
        const r = BaseNumberFormatter(v, decimal, zeroText)

        if (r === zeroText) {
          return r
        }

        return Decimal.create(r).toShortCN(decimal)
      },
      [decimal, zeroText]
    )

    const { value, direction, onChange } = useBaseSubscribe(initValue, initDirection, numberFormatter, onValueChange)

    const subscribeFormatter = useCallback<SubscribeSpanProps['formatter']>(
      data => {
        return numberFormatter(data.record.close * totalShare)
      },
      [numberFormatter, totalShare]
    )

    return (
      <SubscribeSpan
        value={value}
        data-direction={direction}
        data-direction-show={showColor}
        formatter={subscribeFormatter}
        onChange={onChange}
        {...props}
      />
    )
  }
)

export const withTableCellBlink = <T = any>(Component: ComponentType<T>) => {
  return memo((props: T) => {
    const ref = useRef<HTMLDivElement>(null)
    const timer = useRef<number | null>(null)
    const onValueChange = useCallback<OnValueChangeFn>((_, extra) => {
      let changeDirection = extra.changeDirection
      if (!changeDirection) {
        const newValue = Number.parseFloat(extra.newValue as string)
        const lastValue = Number.parseFloat(extra.lastValue as string)

        if (!Number.isNaN(newValue) && !Number.isNaN(lastValue)) {
          changeDirection = newValue > lastValue ? 'up' : 'down'
        }
      }

      if (timer.current) return
      timer.current = window.setTimeout(() => {
        if (changeDirection) {
          // 往上找三级父元素
          let target = ref.current?.parentElement
          for (let i = 0; i < 3; i++) {
            if (target?.classList.contains('rc-table-cell')) {
              target?.setAttribute('data-blink', changeDirection)

              setTimeout(() => {
                target?.removeAttribute('data-blink')
                timer.current = null
              }, 400)
            }
            target = target?.parentElement
          }
        }
      }, Math.random() * 200)
    }, [])
    return (
      <div className="inline-block" ref={ref}>
        <Component {...props} onValueChange={onValueChange} />
      </div>
    )
  })
}