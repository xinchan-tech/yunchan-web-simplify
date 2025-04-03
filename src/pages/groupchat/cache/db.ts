import type { IDBPDatabase } from 'idb'
import { openDB } from 'idb'
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
export const CacheStoreName = {
  CONVERSATION_STORE: 'chat-conversation',
  SUBSCRIBER_STORE: 'chat-subscriber',
  MESSAGE_STORE: 'chat-message',
  USER_STORE: 'chat-user'
}

export class ChatCache {
  public db: Nullable<IDBPDatabase> = null
  public static DB_NAME = 'chat-store'
  public static DB_VERSION = 3

  constructor() {
    openDB(ChatCache.DB_NAME, ChatCache.DB_VERSION, {
      upgrade(db) {
        for (const s of db.objectStoreNames) {
          db.deleteObjectStore(s)
        }
        const store = db.createObjectStore(CacheStoreName.SUBSCRIBER_STORE, { keyPath: 'id', autoIncrement: true })
        store.createIndex('channelId', 'channelId')

        db.createObjectStore(CacheStoreName.CONVERSATION_STORE, { keyPath: 'id', autoIncrement: true })

        const messageStore = db.createObjectStore(CacheStoreName.MESSAGE_STORE, { keyPath: 'messageID', autoIncrement: true })
        messageStore.createIndex('channelId', 'channel.channelID')

        db.createObjectStore(CacheStoreName.USER_STORE, { keyPath: 'uid', autoIncrement: true })
      },
      blocked() {
        console.warn(`conversation db blocked: ${ChatCache.DB_NAME}`)
      },
      blocking() {
        console.warn(`conversation db blocking: ${ChatCache.DB_NAME}`)
      },
      terminated() {
        console.warn(`conversation db terminated: ${ChatCache.DB_NAME}`)
      }
    }).then(db => {
      this.db = db
    })
  }

  async getDb(): Promise<IDBPDatabase> {
    while (!this.db) {
      await sleep(100)
    }

    return this.db
  }
}
