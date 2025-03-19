import { useLatestRef } from '@/hooks'
import { useEffect } from 'react'
import WKSDK, {
  type Channel,
  type SubscriberChangeListener,
  type CMDContent,
  type MessageListener
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
