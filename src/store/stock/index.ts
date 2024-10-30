import { create } from "zustand"
import { Stock } from "./stock"

export * from './stock'

interface StockStore {
  stocks: Record<symbol, Stock>
  findStock: (symbol: string) => Stock | undefined
  createStock: (symbol: string, name: string) => Stock
}

export const useStock = create<StockStore>()((set, get) => ({
  stocks: {},
  findStock: (symbol: string) => {
    return get().stocks[Symbol.for(symbol)]
  },
  createStock: (symbol: string, name: string) => {
    const s = get().findStock(symbol)
    if (s) return s
    
    const stock = new Stock(symbol, name)

    set(state => ({
      stocks: {
        ...state.stocks,
        [stock.getSymbol()]: stock
      }
    }))

    return stock
  }
}))