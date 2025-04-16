import { useMount } from 'ahooks'
import { type HTMLAttributes, useEffect, useState } from 'react'
import type { Channel } from 'wukongimjssdk'
import { fetchUserInChannel } from '../lib/utils'

interface UsernameSpanProps extends HTMLAttributes<HTMLSpanElement> {
  uid: string
  channel: Channel
  name?: string
  colon?: boolean
}

export const UsernameSpan = ({ uid, channel, colon, name, ...props }: UsernameSpanProps) => {
  const [userName, setUserName] = useState<string | null>(name || '')

  useEffect(() => {
    if (name) return
    fetchUserInChannel(channel, uid).then(s => {
      setUserName(s.name)
    })
  }, [uid, channel, name])

  return (
    <span {...props}>
      {userName}
      {colon && userName ? ': ' : ''}
    </span>
  )
}
