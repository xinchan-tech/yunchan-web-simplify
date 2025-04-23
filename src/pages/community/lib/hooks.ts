import { useLatestRef } from '@/hooks'
import { ChatMessageType } from '@/store'
import { useEffect } from 'react'
import WKSDK, {
  type Channel,
  type SubscriberChangeListener,
  type CMDContent,
  type MessageListener,
  type MessageStatusListener,
  type Message,
  MessageStatus
} from 'wukongimjssdk'
import type { ChatMessage } from "./types"

export const useMessageListener = (cb: MessageListener) => {
  useEffect(() => {
    WKSDK.shared().chatManager.addMessageListener(cb)

    return () => {
      WKSDK.shared().chatManager.removeMessageListener(cb)
    }
  }, [cb])
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

/**
 * 调用WKSDK.shared().channelManager.syncSubscribes后触发
 * 这时候subscribes已经同步完成
 */
export const useSubscribesListener = (channel: Nullable<Channel>, cb: SubscriberChangeListener) => {
  const lastFn = useLatestRef(cb)
  useEffect(() => {
    if (!channel) return
    const listener: SubscriberChangeListener = message => {
      lastFn.current(message)
    }

    WKSDK.shared().channelManager.addSubscriberChangeListener(listener)

    return () => {
      WKSDK.shared().channelManager.removeSubscriberChangeListener(listener)
    }
  }, [lastFn, channel])
}

export const useMessageStatusListener = (cb: MessageStatusListener) => {
  useEffect(() => {
    WKSDK.shared().chatManager.addMessageStatusListener(cb)

    return () => {
      WKSDK.shared().chatManager.removeMessageStatusListener(cb)
    }
  }, [cb])
}

export const useMediaUploadListener = (message: Message, cb: MessageStatusListener) => {
  useEffect(() => {
    
  })
}