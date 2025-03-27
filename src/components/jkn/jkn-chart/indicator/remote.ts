import { useIndicator } from '@/store'
import { IndicatorUtils, type IndicatorData } from '@/utils/coiling'
import { aesDecrypt } from '@/utils/string'
import { IndicatorSeries, type IndicatorTemplate } from 'jkn-kline-chart'
import { candlestickToRaw } from '../utils'
import { localIndicator } from "./local"

type RemoteIndicatorExtend = {
  name: string
  action?: ('visible' | 'delete')[]
}

export const remoteIndicator: IndicatorTemplate<IndicatorData, any, RemoteIndicatorExtend> = {
  name: 'remote-indicator',
  shortName: 'remote-indicator',
  zLevel: 1,
  series: IndicatorSeries.Normal,
  calcParams: [],
  getValueRangeInVisibleRange: localIndicator.getValueRangeInVisibleRange,
  calc: async (dataList, indicator) => {
    const [indicatorId, symbol, interval] = indicator.calcParams as [string, string, number]
    const formula = useIndicator.getState().formula
    const rawData = dataList.map(candlestickToRaw)

    if (!formula[indicatorId]) return []

    const r = await IndicatorUtils.calcIndicator(
      {
        formula: aesDecrypt(formula[indicatorId]),
        symbal: symbol,
        indicatorId
      },
      rawData,
      interval
    )

    return r
  },
  createTooltipDataSource: localIndicator.createTooltipDataSource,
  draw: localIndicator.draw
}
