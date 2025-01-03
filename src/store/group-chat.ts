import { create } from 'zustand';

type ChatMsgType = 'live' | 'owner' | 'stock' | 'mention'

type GroupChatType = {
    fullScreen: boolean
    messageType: ChatMsgType,
    setFullScreen: (fullScreen: boolean) => void,
    setMessageType: (messageType: ChatMsgType) => void,
    bottomHeight: number,
    setBottomHeight: (bottomHeight: number) => void,

}

const useGroupChatStore = create<GroupChatType>((set) => ({
    fullScreen: false,
    setFullScreen: (fullScreen: boolean) => set({ fullScreen }),
    messageType: 'live',
    setMessageType: (messageType:ChatMsgType ) => set({ messageType }),
    bottomHeight: 300,
    setBottomHeight: (bottomHeight: number) => set({ bottomHeight }),
}))

export default useGroupChatStore;