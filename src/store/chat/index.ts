import { Channel, ChannelInfo, ConnectStatus } from 'wukongimjssdk'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { AssetsInfoStore } from '@/api'
import { useConfig } from '../config'
import { type ChatChannelState, ChatCmdType, ChatMessageType, type ChatStore, chatConstants } from './types'

const wsUrlPrefix = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`

const useChatStore = create<ChatStore>()(
  persist(
    _get => ({
      state: ConnectStatus.Disconnect,
      config: {
        addr: `${wsUrlPrefix}/im-ws`,
        deviceFlag: 5
      },
      lastChannel: undefined,
      lastChannelReady: false,
      usersExpanded: true
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => localStorage, {
        reviver: (key, value) => {
          if (key === 'lastChannel' && value) {
            const _channelObj = JSON.parse(value as string) as Channel
            return new Channel(_channelObj.channelID, _channelObj.channelType)
          }
          return value
        }
      }),
      partialize: state => ({
        config: {
          addr: `${wsUrlPrefix}/im-ws`,
          deviceFlag: 5
        },
        lastChannel: JSON.stringify(state.lastChannel),
        usersExpanded: state.usersExpanded
      })
    }
  )
)

export { useChatStore }

export const chatManager = {
  getWsConfig: () => {
    const debug = useConfig.getState().debug

    const wsConfig = { ...useChatStore.getState().config }

    if (debug) {
      wsConfig.addr = wsConfig.addr.replace('im-ws', 'im-ws-test')
    }

    return wsConfig
  },
  setState: (state: ConnectStatus) => {
    useChatStore.setState({
      state
    })
  },
  setLastChannelId: (channel: Channel) => {
    useChatStore.setState({
      lastChannel: channel
    })
  },
  setUsersExpanded: (expanded: boolean) => {
    useChatStore.setState({
      usersExpanded: expanded
    })
  },
  setLastChannelReady: (ready: boolean) => {
    useChatStore.setState({
      lastChannelReady: ready
    })
  }
}
export { chatConstants, ChatMessageType, ChatCmdType }

export const useAssetsInfoStore = create<AssetsInfoStore>((set) => ({
  data: null,
  setData: (data: any) => set({ data }), // 设置数据
}));
