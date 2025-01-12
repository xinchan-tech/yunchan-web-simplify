import type {EChartsType as EEChartsType} from 'echarts'

declare module 'echarts' {
  interface EChartsType extends EEChartsType {
    meta?: {
      dataZoom: {
        start: number
        end: number
      },
      yAxis: {
        left?: 'price' | 'percent',
        right: 'price' | 'percent'
      },
      mainData: any[],
      toolTip: {
        dataIndex: number
      }
    }
  }
}