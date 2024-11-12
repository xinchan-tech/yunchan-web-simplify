import type { getStockCategoryData } from "@/api"
import { createContext } from "react"

export interface SuperStockContext {
  data: Awaited<ReturnType<typeof getStockCategoryData>>
}


export const SuperStockContext = createContext<SuperStockContext>({data: {}} as SuperStockContext)