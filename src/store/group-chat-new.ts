import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Channel, Message, Subscriber } from "wukongimjssdk";
import { ConversationWrap } from "@/pages/groupchat/ConversationWrap";
import { GroupData } from "@/pages/groupchat/group-channel";
import { getGroupDetailService } from "@/api";

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

export interface Product {
  product_sn: string;
  price: string;
  unit: string;
}

export interface GroupDetailData {
  id: string;
  account: string;
  name: string;
  avatar: string;
  notice: string;
  max_num: string;
  brief: string;
  chat_type: string;
  tags: string;
  owner: string;
  total_user: string;
  products: Product[];
  editable: boolean;
  blacklist: any[];
  in_channel: number;
}

interface GroupChatShortStore {
  avatarColorMap: Map<string, string>;
  setAvatarColorMap: (map: Map<string, string>) => void;
  conversationWraps: ConversationWrap[];
  setConversationWraps: (data: ConversationWrap[]) => void;
  replyMessage: Message | null; // 回复的消息
  inputValue: string; // 输入框消息
  setInputValue: (s: string) => void;
  subscribers: Subscriber[]; // 当前群的群成员
  setSubscribers: (payload: Subscriber[]) => void;
  setReplyMessage: (message: Message | null) => void;
  messages: Message[];
  setMessages: (data: Message[]) => void;
  locatedMessageId: string; // 点击引用信息要跳转的位置
  setLocatedMessageId: (locatedMessageId: string) => void;
  readyToJoinGroup: GroupData | null;
  setReadyToJoinGroup: (data: GroupData | null) => void;
  groupDetailData: GroupDetailData | null;
  getGroupDetailData: (id: string) => Promise<void>;
}

export const useGroupChatShortStore = create<GroupChatShortStore>(
  (set, get) => ({
    setReplyMessage: (msg: Message | null) => {
      set({ replyMessage: msg });
    },
    replyMessage: null,
    inputValue: "",
    setInputValue: (str: string) => {
      set({ inputValue: str });
    },
    conversationWraps: [],
    setConversationWraps: (data: ConversationWrap[]) => {
      set({
        conversationWraps: data,
      });
    },
    avatarColorMap: new Map(),
    setAvatarColorMap: (map: Map<string, string>) => {
      set({
        avatarColorMap: map,
      });
    },
    subscribers: [],
    setSubscribers: (payload: Subscriber[]) => {
      set({
        subscribers: payload,
      });
    },
    messages: [],
    setMessages: (data: Message[]) => {
      set({ messages: data });
    },
    locatedMessageId: "",
    setLocatedMessageId(locatedMessageId) {
      set({
        locatedMessageId,
      });
    },
    readyToJoinGroup: null,
    setReadyToJoinGroup: (data: GroupData | null) => {
      set({
        readyToJoinGroup: data,
      });
    },
    groupDetailData: null,
    getGroupDetailData: async (id: string) => {
      const resp = await getGroupDetailService(id);
      set({
        groupDetailData: resp,
      });
    },
  })
);
