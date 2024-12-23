import { stockManager } from "@/utils/stock"
import { useEffect } from "react"

export const useSubscribe = (symbol: string | string[], onUpdate: (data: any) => void) => {
  useEffect(() => {
    console.log('useSubscribe', symbol)
    const s = [...symbol]
    if (s) {

      stockManager.subscribe(s, onUpdate)

      return () => {
        if (s) {
          stockManager.unsubscribe(s, onUpdate)
        }
      }
    }
  }, [symbol, onUpdate])
}