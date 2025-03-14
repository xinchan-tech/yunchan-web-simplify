import { create } from 'zustand'
import { ChatChannelState, chatConstants, type ChatStore } from './types'
import { ConnectStatus } from 'wukongimjssdk'

const wsUrlPrefix = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`

const useChatStore = create<ChatStore>(() => ({
  state: ConnectStatus.Disconnect,
  config: {
    addr: `${wsUrlPrefix}/im-ws`,
    deviceFlag: 5
  },
  channel: {
    state: ChatChannelState.Fetching,
    data: []
  }
}))

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
  setChannelState: (state: ChatChannelState) => {
    useChatStore.setState({
      channel: {
        ...useChatStore.getState().channel,
        state
      }
    })
  },
  setChannelData: (data: ChatStore['channel']['data']) => {
    useChatStore.setState({
      channel: {
        ...useChatStore.getState().channel,
        data
      }
    })
  },
}

export { chatConstants }
