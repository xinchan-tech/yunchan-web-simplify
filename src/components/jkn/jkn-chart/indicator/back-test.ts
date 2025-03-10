import { type FigureConstructor, getFigureClass, IndicatorSeries, type IndicatorTemplate } from 'jkn-kline-chart'
import type { BackTestLineAttrs, BackTestLineStyles, BackTestMarkAttrs, BackTestMarkStyles } from '../figure'
import { inRange } from 'radash'

export type BackTestRecord = {
  time: number
  price: number
  count: number
  type: 'buy' | 'sell'
  index: number
}

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
      const key = `${item.time.toString()}${item.type}`
      if (!timeMap[key]) {
        timeMap[key] = 0
      }

      item.index = timeMap[key]
      timeMap[key]++
    })

    return record
  },
  createTooltipDataSource: () => {
    return {
      name: '',
      icons: [],
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

    let totalCount = 0
    let totalPrice = 0
    let totalDiff = 0
    let totalSellPrice = 0
    let totalBuyPrice = 0

    result.forEach(item => {
      totalCount += item.count
      totalPrice += item.price * item.count
      totalDiff += item.type === 'buy' ? item.count : -item.count

      if (item.type === 'buy') {
        totalBuyPrice += item.price * item.count
      } else {
        totalSellPrice += item.price * item.count
      }

      const xPixel = xAxis.convertTimestampToPixel(item.time * 1000)
      if (!inRange(xPixel, fromPixel, toPixel)) return
      const y1 = yAxis.convertToPixel(item.price)
      new BackTestMark({
        name: 'back-test-mark',
        attrs: {
          x: xPixel,
          y1: y1,
          y2: y1 + (item.type === 'buy' ? 1 : -1) * ((item.type === 'buy' ? 100 : 300) + item.index * 50),
          type: item.type,
          price: item.price,
          count: item.count,
          line: item.index === 0
        },
        styles: {
          color: item.type === 'buy' ? upColor : downColor
        }
      }).draw(ctx)
    })


    if (totalDiff !== 0) {
      const avgPrice = totalPrice / totalCount
      const lastStock = chart.getDataList()[chart.getDataList().length - 1]
      const lastPrice = lastStock.close * totalDiff
      const totalDiffPrice = totalSellPrice - totalBuyPrice
      const totalProfit = totalDiff < 0 ? 0 : lastPrice + totalDiffPrice
      console.log(totalDiff)
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
