import { openDB } from 'idb'

export const STORE_INDEX_STORAGE = 'store-index'

export const createStoreIndexStorage = () => {
  const asyncDb = openDB('STORE_INDEX_STORAGE', 1, {
    upgrade(db) {
      db.createObjectStore('STORE_INDEX_STORAGE')
    }
  })

  return {
    getItem: async (key: string) => {
      const db = await asyncDb
      return await db.get('STORE_INDEX_STORAGE', key)
    },
    setItem: async (key: string, value: string) => {
      const db = await asyncDb
      return db.put('STORE_INDEX_STORAGE', value, key)
    },
    removeItem: async (key: string) => {
      const db = await asyncDb
      return db.delete('STORE_INDEX_STORAGE', key)
    }
  }
}
