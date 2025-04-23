import { assign } from 'radash'
import { CacheStoreName, ChatCache } from './db'
import type { ChatSubscriber } from "../lib/types"

class SubscriberCache extends ChatCache {
  public static STORE_NAME = CacheStoreName.SUBSCRIBER_STORE

  private getSubscriberId(subscriber: ChatSubscriber) {
    return subscriber.uid
  }

  async get(channelId: string, uid: string) {
    const db = await this.getDb()
    const obj = await db.get(SubscriberCache.STORE_NAME, `${uid}-${channelId}`)

    return obj as Nullable<ChatSubscriber>
  }

  async updateOrSave(subscriber: ChatSubscriber) {
    const db = await this.getDb()
    const id = this.getSubscriberId(subscriber)
    const _subscriber = await db.get(SubscriberCache.STORE_NAME, id)

    if (!_subscriber) {
      await db.add(SubscriberCache.STORE_NAME, subscriber)
    } else {
      assign(_subscriber, subscriber)
      await db.put(SubscriberCache.STORE_NAME, _subscriber)
    }
  }

  async updateByChannel(channelId: string, data: ChatSubscriber[]) {
    const db = await this.getDb()

    /**
     * 开启事务
     */
    const tx = db.transaction(SubscriberCache.STORE_NAME, 'readwrite')
    const store = tx.objectStore(SubscriberCache.STORE_NAME)

    await Promise.all(
      data.map(async subscriber => {
        store.delete(this.getSubscriberId(subscriber))
      })
    )

    await Promise.all(
      data.map(async subscriber => {
        await store.add({ ...subscriber })
      })
    )

    await tx.done
  }

  async delete(subscriber: ChatSubscriber) {
    const db = await this.getDb()
    const id = this.getSubscriberId(subscriber)
    await db.delete(SubscriberCache.STORE_NAME, id)
  }

  async getSubscribesByChannel(channelId: string) {
    const db = await this.getDb()

    return (
      (await db.getAllFromIndex(SubscriberCache.STORE_NAME, 'channelId', channelId))?.map(sub => {
        return sub as ChatSubscriber
      }) ?? []
    )
  }
}

export const subscriberCache = new SubscriberCache()
