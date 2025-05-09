import { assign } from 'radash'
import { CacheStoreName, ChatCache } from './db'

type User = {
  avatar: string
  name: string
  uid: string
}

class UserCache extends ChatCache {
  public static USER_STORE = CacheStoreName.USER_STORE

  private getUserId(user: User) {
    return user.uid
  }

  async get(uid: string) {
    const db = await this.getDb()
    const obj = await db.get(UserCache.USER_STORE, uid)

    return obj as Nullable<User>
  }

  async updateOrSave(user: User) {
    const db = await this.getDb()
    const id = this.getUserId(user)
    const _user = await db.get(UserCache.USER_STORE, id)

    if (!_user) {
      await db.add(UserCache.USER_STORE, user)
    } else {
      assign(_user, user)
      await db.put(UserCache.USER_STORE, _user)
    }
  }

  async updateBatch(data: User[]) {
    const db = await this.getDb()

    /**
     * 开启事务
     */
    const tx = db.transaction(UserCache.USER_STORE, 'readwrite')
    const store = tx.objectStore(UserCache.USER_STORE)

    await Promise.all(data.map(item => store.delete(this.getUserId(item))))

    await Promise.all(
      data.map(async user => {
        await store.add(user)
      })
    )
  }
}

export const userCache = new UserCache()
