import { chatEvent } from "../lib/event"
import type { ChatVoteMessage } from "../lib/types"

interface VoteRecordProps {
  message: ChatVoteMessage
}

export const VoteRecord = ({ message }: VoteRecordProps) => {
  return (
    <span className="">
      {message.senderName ?? ''}发起了投票：<span className="text-[#FFC440] cursor-pointer" onClick={() => chatEvent.emit('showVote', message.voteId)} onKeyDown={() => { }}>{message.content}</span>
    </span>
  )
}