import { stockManager } from "@/utils/stock"
import { useEffect } from "react"

export const useSubscribe = (symbol: string, onUpdate: (data: any) => void) => {
  useEffect(() => {
    if (symbol) {

      stockManager.subscribe(symbol, onUpdate)

      return () => {
        if (symbol) {
          stockManager.unsubscribe(symbol, onUpdate)
        }
      }
    }
  }, [symbol, onUpdate])
}