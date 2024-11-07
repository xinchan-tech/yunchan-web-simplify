import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar"

interface JknAvatarProps {
  src?: string
  fallback?: string
}
const JknAvatar = (props: JknAvatarProps) => {
  return (
    <Avatar>
      <AvatarImage src={props.src} />
      <AvatarFallback><img src={props.fallback} alt="" /></AvatarFallback>
    </Avatar>
  )  
}

export default JknAvatar