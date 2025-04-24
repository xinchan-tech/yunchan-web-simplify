import { createEvent } from '@/utils/event'
import type { ChatMessage, ChatSession, ChatSubscriber, ChatUser } from './types'
import { useMount, useUnmount } from 'ahooks'

export type ChatEvent = {
  syncSession: ChatSession[]
  updateSession: ChatSession
  syncMessage: ChatMessage[]
  updateMessage: ChatMessage
  syncSubscriber: ChatSubscriber
  updateSubscriber: ChatSubscriber
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
