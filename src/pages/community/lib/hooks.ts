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

/**
 * 调用WKSDK.shared().channelManager.syncSubscribes后触发
 * 这时候subscribes已经同步完成
 */
export const useSubscribesListener = (channel: Undefinable<Channel>, cb: SubscriberChangeListener) => {
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

export const useMessageStatusListener = (message: Message, cb: MessageStatusListener) => {
  const lastFn = useLatestRef(cb)
  useEffect(() => {
    if (message.contentType === ChatMessageType.Cmd) return
    if (message.status !== MessageStatus.Wait) return
    const listener: MessageStatusListener = message => {
      lastFn.current(message)
    }

    WKSDK.shared().chatManager.addMessageStatusListener(listener)

    return () => {
      WKSDK.shared().chatManager.removeMessageStatusListener(listener)
    }
  }, [lastFn, message])
}

export const useMediaUploadListener = (message: Message, cb: MessageStatusListener) => {
  useEffect(() => {
    
  })
}