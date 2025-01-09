import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Channel } from "wukongimjssdk";
import { ConversationWrap } from "@/pages/groupchat/ConversationWrap";

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
}

export const useGroupChatShortStore = create<GroupChatShortStore>(
  (set, get) => ({
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
    }
  })
);
