import { numToFixed, priceToCnUnit } from "@/utils/price"
import { cn } from "@/utils/style"
import { cva, type VariantProps } from "class-variance-authority"
import Decimal from "decimal.js"

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
        true: "h-full box-border w-full rounded-sm text-center px-2 py-1 float-right"
      },
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
  value: number | string
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
}



const NumSpan = ({ isPositive, block, percent, value, symbol, className, decimal = 3, unit = false, ...props }: NumSpanProps) => {
  if (!value && value !== 0) return '-'
  const num = new Decimal(value)
  return (
    <span className={cn(numSpanVariants({ isPositive, block, className }))} {...props}>
      {symbol && num.gte(0) ? '+' : ''}
      {
        unit !== false ? priceToCnUnit(num.toNumber(), decimal) : num.toFixed(decimal)
      }
      {percent && '%'}
    </span>
  )
}

export default NumSpan