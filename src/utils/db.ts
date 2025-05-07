import { type IDBPDatabase, openDB } from "idb"

const SysConfigDbVersion = 1

let db: Nullable<IDBPDatabase> = null

export const sysConfigStoreSheet = {
  /**
   * 用户个股配置
   */
  KChart: 'k-chart'
}


const awaitedOpenDb = (async () => {
  db = await openDB('yc-store', SysConfigDbVersion, {
    upgrade(db) {
      db.createObjectStore(sysConfigStoreSheet.KChart, { keyPath: 'userId', autoIncrement: true })
    }
  })
  return db
})()


export const getSysConfigDb = async () => {
  if (!db) {
    db = await awaitedOpenDb
  }
  return db
}
