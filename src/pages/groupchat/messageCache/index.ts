export type qeuryFromDBParam = {
  mode: 0 | 1;
  limit: number;
  start: number;
  end: number;
};

class LocalCacheManager {
  static page: number;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = "ChatDB";
  private readonly DB_VERSION = 2;
  private readonly STORE_MESSAGES = "messages";
  private readonly STORE_GROUPS = "groups";
  private liveMessagesCache = new Map<string, any[]>();

  constructor() {
    this.initDB().catch(console.error);
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.STORE_MESSAGES)) {
          const store = db.createObjectStore(this.STORE_MESSAGES, {
            keyPath: "message_idstr",
          });
          store.createIndex("channel_seq", ["channel_id", "message_seq"]);
          // store.createIndex("message_seq", "message_seq");
        }
        if (!db.objectStoreNames.contains(this.STORE_GROUPS)) {
          db.createObjectStore(this.STORE_GROUPS, { keyPath: "channelID" });
        }
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  public async cacheMessage(message: any): Promise<void> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([this.STORE_MESSAGES], "readwrite");
      const store = tx.objectStore(this.STORE_MESSAGES);
      message.channel_seq = `${message.channel_id}_${message.message_seq}`;
      store.put(message);

      tx.oncomplete = () => {
        this.updateLiveCache(message.channel_id, message);
        resolve();
      };

      tx.onerror = () => reject(tx.error);
    });
  }
  private updateLiveCache(groupId: string, message: any): void {
    const messages = this.liveMessagesCache.get(groupId) || [];
    messages.push(message);
    this.liveMessagesCache.set(groupId, messages);
    this.maintainMemoryCache(groupId);
  }

  private maintainMemoryCache(groupId: string): void {
    const cutoff = Date.now() - 7200_000;
    const filtered =
      this.liveMessagesCache
        .get(groupId)
        ?.filter((m) => m.timestamp > cutoff) || [];
    this.liveMessagesCache.set(groupId, filtered);
  }

  public async getMessages(
    groupId: string,

    options: qeuryFromDBParam
  ): Promise<any[]> {
    // if (page === 1 && this.liveMessagesCache.has(groupId)) {
    //   let count = options.limit;
    //   count = -count;
    //   return this.liveMessagesCache.get(groupId)!.slice(count);
    // }
    return this.queryFromDB(groupId, options);
  }

  private async queryFromDB(
    groupId: string,

    options: qeuryFromDBParam
  ): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([this.STORE_MESSAGES], "readonly");
      const store = tx.objectStore(this.STORE_MESSAGES);
      const index = store.index("channel_seq");
      const end = options.end || options.start - options.limit + 1;
      const right = Math.max(end, options.start);
      const left = Math.min(end, options.start);
      // 暂时只有往前面查
      let count = 0;
      let range = IDBKeyRange.bound([groupId, left], [groupId, right]);
      const isExpire = options.start === -1 && options.end === -1;

      const results: any[] = [];

      let request = index.openCursor(range);
      if (isExpire === true) {
        const newRange = IDBKeyRange.bound([groupId, 0], [groupId, Infinity]);
        request = index.openCursor(newRange, "prev");
      }
      request.onsuccess = () => {
        const cursor = request.result;
        if (cursor) {
          if (isExpire && count < options.limit) {
            results.push(cursor.value);
            count++;
            cursor.continue();
          } else {
            results.push(cursor.value);
            cursor.continue();
          }
        } else {
          resolve(results);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }
}

class SyncManager {
  private syncStates = new Map<string, { lastSynced: number }>();

  constructor(private cacheManager: LocalCacheManager) {}

  public async syncMessages(groupId: string, messages: any[]): Promise<void> {
    const state = this.syncStates.get(groupId) || { lastSynced: 0 };
    // 模拟API调用

    await Promise.all(
      messages.map((msg) => this.cacheManager.cacheMessage(msg))
    );

    if (messages.length > 0) {
      this.syncStates.set(groupId, {
        lastSynced: messages[0].timestamp,
      });
    }
  }
}

const cacheManager = new LocalCacheManager();
const syncManager = new SyncManager(cacheManager);
export { LocalCacheManager, syncManager };
export default cacheManager;
