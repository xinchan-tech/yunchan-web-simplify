import { Channel, ConnectStatus } from 'wukongimjssdk'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { type ChatChannel, ChatCmdType, ChatConnectStatus, ChatMessageType, type ChatStore, chatConstants } from './types'

const wsUrlPrefix = `${window.location.protocol === 'https:' ? 'wss' : 'ws'}://${window.location.host}`

const useChatStore = create<ChatStore>()(
  persist(
    _get => ({
      state: ChatConnectStatus.Disconnect,
      config: {
        addr: `${wsUrlPrefix}/im-ws`,
        deviceFlag: 5,
        timezone: 'local',
        timeFormat: 'ago'
      },
      channel: undefined,
      usersExpanded: true,
      chatConfig: {
        voteShow: {}
      }
    }),
    {
      name: 'community',
      partialize: state => ({
        config: {
          addr: `${wsUrlPrefix}/im-ws`,
          deviceFlag: 5,
          timezone: state.config.timezone,
          timeFormat: state.config.timeFormat
        },
        channel: state.channel,
        chatConfig: state.chatConfig,
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
  setState: (state: ChatConnectStatus) => {
    useChatStore.setState({
      state
    })
  },
  getState: () => {
    return useChatStore.getState().state
  },
  setChannel: (channel?: ChatChannel) => {
    useChatStore.setState({
      channel: channel
    })
  },
  getChannel: () => {
    return useChatStore.getState().channel
  },
  toChannel: (channel: ChatChannel): Channel => {
    return new Channel(channel.id, channel.type)
  },
  hideVote: (voteId: number, channelId: string) => {
    const chatConfig = useChatStore.getState().chatConfig
    const voteShow = {...chatConfig.voteShow}
    if (voteShow[channelId]) {
      voteShow[channelId].show = false
      voteShow[channelId].voteId = voteId
    } else {
      voteShow[channelId] = { show: false, voteId }
    }
 
    useChatStore.setState({
      chatConfig: {
        ...chatConfig,
        voteShow: voteShow
      }
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
