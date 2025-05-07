import { cleanUnreadConversation, loginImService } from '@/api'
import { useUser, useToken } from '@/store'
import { useMount } from 'ahooks'
import { useRef, useEffect } from 'react'
import WKSDK, { ConnectStatus, type ConnectStatusListener } from 'wukongimjssdk'
import { initImDataSource } from './datasource'
import { chatManager, useChatStore } from './store'
import { ChatConnectStatus, chatConstants } from './types'
import { chatEvent } from './event'
import { ConversationTransform } from './transform'
import { sessionCache } from '../cache'

/**
 * 连接IM
 */
export const useConnectIM = () => {
  const user = useUser(s => s.user)
  const loginStatus = useRef(false)
  const token = useToken(s => s.token)

  useMount(() => {
    if (!loginStatus.current) {
      loginImService().then(() => {
        loginStatus.current = true
      })
    }
  })

  useEffect(() => {
    if (!token || !user?.username) {
      return
    }

    const localConfig = chatManager.getWsConfig()
    const channel = new BroadcastChannel(chatConstants.broadcastChannelId)

    if (!user?.username || !token) {
      return
    }

    WKSDK.shared().config.uid = user.username
    WKSDK.shared().config.token = token
    WKSDK.shared().config.addr = localConfig.addr
    WKSDK.shared().config.deviceFlag = localConfig.deviceFlag
    WKSDK.shared().config.heartbeatInterval = 10 * 1000

    chatManager.setState(ChatConnectStatus.Connecting)

    const connectStatusListener: ConnectStatusListener = (status, reasonCode, connectInfo) => {
      chatManager.setState(status as unknown as ChatConnectStatus)

      if (status === ConnectStatus.Connected) {
        chatManager.setState(ChatConnectStatus.Syncing)

        /**
         * 先取缓存
         */
        sessionCache.getSessions().then(res => {
          /**
           * 判断当前状态
           */
          if (chatManager.getState() !== ChatConnectStatus.Syncing) return

          chatEvent.emit('syncSession', res)
        })

        WKSDK.shared()
          .conversationManager.sync()
          .then(r => {
            Promise.all(r.map(v => ConversationTransform.toSession(v)))
              .then(res => {
                if (!res.some(v => v.channel.id === useChatStore.getState().channel?.id)) {
                  console.warn('Warning: No matching channel found in synced sessions')
                  chatManager.setChannel(res[0].channel)
                }

                const lastChannel = chatManager.getChannel()
                res.forEach(v => {
                  if(v.channel.id === lastChannel?.id) {
                    v.unRead = 0
                    v.isMentionMe = false
                    cleanUnreadConversation(chatManager.toChannel(v.channel))
                  }
                })

                chatEvent.emit('syncSession', res)
                sessionCache.updateBatch(res)
                chatManager.setState(ChatConnectStatus.Connected)
              })
              .catch(() => {
                chatManager.setState(ChatConnectStatus.SyncingFail)
                console.error('Error syncing sessions')
              })
          })
      }

      if (status === ConnectStatus.ConnectKick || status === ConnectStatus.ConnectFail) {
        console.warn('Warning: Connection failed or kicked, code: {}, info: {}', reasonCode, connectInfo)
      }
    }

    WKSDK.shared().connectManager.addConnectStatusListener(connectStatusListener)
    // WKSDK.shared().chatManager.addCMDListener(cmdListener)

    channel.onmessage = event => {
      if (event.data.type === 'logout') {
        window.close()
      }
    }

    WKSDK.shared().connectManager.connect()
    return () => {
      channel.close()
      WKSDK.shared().connectManager.removeConnectStatusListener(connectStatusListener)
      // WKSDK.shared().chatManager.removeCMDListener(cmdListener)
      WKSDK.shared().disconnect()
    }
  }, [token, user?.username])
}
