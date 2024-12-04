import echarts from "@/utils/echarts"
import { useMount, useUnmount, useUpdateEffect } from "ahooks"
import { type MutableRefObject, type RefObject, useRef } from "react"
import { useDomSize } from "./use-dom-size"

export const useChart = () : [MutableRefObject<echarts.ECharts | undefined>, RefObject<HTMLDivElement>] => {
  const [size, dom] = useDomSize<HTMLDivElement>()
  const chart = useRef<echarts.ECharts>()

  useMount(() => {
    chart.current = echarts.init(dom.current)
  })

  useUnmount(() => {
    chart.current?.dispose()
  })

  useUpdateEffect(() => {
    chart.current?.resize()
  }, [size])

  return [chart, dom]
}