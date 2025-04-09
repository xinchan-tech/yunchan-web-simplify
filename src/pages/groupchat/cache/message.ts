import type { Channel, Message } from 'wukongimjssdk'
import { CacheStoreName, ChatCache } from './db'
import { MessageTransform } from '../lib/transform'

class MessageCache extends ChatCache {
  public static MESSAGE_STORE = CacheStoreName.MESSAGE_STORE

  private getMessageId(message: Message) {
    return `${message.messageID}`
  }

  async get(messageId: string) {
    const db = await this.getDb()
    const r = await db.get(MessageCache.MESSAGE_STORE, messageId)

    if (!r) return null

    return MessageTransform.fromJson(r)
  }

  async updateOrSave(message: Message) {
    const db = await this.getDb()

    const id = this.getMessageId(message)

    const _message = await db.get(MessageCache.MESSAGE_STORE, id)

    if (!_message) {
      await db.add(MessageCache.MESSAGE_STORE, MessageTransform.addContentObj(message))
    } else {
      await db.put(MessageCache.MESSAGE_STORE, id, MessageTransform.addContentObj(message) as any)
    }
  }

  async updateBatch(data: Message[], channel?: Channel) {
    const db = await this.getDb()

    if (channel) {
      const messages = await db.getAllKeysFromIndex(MessageCache.MESSAGE_STORE, 'channelId', channel.channelID)

      const tx = db.transaction(MessageCache.MESSAGE_STORE, 'readwrite')
      const store = tx.objectStore(MessageCache.MESSAGE_STORE)

      await Promise.all(
        messages.map(async m => {
          store.delete(m)
        })
      )
    } else {
      const messages = await db.getAllKeys(MessageCache.MESSAGE_STORE)

      const tx = db.transaction(MessageCache.MESSAGE_STORE, 'readwrite')
      const store = tx.objectStore(MessageCache.MESSAGE_STORE)

      await Promise.all(
        messages.map(async m => {
          store.delete(m)
        })
      )
    }

    await Promise.all(
      data.map(async message => {
        await db.add(MessageCache.MESSAGE_STORE, MessageTransform.addContentObj(message) as any)
      })
    )
  }

  async getMessages(channel?: Channel) {
    const db = await this.getDb()
    if (channel) {
      return (await db.getAllFromIndex(MessageCache.MESSAGE_STORE, 'channelId', channel.channelID)).map(
        MessageTransform.fromJson
      )
    }

    return (await db.getAll(MessageCache.MESSAGE_STORE)).map(MessageTransform.fromJson)
  }
}

export const messageCache = new MessageCache()
