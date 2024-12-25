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
      },

    }),
    {
      name: 'stock-list',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
