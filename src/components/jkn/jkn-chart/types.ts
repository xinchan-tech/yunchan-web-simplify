import type { AxisTemplate, IndicatorDrawParams, KLineData } from 'jkn-kline-chart'

export type AxisPosition = NonNullable<AxisTemplate['position']>

export type Candlestick = KLineData

export type DrawFunc<T> = (params: IndicatorDrawParams<T, any, any>) => void