import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Channel } from "wukongimjssdk";

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
  scrollDom: HTMLElement | null;
  setScrollDom: (dom: HTMLElement) => void;
}

export const useGroupChatShortStore = create<GroupChatShortStore>(
  (set, get) => ({
    scrollDom: null,
    setScrollDom: (dom: HTMLElement) =>
      set({
        scrollDom: dom,
      }),
  })
);
