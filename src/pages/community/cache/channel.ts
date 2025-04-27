import { assign } from 'radash'
import { CacheStoreName, ChatCache } from './db'
import type { ChatChannel } from "../lib/types"
import { useUser } from "@/store"

class ChannelCache extends ChatCache {
  public static STORE_NAME = CacheStoreName.CHANNEL_STORE

  private getChannelKey(channel: ChatChannel) {
    const userId = useUser.getState().user?.username
    return `${channel.id}-${userId}`
  }

  async get(uid: string) {
    const db = await this.getDb()
    const obj = await db.get(ChannelCache.STORE_NAME, this.getChannelKey({ id: uid } as ChatChannel))

    return obj as Nullable<ChatChannel>
  }

  async updateOrSave(channel: ChatChannel) {
    const db = await this.getDb()
    const key = this.getChannelKey(channel)
    const _channel = await db.get(ChannelCache.STORE_NAME, key)

    if (!_channel) {
      await db.add(ChannelCache.STORE_NAME, {
        ...channel,
        key
      })
    } else {
      assign(_channel, channel)
      await db.put(ChannelCache.STORE_NAME, {
        ..._channel,
        key
      })
    }
  }

  async updateBatch(data: ChatChannel[]) {
    const db = await this.getDb()

    /**
     * 开启事务
     */
    const tx = db.transaction(ChannelCache.STORE_NAME, 'readwrite')
    const store = tx.objectStore(ChannelCache.STORE_NAME)

    await Promise.all(data.map(item => store.delete(this.getChannelKey(item))))

    await Promise.all(
      data.map(c => {
        const k = this.getChannelKey(c)
        return store.add({
          ...c,
          key: k
        })
      })
    )
  }
}

export const channelCache = new ChannelCache()
