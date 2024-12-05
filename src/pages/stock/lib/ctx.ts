import type { StockChartInterval } from "@/api"
import { createContext, useContext } from "react"
import type { Updater } from "use-immer"

type ViewMode = 'single' 
| 'double' 
| 'double-vertical' 
| 'three-left-single' 
| 'three-right-single' 
| 'three-vertical-top-single' 
| 'three-vertical-bottom-single'
| 'four'
| 'six'
| 'nine'

type MainChartType = 'line' | 'k-line'

type MainChartState = {
  type: MainChartType
  timeIndex: StockChartInterval
}

export interface KChartContext {
  viewMode: ViewMode
  state: MainChartState[]
  activeChartIndex: number
  setState: Updater<KChartState>
}

export type KChartState = Omit<KChartContext, 'setState'>


export const KChartContext = createContext<KChartContext>({} as unknown as KChartContext)

export const useKChartContext = () => {
  return useContext(KChartContext)
}