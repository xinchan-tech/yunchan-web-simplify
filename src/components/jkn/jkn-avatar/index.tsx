import UserDefaultPng from '@/assets/icon/user_default.png'
import { colorUtil } from '@/utils/style'
import type { ComponentProps } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '../../ui/avatar'

interface JknAvatarProps extends ComponentProps<typeof Avatar> {
  src?: string
  fallback?: string
  title?: string
  randomBg?: boolean
}
const JknAvatar = ({ src, fallback, title, ...props }: JknAvatarProps) => {
  return (
    <Avatar {...props}>
      <AvatarImage src={src} />
      {title ? (
        <AvatarFallback style={{ background: colorUtil.stringToColor(colorUtil.removeUnicode(title).slice(0, 1).toUpperCase()) }}>
          {title.slice(0, 1).toUpperCase()}
        </AvatarFallback>
      ) : (
        <AvatarFallback>
          <img src={fallback ?? UserDefaultPng} alt="" className="w-full h-full" />
        </AvatarFallback>
      )}
    </Avatar>
  )
}

export default JknAvatar
