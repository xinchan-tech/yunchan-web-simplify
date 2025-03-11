import { type GroupDetailData, getGroupDetailService } from '@/api'
import type { ConversationWrap } from '@/pages/groupchat/ConversationWrap'
import type { GroupData } from '@/pages/groupchat/group-channel'
import type { Channel, Message, Subscriber } from 'wukongimjssdk'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

interface GroupChatStore {
  bottomHeight: number
  setBottomHeight: (payload: number) => void
  selectedChannel: Channel | null
  setSelectedChannel: (payload: Channel | null) => void
  toChannel: Channel | null
  setToChannel: (payload: Channel) => void
  timeFormat: {
    timezone: string
    format: string
  }
  setTimeFormat: (payload: { timezone: string; format: string }) => void
}

export const useGroupChatStoreNew = create<GroupChatStore>()(
  persist(
    (set, get) => ({
      bottomHeight: 185,
      setBottomHeight: (payload: number) => set({ bottomHeight: payload }),
      selectedChannel: null,
      setSelectedChannel: (payload: Channel | null) => set({ selectedChannel: payload }),
      toChannel: null,
      setToChannel(payload: Channel) {
        set({ toChannel: payload })
      },
      timeFormat: {
        timezone: 'local',
        format: 'ago'
      },
      setTimeFormat(payload: { timezone: string; format: string }) {
        set({ timeFormat: payload })
      }
    }),
    {
      name: 'group-chat',
      storage: createJSONStorage(() => localStorage)
    }
  )
)

export interface Product {
  product_sn: string
  price: string
  unit: '月' | '年'
}

interface GroupChatShortStore {
  avatarColorMap: Map<string, string>
  setAvatarColorMap: (map: Map<string, string>) => void
  conversationWraps: ConversationWrap[] | null
  setConversationWraps: (data: ConversationWrap[]) => void
  replyMessage: Message | null // 回复的消息
  inputValue: string // 输入框消息
  setInputValue: (s: string) => void
  subscribers: Subscriber[] // 当前群的群成员
  setSubscribers: (payload: Subscriber[]) => void
  fetchingSubscribers: boolean
  setFetchingSubscribers: (payload: boolean) => void
  setReplyMessage: (message: Message | null) => void
  messages: Message[]
  setMessages: (data: Message[]) => void
  locatedMessageId: string // 点击引用信息要跳转的位置
  setLocatedMessageId: (locatedMessageId: string) => void
  readyToJoinGroup: GroupData | null
  setReadyToJoinGroup: (data: GroupData | null) => void
  groupDetailData: GroupDetailData | null
  getGroupDetailData: (id: string) => Promise<void>
  filterMode: boolean
  setFilterMode: (mode: boolean) => void
  mentions: { name: string; uid: string }[]
  setMentions: (payload: { name: string; uid: string }[]) => void
  groupDetailFetching: boolean
}

export const useGroupChatShortStore = create<GroupChatShortStore>((set, get) => ({
  setReplyMessage: (msg: Message | null) => {
    set({ replyMessage: msg })
  },
  replyMessage: null,
  inputValue: '',
  setInputValue: (str: string) => {
    set({ inputValue: str })
  },
  conversationWraps: null,
  setConversationWraps: (data: ConversationWrap[]) => {
    set({
      conversationWraps: data
    })
  },
  avatarColorMap: new Map(),
  setAvatarColorMap: (map: Map<string, string>) => {
    set({
      avatarColorMap: map
    })
  },
  subscribers: [],
  setSubscribers: (payload: Subscriber[]) => {
    set({
      subscribers: payload
    })
  },
  fetchingSubscribers: false,
  setFetchingSubscribers(payload: boolean) {
    set({ fetchingSubscribers: payload })
  },
  messages: [],
  setMessages: (data: Message[]) => {
    set({ messages: data })
  },
  locatedMessageId: '',
  setLocatedMessageId(locatedMessageId) {
    set({
      locatedMessageId
    })
  },
  readyToJoinGroup: null,
  setReadyToJoinGroup: (data: GroupData | null) => {
    set({
      readyToJoinGroup: data
    })
  },
  groupDetailData: null,
  groupDetailFetching: false,
  getGroupDetailData: async (id: string) => {
    set({
      groupDetailFetching: true,
      groupDetailData: null
    })
    try {
      const resp = await getGroupDetailService(id)
      set({
        groupDetailData: resp,
        groupDetailFetching: false
      })
    } catch (er) {
      set({
        groupDetailFetching: false
      })
    }
  },
  filterMode: false,
  setFilterMode: mode => {
    set({ filterMode: mode })
  },
  setMentions: data => {
    set({ mentions: data })
  },
  mentions: []
}))

type ChatWindowStore = {
  reEditData: { timestap: number; text: string }
  setReEditData: (data: { timestap: number; text: string }) => void
  forceUpdateAvatarId: number
  updateForceUpdateAvatarId: () => void
}
export const useChatNoticeStore = create<ChatWindowStore>((set, get) => {
  return {
    reEditData: { timestap: 0, text: '' },
    setReEditData: (data: { timestap: number; text: string }) => {
      set({
        reEditData: data
      })
    },
    forceUpdateAvatarId: 1,
    updateForceUpdateAvatarId: () => {
      const now = new Date().getTime()
      set({
        forceUpdateAvatarId: now
      })
    }
  }
})
