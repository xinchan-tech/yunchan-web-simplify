import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components'
import { useConfig, useStockList } from '@/store'
import { cn } from '@/utils/style'
import { CSSProperties, type HtmlHTMLAttributes, type ReactNode, memo } from 'react'
import { JknIconCheckbox } from './icon-checkbox'

const iconContext = import.meta.webpackContext('@/assets/icon', {
  recursive: true
})

const iconMap: Record<string, string> = {}

for (const path of iconContext.keys()) {
  const mod = iconContext(path)
  const name = path.split('/').pop()?.replace('.png', '') as string
  if (iconMap[name]) {
    console.warn(`icon name duplicated: ${path}`)
  }

  iconMap[name] = mod as string
}

interface JknIconProps extends HtmlHTMLAttributes<HTMLImageElement> {
  className?: string
  name?: IconName
  stock?: string
  checked?: boolean
  label?: string | ReactNode
  style?: CSSProperties
}
const _JknIcon = ({ name, stock, className, checked, label, style, ...props }: JknIconProps) => {
  if (!name && !stock) {
    return null
  }

  const src = name ? iconMap[name] : `${import.meta.env.PUBLIC_BASE_ICON_URL}${stock}`

  // biome-ignore lint/a11y/useAltText: <explanation>
  const icon = (
    <img
      className={cn('w-5 h-5 cursor-pointer rounded-full', checked && 'icon-checked', className)}
      src={src}
      style={style}
      alt=""
      {...props}
    />
  )

  if (label) {
    return wrapperLabel(icon, label)
  }

  return icon
}

const wrapperLabel = (component: ReactNode, label: string | ReactNode) => {
  return (
    <HoverCard openDelay={300} closeDelay={300}>
      <HoverCardTrigger className="flex items-center">{component}</HoverCardTrigger>
      <HoverCardContent align="center" side="bottom" className="w-fit py-1 px-2 text-sm">
        {label}
      </HoverCardContent>
    </HoverCard>
  )
}

interface ArrowIconProps extends JknIconProps {
  direction?: 'up' | 'down'
}

const ArrowIcon = memo(({ direction, ...props }: ArrowIconProps) => {
  const {
    setting: { upOrDownColor }
  } = useConfig()

  return (
    <>
      {direction ? (
        <>
          {upOrDownColor === 'upGreenAndDownRed' ? (
            <JknIcon
              className="w-3 h-3"
              name={direction === 'up' ? 'ic_price_up_green' : 'ic_price_down_red'}
              {...props}
            />
          ) : (
            <JknIcon
              className="w-3 h-3"
              name={direction === 'up' ? 'ic_price_up_red' : 'ic_price_down_green'}
              {...props}
            />
          )}
        </>
      ) : null}
    </>
  )
})

interface JknSvgIconProps extends HtmlHTMLAttributes<SVGElement> {
  name: IconName
  size?: number
}

const JknSvgIcon = ({ name, size = 24, ...props }: JknSvgIconProps) => {
  return (
    <svg width={size} height={size} {...props}>
      <title>{name}</title>
      <use xlinkHref={`#icon-${name}`} />
    </svg>
  )
}

interface JknIconStockProps extends Omit<JknIconProps, 'stock'> {
  symbol: string
}

const JknIconStock = ({ symbol, className, ...props }: JknIconStockProps) => {
  const listMap = useStockList(s => s.listMap)
  const stock = listMap[symbol]

  // return <JknIcon stock={stock?.[0]} className="h-6 w-6" {...props} />
  return (
    <>
      {stock?.[0] ? (
        <JknIcon stock={stock[0]} className={cn('h-6 w-6 mr-3', className)}  {...props} />
      ) : (
        <div className={cn('h-6 w-6 mr-3 leading-6 text-center rounded-full bg-black', className)} {...props}>
          {symbol.slice(0, 1)}
        </div>
      )}
    </>
  )
}

type JknIcon = typeof _JknIcon & {
  Checkbox: typeof JknIconCheckbox
  Stock: typeof JknIconStock
  Arrow: typeof ArrowIcon
  Svg: typeof JknSvgIcon
}

export const JknIcon = _JknIcon as JknIcon
JknIcon.Stock = JknIconStock
JknIcon.Checkbox = JknIconCheckbox
JknIcon.Arrow = ArrowIcon
JknIcon.Svg = JknSvgIcon
