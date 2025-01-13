import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Channel, Message, Subscriber } from "wukongimjssdk";
import { ConversationWrap } from "@/pages/groupchat/ConversationWrap";
import { useRef } from "react";

interface GroupChatStore {
  bottomHeight: number;
  setBottomHeight: (payload: number) => void;
  selectedChannel: Channel | null;
  setSelectedChannel: (payload: Channel) => void;
  toChannel: Channel | null;
  setToChannel: (payload: Channel) => void;

}

export const useGroupChatStoreNew = create<GroupChatStore>()(
  persist(
    (set, get) => ({
     
      bottomHeight: 185,
      setBottomHeight: (payload: number) => set({ bottomHeight: payload }),
      selectedChannel: null,
      setSelectedChannel: (payload: Channel) =>
        set({ selectedChannel: payload }),
      toChannel: null,
      setToChannel(payload: Channel) {
        set({ toChannel: payload });
      },
     
    }),
    {
      name: "group-chat",
      storage: createJSONStorage(() => localStorage),
    }
  )
);



interface GroupChatShortStore {
  avatarColorMap: Map<string, string>
  setAvatarColorMap: (map:Map<string, string>) => void
  conversationWraps: ConversationWrap[]
  setConversationWraps: (data: ConversationWrap[]) => void
  replyMessage: Message | null; // 回复的消息
  inputValue: string; // 输入框消息
  setInputValue: (s:string) => void
  subscribers: Subscriber[] // 当前群的群成员
  setSubscribers: (payload: Subscriber[]) => void
  setReplyMessage: (message: Message | null) => void
  messages: Message[]
  setMessages: (data: Message[]) => void
  locatedMessageId: string
  setLocatedMessageId: (locatedMessageId: string) =>void

}

export const useGroupChatShortStore = create<GroupChatShortStore>(
  (set, get) => ({
    setReplyMessage: (msg: Message | null) => {
      set({replyMessage: msg})
    },
    replyMessage: null,
    inputValue: '',
    setInputValue: (str:string) => {
      set({inputValue: str})
    },
    conversationWraps: [],
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
        subscribers:payload
      })
    },
    messages: [],
    setMessages: (data: Message[]) => {
      set({messages: data})
    },
    locatedMessageId: '',
    setLocatedMessageId(locatedMessageId) {
      set({
        locatedMessageId
      })
    },

  })
);
