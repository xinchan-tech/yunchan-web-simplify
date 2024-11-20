import { cn } from "@/utils/style"
import type { HtmlHTMLAttributes } from "react"

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
}
const JknIcon = ({ name, stock, className, ...props }: JknIconProps) => {
  if (!name && !stock) {
    return null
  }

  if (name) {
    // biome-ignore lint/a11y/useAltText: <explanation>
    return (
      <img className={cn('w-5 h-5 cursor-pointer', className)} src={iconMap[name]} alt=""  {...props} />
    )
  }

  return (
        // biome-ignore lint/a11y/useAltText: <explanation>
    <img className={cn('w-5 h-5 cursor-pointer rounded-full', className)} src={`${import.meta.env.PUBLIC_BASE_ICON_URL}${stock}`} alt=""  {...props} />
  )
}

export default JknIcon