import { MessageTransform } from '../lib/transform'
import { CacheStoreName, ChatCache } from './db'
import type { ChatChannel, ChatMessage } from '../lib/types'

class MessageCache extends ChatCache {
  public static MESSAGE_STORE = CacheStoreName.MESSAGE_STORE

  private getMessageId(message: ChatMessage) {
    return `${message.id}`
  }

  async get(messageId: string) {
    const db = await this.getDb()
    const r = await db.get(MessageCache.MESSAGE_STORE, messageId)

    if (!r) return null

    return MessageTransform.fromJson(r)
  }

  async updateOrSave(message: ChatMessage) {
    const db = await this.getDb()

    const id = this.getMessageId(message)

    const _message = await db.get(MessageCache.MESSAGE_STORE, id)

    if (!_message) {
      await db.add(MessageCache.MESSAGE_STORE, message)
    } else {
      await db.put(MessageCache.MESSAGE_STORE, Object.assign(_message, message))
    }
  }

  async updateBatch(data: ChatMessage[], channel?: ChatChannel) {
    const db = await this.getDb()

    if (channel) {
      const messages = await db.getAllKeysFromIndex(MessageCache.MESSAGE_STORE, 'channelId', channel.id)

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
        await db.add(MessageCache.MESSAGE_STORE, message)
      })
    )
  }

  async getMessages(channel?: ChatChannel) {
    const db = await this.getDb()
    if (channel) {
      return (await db.getAllFromIndex(MessageCache.MESSAGE_STORE, 'channelId', channel.id)) as ChatMessage[]
    }

    return (await db.getAll(MessageCache.MESSAGE_STORE)) as ChatMessage[]
  }
}

export const messageCache = new MessageCache()
