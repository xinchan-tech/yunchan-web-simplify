import { type EventResult, wsManager } from '@/utils/ws'
import { uid } from "radash"
import { useCallback, useEffect } from 'react'

type WsChatData = {
  type: number
  user_id: string
  content: string
}

export const useWsChat = (handler: (data: any) => void ) => {
  const send = useCallback(
    async (userId: string, data: WsChatData['content']): Promise<string> => {
      const wsMsgId = uid(16)
      let timer: number | undefined = undefined
      const payload = {
        event: 'chat',
        data: {
          type: 0,
          user_id: userId,
          content: data
        },
        msg_id: wsMsgId
      }

      return new Promise((resolve, reject) => {
        wsManager.send(JSON.stringify(payload))

        const handler = (data: EventResult<'ack'>) => {
          if(data.msg_id === wsMsgId) {
            resolve('message')
            wsManager.off('ack', handler)
          }
        }

        timer = window.setTimeout(() => {
          reject(new Error('timeout'))
          wsManager.off('ack', handler)
        }, 60 * 1000 * 2)
  
        wsManager.on('ack', handler)
      })
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
