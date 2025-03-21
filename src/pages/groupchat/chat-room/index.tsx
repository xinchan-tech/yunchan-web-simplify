import { getChannelDetail, getChatNameAndAvatar, readChannelNotice } from "@/api"
import { useModal } from "@/components"
import { chatManager, useChatStore } from "@/store"
import { useQuery } from "@tanstack/react-query"
import type { JSONContent } from "@tiptap/react"
import { ConnectStatus, Mention, MessageImage, MessageText, WKSDK } from "wukongimjssdk"
import { ChannelMembers } from "./channel-members"
import { ChatInput } from "./components/chat-input"
import { ChatMessageList } from "./message-list"
import { useCountDown } from "ahooks"
import { useEffect } from "react"


export const ChatRoom = () => {
  const channel = useChatStore(state => state.lastChannel)
  const state = useChatStore(s => s.state)

  const channelQuery = useQuery({
    queryKey: [getChatNameAndAvatar.cacheKey, channel?.channelID],
    queryFn: async () => {
      const [channelInfo, channelDetail] = await Promise.all(
        [
          WKSDK.shared().channelManager.fetchChannelInfo(channel!).then(() => WKSDK.shared().channelManager.getChannelInfo(channel!)),
          getChannelDetail(channel!.channelID)
        ]
      )

      return {
        channelInfo,
        channelDetail
      }
    },
    enabled: !!channel && state === ConnectStatus.Connected,
  })

  const { channelInfo, channelDetail } = channelQuery.data ?? {}

  useEffect(() => {
    chatManager.setLastChannelReady(!channelQuery.isLoading && state === ConnectStatus.Connected)
  }, [channelQuery.isLoading, state])

  const noticeModal = useModal({
    content: <ChatRoomNotice notice={channelDetail?.notice ?? ''} onConfirm={() => {
      readChannelNotice(channel!.channelID)
      channelQuery.refetch()
      noticeModal.modal.close()
    }} />,
    className: 'w-[476px]',
    footer: null,
    closeOnMaskClick: false
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (channelDetail) {
      if (channelDetail.is_notice_read !== 1) {
        noticeModal.modal.open()
      }
    }
  }, [channelDetail])

  const onSubmit = (content?: JSONContent, mentions?: string[]) => {
    if (!content?.content?.length) return
    let _mentions = mentions
    content.content.forEach(item => {
      if (item.type === 'paragraph') {
        if (!item.content?.length) return
        const message = new MessageText(item.content?.map(i => i.type === 'hardBreak' ? '\n' : i.text).join(''))
        if (_mentions?.length) {
          28
          message.mention = new Mention()
          message.mention.uids = _mentions

          _mentions = []
        }

        WKSDK.shared().chatManager.send(message, channel!)
      } else if (item.type === 'image') {
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
            {channelInfo?.title}
          </div>
        </div>
      </div>
      <div className="chat-room-main h-[calc(100%-40px)] bg-[#0a0a0a] flex overflow-hidden flex-1">
        <div className="chat-room-content h-full w-full overflow-hidden">
          <div className="chat-room-message h-[calc(100%-180px)] overflow-hidden border-b-primary">
            <ChatMessageList />
          </div>
          <ChatInput onSubmit={onSubmit} channel={channel} />
        </div>
        <div className="chat-room-right w-[188px] border-l-primary flex flex-col">
          <div className="chat-room-notice p-2 box-border h-[164px] flex-shrink-0 border-b-primary flex flex-col">
            <div className="chat-room-notice-title text-sm py-1">公告</div>
            <div className="chat-room-notice-content text-xs text-tertiary leading-5">
              {channelDetail?.notice}
            </div>
          </div>
          <div className="chat-room-users flex-1 overflow-hidden">
            <ChannelMembers owner={channelDetail?.owner ?? ''} />
          </div>
        </div>
      </div>
      {
        noticeModal.context
      }
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

const ChatRoomNotice = ({ notice, onConfirm }: { notice: string, onConfirm: () => void }) => {
  const [countDown] = useCountDown({
    leftTime: 1000 * 10
  })
  return (
    <div className="chat-room-notice py-6 px-5">
      <div className="chat-room-notice-title text-xl mb-6">
        尊敬的各位群友
      </div>
      <div className="mb-4">
        👉入群请自觉遵守群规:
      </div>
      <div className="chat-room-notice-content text-xs text-tertiary leading-5 h-[90px] overflow-y-auto">
        {notice}
      </div>
      <div className="text-center">
        <div className="text-base inline-block w-[120px] h-[38px] leading-[38px] mt-4 rounded-[300px] bg-[#575757]" onClick={() => countDown <= 0 && onConfirm()} onKeyDown={() => { }}>
          <span>确定</span>
          {
            countDown >= 1 ? (
              <span>({Math.floor(countDown / 1000)}s)</span>
            ) : null
          }
        </div>
      </div>
    </div>
  )
}