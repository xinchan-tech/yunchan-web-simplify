import { assign } from 'radash'
import type { Conversation } from 'wukongimjssdk'
import { ConversationTransform, MessageTransform, SubscriberTransform } from '../lib/transform'
import { CacheStoreName, ChatCache } from './db'

class ConversationCache extends ChatCache {
  public static CONVERSATION_STORE = CacheStoreName.CONVERSATION_STORE

  private getConversationId(conversation: Conversation) {
    return conversation.channel.channelID
  }

  async get(channelId: string) {
    const db = await this.getDb()
    const obj = await db.get(ConversationCache.CONVERSATION_STORE, channelId)

    return obj ? SubscriberTransform.toSubscriber(obj) : null
  }

  async updateOrSave(conversation: Conversation) {
    const db = await this.getDb()
    const id = this.getConversationId(conversation)
    const _conversation = await db.get(ConversationCache.CONVERSATION_STORE, id)

    const obj = {
      ...ConversationTransform.toConversationObj(conversation),
      id
    }

    if (!_conversation) {
      await db.add(ConversationCache.CONVERSATION_STORE, obj)
    } else {
      assign(_conversation, obj)
      await db.put(ConversationCache.CONVERSATION_STORE, _conversation)
    }
  }

  async updateBatch(data: Conversation[]) {
    const db = await this.getDb()
    const conversations = await db.getAll(ConversationCache.CONVERSATION_STORE)

    /**
     * 开启事务
     */
    const tx = db.transaction(ConversationCache.CONVERSATION_STORE, 'readwrite')
    const store = tx.objectStore(ConversationCache.CONVERSATION_STORE)

    await Promise.all(
      conversations.map(async c => {
        store.delete(c.channel.channelID)
      })
    )

    await Promise.all(
      data.map(async conversation => {
        const id = this.getConversationId(conversation)
        MessageTransform.addContentObj(conversation.lastMessage!)
        await store.add({ ...ConversationTransform.toConversationObj(conversation), id })
      })
    )

    await tx.done
  }

  async delete(conversation: Conversation) {
    const db = await this.getDb()
    const id = this.getConversationId(conversation)
    await db.delete(ConversationCache.CONVERSATION_STORE, id)
  }

  async getConversations() {
    const db = await this.getDb()

    return (
      (await db.getAll(ConversationCache.CONVERSATION_STORE))?.map(c => {
        return ConversationTransform.toConversationCls(c)
      }) ?? []
    )
  }
}

export const conversationCache = new ConversationCache()
