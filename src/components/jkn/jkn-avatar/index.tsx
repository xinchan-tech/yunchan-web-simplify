import type { ComponentProps } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"
import UserDefaultPng from '@/assets/icon/user_default.png'

interface JknAvatarProps extends ComponentProps<typeof Avatar> {
  src?: string
  fallback?: string
}
const JknAvatar = ({src, fallback, ...props}: JknAvatarProps) => {
  return (
    <Avatar {...props}>
      <AvatarImage src={src} />
      <AvatarFallback><img src={fallback ?? UserDefaultPng} alt="" className="w-full h-full" /></AvatarFallback>
    </Avatar>
  )
}

export default JknAvatar