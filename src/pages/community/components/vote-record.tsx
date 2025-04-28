import { useUser } from "@/store"
import { chatEvent } from "../lib/event"
import type { ChatVoteMessage } from "../lib/types"
import { useChatStore } from "../lib/store"
import type { PropsWithChildren } from "react"
import { JknModal } from "@/components"
import { VoteForm } from "./vote-form"

interface VoteRecordProps {
  message: ChatVoteMessage
}

export const VoteRecord = ({ message }: VoteRecordProps) => {
  const uid = useUser(s => s.user?.username)
  return (
    <div className="flex items-center justify-center">
      {message.senderName ?? ''}发起了投票：
      <span className="text-[#FFC440] cursor-pointer" onClick={() => chatEvent.emit('showVote', message.voteId)} onKeyDown={() => { }}>{message.content}</span>
      {
        uid === message.senderId ? (
          <>
            &nbsp;
            <span className="text-primary cursor-pointer">
              <VoteEdit id={message.voteId}>
                <span>
                  编辑
                </span>
              </VoteEdit>
            </span>
          </>
        ) : null
      }
    </div>
  )
}

const VoteEdit = ({ children, id }: PropsWithChildren<{ id: number }>) => {
  const channel = useChatStore(s => s.channel)
  if (!channel) return children
  return (
    <JknModal lazy trigger={children} title="编辑投票"
      footer={null}
    >
      {
        ({ close }) => <VoteForm
          id={id}
          channel={channel}
          onClose={close}
          onSubmit={close}
        />
      }
    </JknModal>
  )
}