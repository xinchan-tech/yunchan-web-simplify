import { useConfig } from '@/store'
import type { Candlestick } from './types'
import type { StockRawRecord } from "@/api"

export enum ChartTypes {
  MAIN_PANE_ID = 'candle_pane'
}

export const transformTextColor = (text: string, startData: Candlestick) => {
  const getColor = useConfig.getState().getStockColor
  if (text.endsWith('%')) {
    if (Number.parseFloat(text) > 0) {

      return getColor(true, 'hex')
    }
    return getColor(false, 'hex')
  }

  if (!startData) {
    return 'transparent'
  }
  return Number.parseFloat(text) > startData.close ? getColor(true, 'hex') : getColor(false, 'hex')
}

export const transformCandleColor = (candle: Candlestick) => {
  const percent = (candle.close - candle.prevClose) / candle.prevClose

  if (Math.abs(percent) < 0.09) {
    return undefined
  }

  return percent > 0 ? '#ffffff' : '#9123a7'
}

export const getStockColor = () => {
  const getColor = useConfig.getState().getStockColor 

  return {
    up: getColor(true, 'hex'),
    down: getColor(false, 'hex')
  }
}

export const candlestickToRaw = (candle: Candlestick): StockRawRecord => {
  return [candle.timestamp as unknown as string, candle.open, candle.close, candle.high, candle.low, candle.volume ?? 0, candle.turnover ?? 0, candle.prevClose]
}