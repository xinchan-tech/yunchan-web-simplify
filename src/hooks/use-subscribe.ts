import { stockUtils } from "@/utils/stock"
import { useEffect } from "react"

export const useSubscribe = (symbol: string | string[], onUpdate: (data: any) => void) => {
  useEffect(() => {
    const s = [...symbol]
    if (s) {

      stockUtils.subscribe(s, onUpdate)

      return () => {
        if (s) {
          stockUtils.unsubscribe(s, onUpdate)
        }
      }
    }
  }, [symbol, onUpdate])
}