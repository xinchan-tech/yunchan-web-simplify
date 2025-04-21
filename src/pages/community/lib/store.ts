import { Channel, ConnectStatus } from 'wukongimjssdk'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { ChatCmdType, ChatMessageType, type ChatStore, chatConstants } from './types'

const wsUrlPrefix = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`

const useChatStore = create<ChatStore>()(
  persist(
    _get => ({
      state: ConnectStatus.Disconnect,
      config: {
        addr: `${wsUrlPrefix}/im-ws`,
        deviceFlag: 5,
        timezone: 'local',
        timeFormat: 'ago'
      },
      channel: undefined,
      usersExpanded: true
    }),
    {
      name: 'community',
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
          deviceFlag: 5,
          timezone: state.config.timezone,
          timeFormat: state.config.timeFormat
        },
        lastChannel: JSON.stringify(state.channel),
        usersExpanded: state.usersExpanded
      })
    }
  )
)

export { useChatStore }

export const chatManager = {
  getWsConfig: () => {
    const wsConfig = { ...useChatStore.getState().config }
    return wsConfig
  },
  setState: (state: ConnectStatus) => {
    useChatStore.setState({
      state
    })
  },
  setChannel: (channel: Channel) => {
    useChatStore.setState({
      channel: channel
    })
  },
  setUsersExpanded: (expanded: boolean) => {
    useChatStore.setState({
      usersExpanded: expanded
    })
  },
  setTimeFormat: (config: { timezone: ChatStore['config']['timezone']; format: ChatStore['config']['timeFormat'] }) => {
    useChatStore.setState({
      config: {
        ...useChatStore.getState().config,
        timezone: config.timezone,
        timeFormat: config.format
      }
    })
  }
}
export { chatConstants, ChatMessageType, ChatCmdType }
