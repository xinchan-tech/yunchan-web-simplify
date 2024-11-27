import { create } from 'zustand'
import { StockRecord, type StockResultRecord, type StockTrading } from './stock'
import { produce } from 'immer'
import type { StockExtendResult, StockRawRecord } from '@/api'

export { StockRecord }

interface StockStore {
  stocks: Record<symbol, StockRecord[]>
  insertRaw: (code: string, raw: StockRawRecord, extend?: Record<StockExtendResult, any>) => void
  getLastRecord: (code: string) => StockRecord | undefined
  getLastRecordByTrading: (code: string, trading: StockTrading) => StockRecord | undefined
  getLastRecords: (code: string, trading: StockTrading) => StockRecord[]
  insertRawByRecords: (record: StockResultRecord[]) => void
}

export const useStock = create<StockStore>()((set, get) => ({
  stocks: {},
  stocksTimeIndex: {},
  insertRaw: (code, raw, extend) => {
    set(
      produce<StockStore>(state => {
        const records = state.stocks[Symbol.for(code)]
        if (!records) {
          state.stocks[Symbol.for(code)] = [new StockRecord(raw, extend)]
        } else {
          if (hasIndex(records as StockRecord[], StockRecord.parseTime( raw[0]))) {
            const record = records.find(record => record.time === StockRecord.parseTime( raw[0]))
            record?.update(raw, extend)
          } else {
            const index = getInsertIndex(records as StockRecord[], StockRecord.parseTime( raw[0]))

            records.splice(index, 0, new StockRecord(raw, extend))
          }
        }
      })
    )
  },
  getLastRecord: code => {
    const records = get().stocks[Symbol.for(code)]
    return records?.[records.length - 1]
  },
  getLastRecordByTrading: (code, trading) => {
    const records = get().stocks[Symbol.for(code)]
    return records?.filter(record => record.trading === trading).slice(-1)[0]
  },
  getLastRecords: (code, trading) => {
    const records = get().stocks[Symbol.for(code)] ?? []
    const r = []
    for (let index = records.length - 1; index >= 0; index--) {
      if(r.length !== 0){
        if(records[index].time.slice(0, 8) !== r[0].time.slice(0, 8)){
          return r
        }
      }
      if (records[index].trading === trading) {
        r.unshift(records[index])
      }
    }

    return r
  },
  insertRawByRecords: record => {
    for (const s of record) {
      if (StockRecord.isValid(s.stock)) {
        get().insertRaw(s.symbol, s.stock, s.extend)
      }

      if (s.extend?.stock_after && StockRecord.isValid(s.extend.stock_after)) {
        get().insertRaw(s.symbol, s.extend.stock_after, s.extend)
      }
      if (s.extend?.stock_before && StockRecord.isValid(s.extend.stock_before)) {
        get().insertRaw(s.symbol, s.extend.stock_before, s.extend)
      }
    }
  }
}))

//根据二分法查找
const hasIndex = (times: StockRecord[], time: string) => {
  let left = 0
  let right = times.length - 1
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (times[mid].time === time) {
      return true
    }

    if (times[mid].time > time) {
      right = mid - 1
    } else {
      left = mid + 1
    }
  }
  return false
}

//根据二分查找获取时间列表的插入下标
const getInsertIndex = (times: StockRecord[], time: string) => {
  let left = 0
  let right = times.length - 1
  while (left <= right) {
    const mid = Math.floor((left + right) / 2)
    if (times[mid].time === time) {
      return mid
    }

    if (times[mid].time > time) {
      right = mid - 1
    } else {
      left = mid + 1
    }
  }

  return left
}

export type { StockTrading }
