import { ChatRoom } from "./chat-room"
import { Sessions } from "./sessions"

const ChatPage = () => {
  return (
    <div className="w-full h-full flex">
      <div className="w-[180px] h-full border-0 border-x border-solid border-border bg-[#161616]">
        <Sessions />
      </div>
      <div className="flex-1">
        <ChatRoom />
      </div>
    </div>
  )
}

export default ChatPage