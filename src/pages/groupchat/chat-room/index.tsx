import { getChannelDetail, getChatChannels, getChatNameAndAvatar } from "@/api"
import { useChatStore } from "@/store"
import { useQuery } from "@tanstack/react-query"
import { ChannelInfo, ConnectStatus, WKSDK } from "wukongimjssdk"
import { ChatMessageList } from "./message-list"
import { JknIcon } from "@/components"
import { ChatInput } from "./components/chat-input"
import { ChannelMembers } from "./channel-members"


export const ChatRoom = () => {
  const channel = useChatStore(state => state.lastChannel)
  const state = useChatStore(s => s.state)

  const channelInfo = useQuery({
    queryKey: [getChatNameAndAvatar.cacheKey, channel?.channelID],
    queryFn: async () => {
      return WKSDK.shared().channelManager.fetchChannelInfo(channel!).then(() => WKSDK.shared().channelManager.getChannelInfo(channel!)).catch(e => console.log(e))
    },
    enabled: !!channel,
  })

  const channelDetail = useQuery({
    queryKey: [getChannelDetail.cacheKey, channel?.channelID],
    queryFn: () => getChannelDetail(channel!.channelID),
    enabled: !!channel
  })

  return (
    <div className="w-full h-full overflow-hidden">
      <div className="chat-room-title h-10">
        <div className="group-chat-header justify-between flex h-10">
          <div className="leading-10 border h-full bg-[#141414] border-b-primary w-full text-sm px-4">
            {channelInfo.data?.title}
          </div>
        </div>
      </div>
      <div className="chat-room-main h-[calc(100%-40px)] bg-[#0a0a0a] flex w-full overflow-hidden">
        <div className="chat-room-content h-full flex-1">
          <div className="chat-room-message h-[calc(100%-180px)] overflow-hidden border-b-primary">
            <ChatMessageList />
          </div>
          <ChatInput />
        </div>
        <div className="chat-room-right w-[188px] border-l-primary">
          <div className="chat-room-notice p-2 box-border h-[164px] border-b-primary flex flex-col">
            <div className="chat-room-notice-title text-sm py-1">公告</div>
            <div className="chat-room-notice-content text-xs text-tertiary leading-5">
              {channelDetail.data?.notice}
            </div>
          </div>
          <div className="chat-room-users">
            <ChannelMembers owner={channelDetail.data?.owner ?? ''} />
          </div>
        </div>
      </div>
      <style jsx>
        {
          `
          .chat-room-notice-content  {
            overflow: hidden;
            text-overflow: ellipsis;
            display: -webkit-box;
            -webkit-line-clamp: 6;
            -webkit-box-orient: vertical;
          }
          `
        }
      </style>
    </div>
  )
}