import { type FigureConstructor, getFigureClass, IndicatorSeries, type IndicatorTemplate } from 'jkn-kline-chart'
import type { BackTestLineAttrs, BackTestLineStyles, BackTestMarkAttrs, BackTestMarkStyles } from '../figure'
import { inRange } from 'radash'

export type BackTestRecord = {
  time: number
  price: number
  count: number
  type: 'buy' | 'sell' | 'buyToZero' | 'sellToZero'
  index: number
  num: number
  cost: number
}

const isBuyRecord = (record: BackTestRecord) => record.type === 'buy' || record.type === 'buyToZero'

export const backTestIndicator: IndicatorTemplate<any, any> = {
  name: 'back-test-indicator',
  shortName: 'back-test-indicator',
  zLevel: 1,
  series: IndicatorSeries.Price,
  calcParams: [[]],
  calc: async (_dataList, indicator) => {
    const [record] = indicator.calcParams as [BackTestRecord[]]
    const timeMap: Record<string, number> = {}

    record.forEach(item => {
      const type = isBuyRecord(item) ? 'buy' : 'sell'
      const key = `${item.time.toString()}${type}`
      if (!timeMap[key]) {
        timeMap[key] = 0
      }

      item.num = timeMap[key]
      timeMap[key]++
    })

    return record
  },
  createTooltipDataSource: () => {
    return {
      name: '',
      features: [],
      legends: [],
      calcParamsText: ''
    }
  },
  draw: params => {
    const { indicator, chart, ctx, xAxis, yAxis, bounding } = params
    const { upColor, downColor } = chart.getStyles().candle.bar
    const result = indicator.result as BackTestRecord[]

    const BackTestMark = getFigureClass('back-test-mark')! as FigureConstructor<BackTestMarkAttrs, BackTestMarkStyles>
    const { realFrom, realTo } = chart.getVisibleRange()
    const fromPixel = xAxis.convertToPixel(realFrom)
    const toPixel = xAxis.convertToPixel(realTo)
    const data = chart.getDataList()
  
    let totalCount = 0
    let totalPrice = 0
    let totalDiff = 0

    result.forEach(item => {
      totalCount += item.count
      totalPrice += item.price * item.count
      totalDiff += isBuyRecord(item) ? item.count : -item.count

      const xPixel = xAxis.convertTimestampToPixel(item.time * 1000)

      const d = data[item.index]
      if (!inRange(xPixel, fromPixel, toPixel) || !d) return
      const base = isBuyRecord(item) ? d.low : d.high
      const y1 = yAxis.convertToPixel(base)
      new BackTestMark({
        name: 'back-test-mark',
        attrs: {
          x: xPixel,
          y1: y1,
          y2: y1 + (isBuyRecord(item) ? 1 : -1) * ((isBuyRecord(item) ? 100 : 200) + item.num * 50),
          type: item.type,
          price: item.price,
          count: item.count,
          line: item.num === 0
        },
        styles: {
          color: isBuyRecord(item) ? upColor : downColor
        }
      }).draw(ctx)
    })

    if (totalDiff !== 0) {
      const avgPrice = totalPrice / totalCount
      const lastStock = chart.getDataList()[chart.getDataList().length - 1]
      const lastPrice = lastStock.close * Math.abs(totalDiff)
      const totalProfit = result[result.length - 1].cost - lastPrice

      const BackTestLine = getFigureClass('back-test-line')! as FigureConstructor<BackTestLineAttrs, BackTestLineStyles>

      new BackTestLine({
        name: 'back-test-line',
        attrs: {
          x1: 0,
          x2: bounding.width,
          y: yAxis.convertToPixel(avgPrice),
          profit: totalProfit,
          price: avgPrice,
          count: totalDiff
        },
        styles: {
          color: totalProfit <= 0 ? downColor : upColor
        }
      }).draw(ctx)
    }

    return true
  }
}
