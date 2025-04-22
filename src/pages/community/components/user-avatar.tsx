import { useChatStore } from "@/store"
import { colorUtil, cn } from "@/utils/style"
import { useState, useEffect } from "react"
import { fetchUserFromCache } from "../lib/utils"

interface UserAvatarProps {
  shape: 'circle' | 'square' | number
  avatar?: string
  src: string
  className?: string
  name?: string
  uid: string
  size?: string | number
}

export const UserAvatar = (props: UserAvatarProps) => {
  const { shape, src, uid, className, size = 33, name: _name } = props
  const [avatar, setAvatar] = useState<string>(src)
  const [name, setName] = useState<string>(_name || uid)

  useEffect(() => {
    if (src) {
      setAvatar(src)
    } else {
      const channel = useChatStore.getState().lastChannel
      if (channel) {
        fetchUserFromCache(uid).then(r => {
          if (r.avatar) {
            setAvatar(r.avatar)
          } else {
            setName(r.name)
          }
        })
      }
    }
  }, [src, uid])

  const borderRadius = shape === 'circle' ? '50%' : shape === 'square' ? '4px' : `${shape ?? 0}px`

  const styles = {
    borderRadius,
    backgroundColor: avatar ? 'transparent' : colorUtil.stringToColor(name, 'hex'),
    width: size,
    height: size,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    color: '#fff'
  }

  if (!avatar) {
    return (
      <div className={cn(className)} style={styles}>
        {name.slice(0, 1).toUpperCase()}
      </div>
    )
  }

  return (
    <div className={cn(className, 'overflow-hidden')} style={styles}>
      <img className="w-full h-full" src={avatar} alt={avatar} />
    </div>
  )
}