import { create } from 'zustand'
import { type ChatChannelState, chatConstants, ChatMessageType, type ChatStore, ChatCmdType } from './types'
import { Channel, ChannelInfo, ConnectStatus } from 'wukongimjssdk'
import { createJSONStorage, persist } from 'zustand/middleware'

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
  // setConfig: (config: Required<Pick<ChatConfig, 'uid' | 'token'>>) => {
  //   useChatStore.setState({
  //     config: {
  //       ...useChatStore.getState().config,
  //       uid: config.uid,
  //       token: config.token
  //     }
  //   })
  // },
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
