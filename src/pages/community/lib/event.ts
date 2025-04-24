import { createEvent } from '@/utils/event'
import type { ChatChannel, ChatMessage, ChatSession, ChatSubscriber, ChatUser } from './types'
import { useMount, useUnmount } from 'ahooks'

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
}

export const chatEvent = createEvent<ChatEvent>()

export const useChatEvent = <T extends keyof ChatEvent>(event: T, cb: (value: ChatEvent[T]) => void) => {
  useMount(() => {
    chatEvent.on(event, cb)
  })

  useUnmount(() => {
    chatEvent.off(event, cb)
  })
}
