import { createEvent } from '@/utils/event'
import type { ChatSession } from './types'
import { useMount, useUnmount } from 'ahooks'

export type ChatEvent = {
  syncSession: ChatSession[]
  updateSession: ChatSession
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
