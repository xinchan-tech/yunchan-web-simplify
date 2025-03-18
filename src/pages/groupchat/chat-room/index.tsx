import { getChannelDetail, getChatChannels, getChatNameAndAvatar } from "@/api"
import { JknIcon } from "@/components"
import { useChatStore } from "@/store"
import { useQuery } from "@tanstack/react-query"
import type { JSONContent } from "@tiptap/react"
import { ChannelInfo, ConnectStatus, Mention, MessageImage, MessageText, WKSDK } from "wukongimjssdk"
import { ChannelMembers } from "./channel-members"
import { ChatInput } from "./components/chat-input"
import { ChatMessageList } from "./message-list"


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

  const onSubmit = (content?: JSONContent, mentions?: string[]) => {
    if(!content?.content?.length) return
    let _mentions = mentions
    content.content.forEach(item => {
      if(item.type === 'paragraph'){
        const message = new MessageText(item.content?.map(i => i.type === 'hardBreak' ? '\n': i.text).join(''))
        console.log(message)
        if(_mentions?.length){
          message.mention = new Mention()
          message.mention.uids = _mentions

          _mentions = []
        }

        WKSDK.shared().chatManager.send(message, channel!)
      }else if(item.type === 'image'){
        const message = new MessageImage() 
        fetch(item.attrs!.src).then(res => res.blob()).then(blob => {
          const type = blob.type
          const name = `image.${type.split('/')[1]}`
          const file = new File([blob], name, { type })
          message.file = file
          const image = new window.Image()
          image.src = item.attrs!.src
          image.onload = () => {
            message.width = image.width
            message.height = image.height
            WKSDK.shared().chatManager.send(message, channel!)
          }
        })
     
      }
    })
  }

  return (
    <div className="flex-1 h-full overflow-hidden">
      <div className="chat-room-title h-10">
        <div className="group-chat-header justify-between flex h-10">
          <div className="leading-10 border h-full bg-[#141414] border-b-primary w-full text-sm px-4">
            {channelInfo.data?.title}
          </div>
        </div>
      </div>
      <div className="chat-room-main h-[calc(100%-40px)] bg-[#0a0a0a] flex overflow-hidden flex-1">
        <div className="chat-room-content h-full w-full overflow-hidden">
          <div className="chat-room-message h-[calc(100%-180px)] overflow-hidden border-b-primary">
            <ChatMessageList />
          </div>
          <ChatInput onSubmit={onSubmit} channelId={channel?.channelID} />
        </div>
        <div className="chat-room-right w-[188px] border-l-primary flex flex-col">
          <div className="chat-room-notice p-2 box-border h-[164px] flex-shrink-0 border-b-primary flex flex-col">
            <div className="chat-room-notice-title text-sm py-1">公告</div>
            <div className="chat-room-notice-content text-xs text-tertiary leading-5">
              {channelDetail.data?.notice}
            </div>
          </div>
          <div className="chat-room-users flex-1 overflow-hidden">
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