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
          store.createIndex("channel_id", "channel_id");
          store.createIndex("message_seq", "message_seq");
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
    page: number,
    options: qeuryFromDBParam
  ): Promise<any[]> {
    // if (page === 1 && this.liveMessagesCache.has(groupId)) {
    //   let count = options.limit;
    //   count = -count;
    //   return this.liveMessagesCache.get(groupId)!.slice(count);
    // }
    return this.queryFromDB(groupId, page, options);
  }

  private async queryFromDB(
    groupId: string,
    page: number,
    options: qeuryFromDBParam
  ): Promise<any[]> {
    if (!this.db) throw new Error("Database not initialized");

    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([this.STORE_MESSAGES], "readonly");
      const store = tx.objectStore(this.STORE_MESSAGES);
      const groupIndex = store.index("channel_id");
      const seqIndex = store.index("message_seq");
      // 暂时只有往前面查
      let count = 0;
      const groupRange = IDBKeyRange.only(groupId);

      const seqResults: any[] = [];
      const groupResults: any[] = [];
      const isExpire = options.start === -1 && options.end === -1;
      const groupRequest = groupIndex.openCursor(groupRange);
      groupRequest.onsuccess = () => {
        const cursor = groupRequest.result;
        if (cursor) {
          groupResults.push(cursor.value);
          cursor.continue();
        } else {
          let seqRequest;

          console.log("groupResults:", groupResults);
          if (isExpire) {
            seqRequest = seqIndex.openCursor(null, "prev");
          } else {
            const end = options.end || options.start - options.limit + 1;
            const right = Math.max(end, options.start);
            const left = Math.min(end, options.start);
            const seqRange = IDBKeyRange.bound(left, right);
            seqRequest = seqIndex.openCursor(seqRange);
          }

          seqRequest.onsuccess = function () {
            const seqCursor = seqRequest.result;
            if (isExpire) {
              if (seqCursor && count < options.limit) {
                const isInGroup =
                  groupResults.findIndex(
                    (item) => item.channel_id === seqCursor.value.channel_id
                  ) >= 0;
                if (isInGroup) {
                  seqResults.unshift(seqCursor.value);
                  count++;
                }
                seqCursor.continue();
              } else {
                resolve(seqResults);
              }
            } else {
              if (seqCursor) {
                const isInGroup =
                  groupResults.findIndex(
                    (item) => item.channel_id === seqCursor.value.channel_id
                  ) >= 0;
                if (isInGroup) {
                  seqResults.push(seqCursor.value);
                }
                seqCursor.continue();
              } else {
                // 合并并筛选数据
                const finalResults = seqResults.filter((item) => {
                  return groupResults.some((result) => {
                    return result.clientMsgNo === item.clientMsgNo;
                  });
                });
                console.log("最终查询结果:", finalResults);
                resolve(finalResults);
              }
            }
          };
          seqRequest.onerror = function () {
            console.error("使用 seq 索引查询出错:", groupRequest.error);
          };
        }
      };

      groupRequest.onerror = () => reject(groupRequest.error);
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
