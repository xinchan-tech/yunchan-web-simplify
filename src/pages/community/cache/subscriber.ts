import { openDB } from 'idb'
import { assign } from 'radash'
import type { Subscriber } from 'wukongimjssdk'
import { SubscriberTransform } from '../lib/transform'
import { CacheStoreName, ChatCache } from './db'

class SubscriberCache extends ChatCache {
  public static SUBSCRIBER_STORE = CacheStoreName.SUBSCRIBER_STORE

  private getSubscriberId(subscriber: Subscriber) {
    return `${subscriber.uid}-${subscriber.channel.channelID}`
  }

  async get(channelId: string, uid: string) {
    const db = await this.getDb()
    const obj = await db.get(SubscriberCache.SUBSCRIBER_STORE, `${uid}-${channelId}`)
    if (!obj) {
      return null
    }

    obj.channel = {
      channelID: obj.channelId,
      channelType: obj.channelType
    }

    return obj ? SubscriberTransform.toSubscriber(obj) : null
  }

  async updateOrSave(subscriber: Subscriber) {
    const db = await this.getDb()
    const id = this.getSubscriberId(subscriber)
    const _subscriber = await db.get(SubscriberCache.SUBSCRIBER_STORE, id)

    const obj = {
      ...SubscriberTransform.toSubscriberObj(subscriber),
      id
    }

    if (!_subscriber) {
      await db.add(SubscriberCache.SUBSCRIBER_STORE, obj)
    } else {
      assign(_subscriber, obj)
      await db.put(SubscriberCache.SUBSCRIBER_STORE, _subscriber)
    }
  }

  async updateByChannel(channelId: string, data: Subscriber[]) {
    const db = await this.getDb()
    const subscribers = await this.getSubscribesByChannel(channelId)

    /**
     * 开启事务
     */
    const tx = db.transaction(SubscriberCache.SUBSCRIBER_STORE, 'readwrite')
    const store = tx.objectStore(SubscriberCache.SUBSCRIBER_STORE)

    await Promise.all(
      subscribers.map(async subscriber => {
        store.delete(this.getSubscriberId(subscriber))
      })
    )

    await Promise.all(
      data.map(async subscriber => {
        const id = this.getSubscriberId(subscriber)
        await store.add({ ...SubscriberTransform.toSubscriberObj(subscriber), id })
      })
    )

    await tx.done
  }

  async delete(subscriber: Subscriber) {
    const db = await this.getDb()
    const id = this.getSubscriberId(subscriber)
    await db.delete(SubscriberCache.SUBSCRIBER_STORE, id)
  }

  async getSubscribesByChannel(channelId: string) {
    const db = await this.getDb()

    return (
      (await db.getAllFromIndex(SubscriberCache.SUBSCRIBER_STORE, 'channelId', channelId))?.map(sub => {
        sub.channel = {
          channelID: sub.channelId,
          channelType: sub.channelType
        }

        return SubscriberTransform.toSubscriber(sub)
      }) ?? []
    )
  }
}

export const subscriberCache = new SubscriberCache()
