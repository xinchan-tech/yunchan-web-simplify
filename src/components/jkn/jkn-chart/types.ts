import type { AxisTemplate, IndicatorDrawParams, KLineData } from '@/plugins/jkn-kline-chart'

export type AxisPosition = NonNullable<AxisTemplate['position']>

export type Candlestick = KLineData

export type DrawFunc<T> = (params: IndicatorDrawParams<T, any, any>) => void

export type DrawOverlayParams = {
  color: string
  lineWidth: number
  lineType: string
}