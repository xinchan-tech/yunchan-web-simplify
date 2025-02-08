import { memo, useCallback, useMemo, useState, type ComponentProps } from "react"
import { SubscribeSpan } from "./num-span"
import type { StockSubscribeHandler } from "@/utils/stock"
import { JknIcon } from "../jkn/jkn-icon"
import { usePropValue } from "@/hooks"
import Decimal from "decimal.js"

type SubscribeSpanProps = ComponentProps<typeof SubscribeSpan>

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
  onValueChange?: (direction: 'up' | 'down', changeDirection: 'up' | 'down') => void
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
    return v
  }


  return (+v).toFixed(decimal)
}

const useBaseSubscribe = (initValue: string | number | undefined, initDirection: boolean | undefined, formatter: (v?: number | string) => string | number | undefined, onValueChange?: NumberSubscribeSpanProps['onValueChange']) => {
  const [direction, setDirection] = usePropValue<'up' | 'down' | undefined>(initDirection !== undefined ? (initDirection ? 'up' : 'down') : undefined)

  const onChange = useCallback((data: Parameters<StockSubscribeHandler<"quote">>[0]) => {
    const newDirection = (data.record.close - data.record.preClose) > 0 ? 'up' : 'down'
    if (newDirection !== direction) {
      setDirection(newDirection)
    }
    // TODO: onValueChange
    // onValueChange?.(newDirection, )
  }, [direction, setDirection])

  const value = useMemo(() => formatter(initValue), [initValue, formatter])

  return {
    onChange,
    value,
    direction
  }
}

/**
 * 价格订阅组件
 */
interface PriceSubscribeSpanProps extends NumberSubscribeSpanProps, Omit<ComponentProps<typeof SubscribeSpan>, 'onChange' | 'formatter' | 'value'> {
  /**
   * 是否显示箭头
   */
  arrow?: boolean
}

export const PriceSubscribeSpan = memo(({ zeroText, decimal = 2, arrow, showSign = false, showColor, initValue, initDirection, ...props }: PriceSubscribeSpanProps) => {
  const numberFormatter = useCallback((v?: number | string) => {
    return BaseNumberFormatter(v, decimal, zeroText)
  }, [decimal, zeroText])

  const {
    value,
    direction,
    onChange
  } = useBaseSubscribe(initValue, initDirection, numberFormatter)
  const subscribeFormatter = useCallback<SubscribeSpanProps['formatter']>((data) => {
    return numberFormatter(data.record.close)
  }, [numberFormatter])

  if (arrow) {
    return (
      <span>
        <SubscribeSpan
          data-direction={direction}
          data-direction-show={showColor}
          data-direction-sign={showSign}
          value={value} formatter={subscribeFormatter} onChange={onChange} {...props} />
        {
          value === zeroText ? null : <JknIcon.Arrow direction={direction} />
        }
      </span>
    )
  }

  return (
    <SubscribeSpan value={value}
      data-direction={direction}
      data-direction-show={showColor}
      data-direction-sign={showSign}
      formatter={subscribeFormatter} onChange={onChange} {...props} />
  )
})



interface PercentSubscribeSpanProps extends NumberSubscribeSpanProps, Omit<ComponentProps<typeof SubscribeSpan>, 'onChange' | 'formatter' | 'value'> {
  type?: 'percent' | 'amount'
}

export const PercentSubscribeSpan = memo(({ zeroText, decimal = 2, showSign = false, initValue, initDirection, showColor, type = 'percent', ...props }: PercentSubscribeSpanProps) => {
  const numberFormatter = useCallback((v?: number | string) => {
    if (type === 'percent') {
      const r = BaseNumberFormatter(+(v || 0) * 100, decimal, zeroText)
      return r === zeroText ? r : `${r}%`
    }
    return BaseNumberFormatter(v, decimal, zeroText)
  }, [decimal, zeroText, type])

  const {
    value,
    direction,
    onChange
  } = useBaseSubscribe(initValue, initDirection, numberFormatter)

  const subscribeFormatter = useCallback<SubscribeSpanProps['formatter']>((data) => {
    if (type === 'percent') {
      return numberFormatter((data.record.close - data.record.preClose) / data.record.preClose)
    }
    return numberFormatter(data.record.close - data.record.preClose)
  }, [numberFormatter, type])


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
})


interface PercentSubscribeBlockProps extends PercentSubscribeSpanProps { }

export const PercentSubscribeBlock = memo((props: PercentSubscribeBlockProps) => {
  
  return (
    <div className="inline-block text-inherit" >
      <PercentSubscribeSpan {...props} showColor={false} type="percent" />
    </div>
  )
})


interface TurnoverSubscribeSpanProps extends Omit<NumberSubscribeSpanProps, 'showSign'>, Omit<ComponentProps<typeof SubscribeSpan>, 'onChange' | 'formatter' | 'value'> {

}

export const TurnoverSubscribeSpan = memo(({ zeroText, decimal = 2, initValue, initDirection, showColor, ...props }: TurnoverSubscribeSpanProps) => {
  const numberFormatter = useCallback((v?: number | string) => {
    const r = BaseNumberFormatter(v, decimal, zeroText)

    if (r === zeroText) {
      return r
    }

    return Decimal.create(r).toShortCN(decimal)
  }, [decimal, zeroText])

  const {
    value,
    direction,
    onChange
  } = useBaseSubscribe(initValue, initDirection, numberFormatter)

  const subscribeFormatter = useCallback<SubscribeSpanProps['formatter']>((data) => {
    return numberFormatter(data.record.turnover)
  }, [numberFormatter])

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
})


interface MarketValueSubscribeSpanProps extends Omit<NumberSubscribeSpanProps, 'showSign'>, Omit<ComponentProps<typeof SubscribeSpan>, 'onChange' | 'formatter' | 'value'> {
  totalShare: number
}

export const MarketValueSubscribeSpan = memo(({ zeroText, decimal = 2, initValue, initDirection, showColor, totalShare, ...props }: MarketValueSubscribeSpanProps) => {
  const numberFormatter = useCallback((v?: number | string) => {
    const r = BaseNumberFormatter(v, decimal, zeroText)

    if (r === zeroText) {
      return r
    }

    return Decimal.create(r).toShortCN(decimal)
  }, [decimal, zeroText])

  const {
    value,
    direction,
    onChange
  } = useBaseSubscribe(initValue, initDirection, numberFormatter)

  const subscribeFormatter = useCallback<SubscribeSpanProps['formatter']>((data) => {
    return numberFormatter(data.record.close * totalShare)
  }, [numberFormatter, totalShare])

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
})