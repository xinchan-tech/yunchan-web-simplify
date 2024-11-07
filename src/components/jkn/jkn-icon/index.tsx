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
  name: IconName
}
const JknIcon = ({ name, className, ...props }: JknIconProps) => {

  return (
    // biome-ignore lint/a11y/useAltText: <explanation>
    <img className={cn('w-5 h-5 cursor-pointer', className)} src={iconMap[name]} alt=""  {...props} />
  )
}

export default JknIcon