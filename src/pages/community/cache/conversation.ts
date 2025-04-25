import { assign } from 'radash'
import { SubscriberTransform } from '../lib/transform'
import { CacheStoreName, ChatCache } from './db'
import type { ChatSession } from '../lib/types'
import { useUser } from '@/store'

class SessionCache extends ChatCache {
  public static CONVERSATION_STORE = CacheStoreName.SESSION_STORE

  private getSessionId(session: ChatSession) {
    const uid = useUser.getState().user!.username
    return `${session.channel.id}-${session.channel.type}-${uid}`
  }

  async get(channelId: string) {
    const db = await this.getDb()
    const obj = await db.get(SessionCache.CONVERSATION_STORE, channelId)

    return obj ? SubscriberTransform.toSubscriber(obj) : null
  }

  async updateOrSave(session: ChatSession) {
    const db = await this.getDb()
    const id = this.getSessionId(session)
    const _session = await db.get(SessionCache.CONVERSATION_STORE, id)

    if (!_session) {
      await db.add(SessionCache.CONVERSATION_STORE, { ...session, id: this.getSessionId(session) })
    } else {
      await db.put(SessionCache.CONVERSATION_STORE, { ...session, id: this.getSessionId(session) })
    }
  }

  async updateBatch(data: ChatSession[]) {
    const db = await this.getDb()

    /**
     * 开启事务
     */
    const tx = db.transaction(SessionCache.CONVERSATION_STORE, 'readwrite')
    const store = tx.objectStore(SessionCache.CONVERSATION_STORE)

    await Promise.all(
      data.map(async c => {
        store.delete(this.getSessionId(c))
      })
    )

    await Promise.all(
      data.map(async conversation => {
        const id = this.getSessionId(conversation)
        await store.add({ ...conversation, id })
      })
    )

    await tx.done
  }

  async delete(data: ChatSession) {
    const db = await this.getDb()
    const id = this.getSessionId(data)
    await db.delete(SessionCache.CONVERSATION_STORE, id)
  }

  async getSessions() {
    const db = await this.getDb()
    const uid = useUser.getState().user!.username
    return (await db.getAllFromIndex(SessionCache.CONVERSATION_STORE, 'uid', uid)) ?? []
  }
}

export const sessionCache = new SessionCache()
