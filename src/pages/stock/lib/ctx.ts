import { StockChartInterval } from "@/api"
import { createContext, useContext } from "react"
import type { Updater } from "use-immer"

type ViewMode = 'signal' 
| 'double' 
| 'double-vertical' 
| 'three-left-signal' 
| 'three-right-signal' 
| 'three-vertical-top-signal' 
| 'three-vertical-bottom-signal'
| 'four'
| 'six'
| 'nine'
export interface KChartContext {
  timeIndex: StockChartInterval
  viewMode: ViewMode
  setState: Updater<KChartState>
}

export type KChartState = Omit<KChartContext, 'setState'>


export const KChartContext = createContext<KChartContext>({
  timeIndex: StockChartInterval.DAY,
  viewMode: 'signal',
  setState: () => {}
})

export const useKChartContext = () => {
  return useContext(KChartContext)
}