import { useLatestRef } from '@/hooks'
import { ChatMessageType } from '@/store'
import { useEffect } from 'react'
import WKSDK, { type CMDContent, type MessageListener } from 'wukongimjssdk'

export const useMessageListener = (cb: MessageListener) => {
  const lastFn = useLatestRef(cb)
  useEffect(() => {
    const listener: MessageListener = message => {
      lastFn.current(message)
    }

    WKSDK.shared().chatManager.addMessageListener(listener)

    return () => {
      WKSDK.shared().chatManager.removeMessageListener(listener)
    }
  }, [lastFn])
}

export const useCMDListener = (cb: MessageListener) => {
  const lastFn = useLatestRef(cb)
  useEffect(() => {
    const listener: MessageListener = message => {
      console.log('cmd listener', message)
      lastFn.current(message)
    }

    WKSDK.shared().chatManager.addCMDListener(listener)

    return () => {
      WKSDK.shared().chatManager.removeCMDListener(listener)
    }
  }, [lastFn])
}

export const useMessageRevokeListener = (cb: MessageListener) => {
  return useCMDListener(me => {
    const cmdContent = me.content as CMDContent

    if (cmdContent.contentType === ChatMessageType.RevokeMessage) {
      cb(me)
    }
  })
}
