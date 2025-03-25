import { getChatNameAndAvatar } from "@/api"
import { useChatStore } from "@/store"
import { cn, colorUtil } from '@/utils/style'
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import WKSDK from "wukongimjssdk"
import { fetchUserInChannel } from "../../lib/utils"

function userIdToColor(userId: string) {
  if (!userId) {
    return ''
  }
  // 步骤1：生成哈希值（基于djb2算法优化）
  let hash = 5381
  for (let i = 0; i < userId.length; i++) {
    hash = (hash << 5) + hash + userId.charCodeAt(i) // 等效 hash * 33 + charCode
  }

  // 步骤2：将哈希值转换为颜色分量
  const r = (hash & 0xff0000) >> 16 // 取高位字节作为红色
  const g = (hash & 0x00ff00) >> 8 // 取中间字节作为绿色
  const b = hash & 0x0000ff // 取低位字节作为蓝色

  // 步骤3：格式化为十六进制字符串
  const toHex = n => n.toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

const _ChatAvatar = (props: {
  data: {
    name: string
    avatar: string
    uid: string
  }
  className?: string
  radius?: string
  size?: 'sm' | 'lg'
}) => {
  const { data, className, radius = '50%', size } = props

  const renderName = () => {
    let name = ''
    const regex = /^[a-zA-Z0-9\u4e00-\u9fa5]+$/
    if (data && typeof data.name === 'string' && data.name.length > 0) {
      const strArr = data.name.split('')

      for (let i = 0; i < strArr.length; i++) {
        name = strArr[i]
        if (regex.test(name)) {
          break
        }
      }
    }

    return name.toLocaleUpperCase()
  }
  return (
    <div className={cn('chat-avatar', size === 'sm' ? 'w-5 h-5' : 'w-10 h-10', className)}>
      {data?.avatar ? (
        <img src={data.avatar} style={{ borderRadius: radius }} alt={''} />
      ) : (
        <div
          className={cn('flex justify-center items-center', size === 'sm' ? 'text-sm' : 'text-2xl font-semibold')}
          style={{
            borderRadius: radius,
            backgroundColor: data && userIdToColor(data.uid)
          }}
        >
          {renderName()}
        </div>
      )}

      <style jsx>
        {`
          .chat-avatar div,
          .chat-avatar img {
            width: 100%;
            height: 100%;
          }
        `}
      </style>
    </div>
  )
}

interface UserAvatarProps {
  shape: 'circle' | 'square' | number
  src: string
  className?: string
  uid: string
  size?: string
}

const UserAvatar = (props: UserAvatarProps) => {
  const { shape, src, uid, className, size = 33 } = props
  const [avatar, setAvatar] = useState<string>(src)
  const [name, setName] = useState<string>(uid)

  useEffect(() => {
    if (src) {
      setAvatar(src)
    } else {

      const channel = useChatStore.getState().lastChannel
      if (channel) {
        fetchUserInChannel(channel, uid).then(r => {
          if (r.avatar) {
            setAvatar(r.avatar)
          } else {
            setName(r.name)
          }
        })
      }

      // fetchAvatar.refetch().then(r => {
      //   if (r.data) {
      //     if (r.data.avatar) {
      //       setAvatar(r.data.avatar)
      //     } else {
      //       setName(r.data.name)
      //     }
      //   }
      // })
    }
  }, [src, uid])

  const borderRadius = shape === 'circle' ? '50%' : shape === 'square' ? '4px' : `${shape ?? 0}px`

  const styles = {
    borderRadius, backgroundColor: colorUtil.stringToColor(name, 'hex'), width: size, height: size, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#fff'
  }

  if (!avatar) {
    return (
      <div className={cn(className)} style={styles}>
        {
          name.slice(0, 1).toUpperCase()
        }
      </div>
    )
  }

  return (
    <div className={cn(className)} style={styles}>
      <img className="w-full" src={avatar} alt={avatar} />
    </div>
  )
}

const ChatAvatar = _ChatAvatar as typeof _ChatAvatar & { User: typeof UserAvatar }

ChatAvatar.User = UserAvatar

export default ChatAvatar
