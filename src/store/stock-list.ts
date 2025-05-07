import { getAllStocks } from '@/api'
import { createStoreIndexStorage } from '@/plugins/createStoreIndexStorage'
import { gzDecode } from '@/utils/string'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type StockData = [string, string, string, string]

interface StockListStore {
  history: StockData[]
  list: StockData[]
  listMap: NormalizedRecord<StockData>
  appendHistory: (data: StockData[]) => void
  cleanHistory: () => void
  key: string
  setList: (data: StockData[], key: string) => void
}

export const useStockList = create<StockListStore>()(
  persist(
    (set, get) => ({
      history: [],
      list: [],
      listMap: {},
      key: '',
      appendHistory: (data: StockData[]) => {
        const history = get().history
        for (const item of data) {
          if (!history.find(i => i[1] === item[1])) {
            history.push(item)
          }
        }
      },
      cleanHistory: () => {
        set({ history: [] })
      },
      setList: (data: StockData[], key: string) => {
        const m: NormalizedRecord<StockData> = {}
        for (const item of data) {
          m[item[1]] = item
        }
        set({ list: data, key, listMap: m })
      }
    }),
    {
      name: 'stock-list',
      onRehydrateStorage: s => {
        return state => {
          if (!state?.key) {
            getAllStocks().then(r => {
              const res = JSON.parse(gzDecode(r.data)) as [string, string, string, string][]
              res.sort((a, b) => a[1].localeCompare(b[1]))
              s.setList(res, r.key)
            })
          } else {
            getAllStocks(state.key).then(r => {
              if (r.key !== state.key) {
                const res = JSON.parse(gzDecode(r.data)) as [string, string, string, string][]
                res.sort((a, b) => a[1].localeCompare(b[1]))
                s.setList(res, r.key)
              }
            })
          }
        }
      },
      storage: createJSONStorage(() => createStoreIndexStorage())
    }
  )
)
