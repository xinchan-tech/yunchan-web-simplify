import { useUser } from '@/store'
import { wsManager } from '@/utils/ws'
import { useCallback, useEffect } from 'react'
import { uid } from 'radash'

type WsMessageData = {
  type: number
  user_id: string
  content: string
}

export const useWsMessage = (handler: (data: any) => void ) => {
  const ws = wsManager.getActiveWs()
  const send = useCallback(
    (userId: string, data: WsMessageData['content']) => {
      const payload = {
        event: 'chat',
        data: {
          type: 0,
          user_id: userId,
          content: data
        },
        msg_id: 430
      }

      ws.send(JSON.stringify(payload))
    },
    [ws.send]
  )

  useEffect(() => {
    ws.on('message', handler)

    return () => {
      ws.off('message', handler)
    }
  }, [handler, ws])

  return {
    send
  }
}
