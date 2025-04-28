import { createEvent } from '@/utils/event'
import type { ChatChannel, ChatMessage, ChatSession, ChatSubscriber, ChatUser } from './types'
import { useEffect } from "react"

export type ChatEvent = {
  syncSession: ChatSession[]
  updateSession: ChatSession
  syncMessage: ChatMessage[]
  updateMessage: ChatMessage
  updateChannel: ChatChannel
  syncSubscriber: ChatSubscriber
  updateSubscriber: ChatSubscriber
  imageUploadSuccess: {
    clientSeq: number
    url: string
  }
  reply: ChatMessage
  mention: ChatUser
  revoke: ChatMessage
  copy: ChatMessage
  showVote: number
}

export const chatEvent = createEvent<ChatEvent>()

export const useChatEvent = <T extends keyof ChatEvent>(event: T, cb: (value: ChatEvent[T]) => void) => {
  useEffect(() => {
    const cancel = chatEvent.on(event, cb)
    return () => cancel()
  })
}
