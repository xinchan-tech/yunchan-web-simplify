import { cn } from "@/utils/style"
import type { HtmlHTMLAttributes, ReactNode } from "react"
import { JknIconCheckbox } from './icon-checkbox'
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components"

const iconContext = import.meta.webpackContext('@/assets/icon', {
  recursive: true
})

const iconMap: Record<string, string> = {

}
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
}
const _JknIcon = ({ name, stock, className, checked, label, ...props }: JknIconProps) => {
  if (!name && !stock) {
    return null
  }

  const src = name ? iconMap[name] : `${import.meta.env.PUBLIC_BASE_ICON_URL}${stock}`

  // biome-ignore lint/a11y/useAltText: <explanation>
  const icon = (<img className={cn(
    'w-5 h-5 cursor-pointer rounded-full',
    checked && 'icon-checked',
    className
  )} src={src} alt=""  {...props} />
  )

  if (label) {
    return wrapperLabel(icon, label)
  }

  return icon
}

const wrapperLabel = (component: ReactNode, label: string | ReactNode) => {
  return (
    <HoverCard openDelay={300} closeDelay={300}>
      <HoverCardTrigger className="flex items-center">
        {component}
      </HoverCardTrigger>
      <HoverCardContent align="center" side="bottom" className="w-fit py-1 px-2 text-sm">
        {
          label
        }
      </HoverCardContent>
    </HoverCard>
  )
}

type JknIcon = typeof _JknIcon & {
  Checkbox: typeof JknIconCheckbox
}

const JknIcon = _JknIcon as JknIcon
JknIcon.Checkbox = JknIconCheckbox

export default JknIcon