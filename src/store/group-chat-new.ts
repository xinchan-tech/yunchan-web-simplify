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

type GroupMember = {
  name: string;
  avatar: string;
};

interface GroupChatShortStore {
  groupMemberCache: Map<string, GroupMember[]>;
  setGroupMember: (groupId: string, members: GroupMember[]) => void;
  getGroupMembers: (groupId: string) => GroupMember[] | undefined
  hasGroupMembers: (groupId: string) => boolean | undefined
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
    groupMemberCache: new Map(),
    setGroupMember: (groupId: string, members: GroupMember[]) => {
      set((state) => {
        state.groupMemberCache.set(groupId, members);
        return {
          groupMemberCache: state.groupMemberCache,
        };
      });
    },
    getGroupMembers: (groupId: string) => {
        return get().groupMemberCache.get(groupId)
    },
    hasGroupMembers: (groupId: string) => {
        return get().groupMemberCache.has(groupId)
    }
  })
);
