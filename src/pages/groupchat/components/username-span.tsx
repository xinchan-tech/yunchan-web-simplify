import { useMount } from "ahooks"
import { type HTMLAttributes, useState } from "react"
import { fetchUserInChannel } from "../lib/utils"
import type { Channel } from "wukongimjssdk"

interface UsernameSpanProps extends HTMLAttributes<HTMLSpanElement> {
  uid: string
  channel: Channel
  colon?: boolean
}

export const UsernameSpan = ({ uid, channel, colon, ...props }: UsernameSpanProps) => {
  const [userName, setUserName] = useState<string | null>('')

  useMount(() => {
    fetchUserInChannel(channel, uid).then(s => setUserName(s.name))
  })

  return <span {...props}>{userName}{colon && userName ? ': ' : ''}</span>
}