import { useModal } from "@/components"
import { ChatRoom } from "./chat-room"
import { Sessions } from "./sessions"
import { VoteDetailList } from "../components/vote-list"
import { useChatEvent } from "../lib/event"
import { useCallback, useState } from "react"

const ChatPage = () => {
  const [vote, setVote] = useState<number>()
  const voteListModal = useModal({
    title: '',
    className: 'w-fit',
    footer: null,
    content: <VoteDetailList voteId={vote!} onClose={() => voteListModal.modal.close()} />,
  })

  useChatEvent('showVote', useCallback((voteId) => {
    setVote(voteId)
    voteListModal.modal.open()
  }, [voteListModal]))

  return (
    <div className="w-full h-full flex">
      <div className="w-[240px] h-full border-0 border-x border-solid border-border bg-[#161616]">
        <Sessions />
      </div>
      <div className="flex-1">
        <ChatRoom />
      </div>
      {
        voteListModal.context
      }
    </div>
  )
}

export default ChatPage