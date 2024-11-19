import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

type StockData = [string, string, string, string]

interface StockListStore {
  history: StockData[]
  list: StockData[]
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
        set({ list: data, key })
      },

    }),
    {
      name: 'stock-list',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
