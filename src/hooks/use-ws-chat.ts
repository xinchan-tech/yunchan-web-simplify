import { wsManager } from '@/utils/ws'
import { useCallback, useEffect } from 'react'

type WsChatData = {
  type: number
  user_id: string
  content: string
}

export const useWsChat = (handler: (data: any) => void ) => {
  const send = useCallback(
    (userId: string, data: WsChatData['content']) => {
      const payload = {
        event: 'chat',
        data: {
          type: 0,
          user_id: userId,
          content: data
        },
        msg_id: 430
      }

      wsManager.send(JSON.stringify(payload))
    },
    []
  )

  useEffect(() => {
    const close =  wsManager.on('message', handler)

    return close
  }, [handler])

  return {
    send
  }
}
