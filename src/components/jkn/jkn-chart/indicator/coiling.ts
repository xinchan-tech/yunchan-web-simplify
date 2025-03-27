import type { IndicatorTemplate } from 'jkn-kline-chart'
import { candlestickToRaw } from '../utils'
import {
  calcCoilingPivots,
  calcCoilingPivotsExpands,
  calcTradePoints,
  calculateMA,
  type CoilingCalcResult,
  CoilingIndicatorId
} from '../coiling-calc'
import { drawCoilingMA, drawCoilingPen, drawCoilingPivot, drawCoilingTradePoint } from '../draw/draw-coiling'
import { IndicatorUtils } from '@/utils/coiling'

/**
 * 笔
 */
export const coilingIndicator: IndicatorTemplate<CoilingCalcResult> = {
  name: 'coiling',
  shortName: 'coiling',
  zLevel: -1,
  calcParams: [1440, []],
  calc: async (dataList, { calcParams }) => {
    const rawList = dataList.map(candlestickToRaw)
    const [interval, coilingIds] = calcParams as [number, CoilingIndicatorId[]]
    const coilingData = (await IndicatorUtils.calcCoiling(rawList, interval)) as CoilingCalcResult
    coilingData.maResult = {}
    coilingData.tradePointsResult = [null, null, null] as any
    coilingIds.forEach(id => {
      switch (id) {
        case CoilingIndicatorId.ONE_TYPE:
          coilingData.tradePointsResult[0] = calcTradePoints(coilingData.class_1_trade_points)
          break
        case CoilingIndicatorId.TWO_TYPE:
          coilingData.tradePointsResult[1] = calcTradePoints(coilingData.class_2_trade_points)
          break
        case CoilingIndicatorId.THREE_TYPE:
          coilingData.tradePointsResult[2] = calcTradePoints(coilingData.class_3_trade_points)
          break
        case CoilingIndicatorId.PIVOT:
          coilingData.pivotsResult = calcCoilingPivots(coilingData.pivots)
          coilingData.expandsResult = calcCoilingPivotsExpands(coilingData.expands)
          break
        case CoilingIndicatorId.SHORT_LINE:
          coilingData.maResult[20] = calculateMA(20, dataList)
          coilingData.maResult[30] = calculateMA(30, dataList)
          break
        case CoilingIndicatorId.MAIN:
          coilingData.maResult[55] = calculateMA(55, dataList)
          coilingData.maResult[60] = calculateMA(60, dataList)
          coilingData.maResult[65] = calculateMA(65, dataList)
          coilingData.maResult[120] = calculateMA(120, dataList)
          coilingData.maResult[250] = calculateMA(250, dataList)
          break
        default:
          break
      }
    })

    return [coilingData]
  },
  createTooltipDataSource: () => ({
    name: '',
    features: [],
    legends: [],
    calcParamsText: '',
    action: []
  }),
  draw: params => {
    const [_interval, coilingParams] = params.indicator.calcParams as [number, CoilingIndicatorId[]]
    const coilingData = params.indicator.result[0] as CoilingCalcResult

    if (!coilingData) return false

    coilingParams.forEach(coilingId => {
      switch (coilingId) {
        case CoilingIndicatorId.PIVOT:
          drawCoilingPivot(params)
          break
        case CoilingIndicatorId.ONE_TYPE:
          drawCoilingTradePoint(params, 1)
          break
        case CoilingIndicatorId.TWO_TYPE:
          drawCoilingTradePoint(params, 2)
          break
        case CoilingIndicatorId.THREE_TYPE:
          drawCoilingTradePoint(params, 3)
          break
        case CoilingIndicatorId.SHORT_LINE:
          drawCoilingMA(params, [20, 30])
          break
        case CoilingIndicatorId.MAIN:
          drawCoilingMA(params, [55, 60, 65, 120, 250])
          break
        case CoilingIndicatorId.PEN:
          drawCoilingPen(params)
          break
        default:
          break
      }
    })
    return true
  }
}
