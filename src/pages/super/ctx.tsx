import type { getStockCategoryData, getStockSelection } from "@/api"
import { createContext } from "react"

type StepField = keyof Parameters<typeof getStockSelection>[0] | 'category_ids_ext'

export interface SuperStockContext {
  data: Awaited<ReturnType<typeof getStockCategoryData>>
  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  register: (field: StepField, step: number, getData: () => any, validate: (form: any) => boolean) => void
  unregister: (field: StepField) => void
}


export const SuperStockContext = createContext<SuperStockContext>({ data: {} } as SuperStockContext)