import type { StockChartInterval } from "@/api"
import type {EChartsType as EEChartsType} from 'echarts/core'
import type { Emitter } from "mitt"

declare module 'echarts/core' {
  interface EChartsType extends EEChartsType {
    meta: {
      dataZoom: {
        start: number
        end: number
      },
      yAxis: {
        left?: 'price' | 'percent',
        right: 'price' | 'percent'
      },
      mainData: any[],
      timeIndex: StockChartInterval,
      event: Emitter<any>
    }
  }
}