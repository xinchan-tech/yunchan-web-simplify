import { create } from "zustand"
import { Stock, StockRecord, StockTrading } from "./stock"
import { produce } from "immer"
import type { StockRawRecord } from "@/api"

export * from './stock'

interface StockStore {
  stocks: Record<symbol, StockRecord[]>
  // findStock: (code: string) => Stock | undefined
  insertRaw: (code: string, raw: StockRawRecord) => void
  getLastRecord: (code: string) => StockRecord | undefined
  getLastRecords: (code: string, trading: StockTrading) => StockRecord[]
  // createStock: (code: string, name: string) => Stock
}

export const useStock = create<StockStore>()((set, get) => ({
  stocks: {},
  stocksTimeIndex: {},
  insertRaw: (code, raw: StockRawRecord) => {
    set(produce<StockStore>(state => {
      const records = state.stocks[Symbol.for(code)]

      if(!records){
        state.stocks[Symbol.for(code)] = [new StockRecord(raw)]
      }else{
        if(hasIndex(records as StockRecord[], raw[0])) return
        const index = getInsertIndex(records as StockRecord[], raw[0])

        records.splice(index, 0, new StockRecord(raw))
      }
    }))
  },
  getLastRecord: (code) => {
    const records = get().stocks[Symbol.for(code)]
    return records?.[records.length - 1]
  },
  getLastRecords: (code, trading) => {
    const records = get().stocks[Symbol.for(code)] ?? []
    const r = []
    for (let index = records.length - 1; index >= 0; index--) {
      if(records[index].trading === trading){
        r.unshift(records[index])
      }
    }

    return r
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
    }else {
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
    }else {
      left = mid + 1
    }
  }

  return left
}