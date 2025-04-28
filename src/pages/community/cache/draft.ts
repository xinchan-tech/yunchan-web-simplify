import { useUser } from '@/store'
import { CacheStoreName, ChatCache } from './db'
import type { ChatChannel, ChatDraft } from '../lib/types'
import { assign } from 'radash'

class DraftCache extends ChatCache {
  public static STORE_NAME = CacheStoreName.DRAFT_STORE

  private getDraftKey(channel: ChatChannel) {
    const uid = useUser.getState().user!.username
    return `${channel.id}-${channel.type}-${uid}`
  }

  async get(channel: ChatChannel) {
    const db = await this.getDb()
    const obj = await db.get(DraftCache.STORE_NAME, this.getDraftKey(channel))

    return obj as Nullable<ChatDraft>
  }

  async updateOrSave(draft: ChatDraft) {
    const db = await this.getDb()
    const id = this.getDraftKey(draft.channel)
    const _draft = await db.get(DraftCache.STORE_NAME, id)

    if (!_draft) {
      await db.add(DraftCache.STORE_NAME, { ...draft, key: this.getDraftKey(draft.channel) })
    } else {
      await db.put(DraftCache.STORE_NAME, { ...assign(_draft, draft), key: this.getDraftKey(draft.channel) })
    }
  }

  async delete(channel: ChatChannel) {
    const db = await this.getDb()
    const id = this.getDraftKey(channel)
    await db.delete(DraftCache.STORE_NAME, id)
  }
}

export const draftCache = new DraftCache()