import { useEffect, useState } from "react"
import { chartEvent } from "../lib"


export const IndicatorTooltip = () => {
  const [data, setData] = useState<{name: string, id: string, value: string}>([])

  useEffect(() => {
    const handle = (e: any) => {
      console.log(e)
    }

    chartEvent.event.on('data', handle)

    return () => {
      chartEvent.event.off('data', handle)
    }
  }, [])

  return (
    <div>

    </div>
  )
}