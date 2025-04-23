import { assign } from 'radash'
import { CacheStoreName, ChatCache } from './db'
import type { ChatChannel } from "../lib/types"

class ChannelCache extends ChatCache {
  public static STORE_NAME = CacheStoreName.CHANNEL_STORE

  private getChannelId(channel: ChatChannel) {
    return channel.id
  }

  async get(uid: string) {
    const db = await this.getDb()
    const obj = await db.get(ChannelCache.STORE_NAME, uid)

    return obj as Nullable<ChatChannel>
  }

  async updateOrSave(channel: ChatChannel) {
    const db = await this.getDb()
    const id = this.getChannelId(channel)
    const _channel = await db.get(ChannelCache.STORE_NAME, id)

    if (!_channel) {
      await db.add(ChannelCache.STORE_NAME, channel)
    } else {
      assign(_channel, channel)
      await db.put(ChannelCache.STORE_NAME, _channel)
    }
  }

  async updateBatch(data: ChatChannel[]) {
    const db = await this.getDb()

    /**
     * 开启事务
     */
    const tx = db.transaction(ChannelCache.STORE_NAME, 'readwrite')
    const store = tx.objectStore(ChannelCache.STORE_NAME)

    await Promise.all(data.map(item => store.delete(this.getChannelId(item))))

    await Promise.all(
      data.map(async user => {
        await store.add(user)
      })
    )
  }
}

export const channelCache = new ChannelCache()
