import {
  type FigureConstructor,
  getFigureClass,
  IndicatorSeries,
  type KLineData,
  PolygonType,
  type RectAttrs,
  type RectStyle,
  type IndicatorTemplate
} from 'jkn-kline-chart'

export const gapIndicator: IndicatorTemplate<any, any> = {
  name: 'gap-indicator',
  shortName: 'gap-indicator',
  zLevel: -1,
  series: IndicatorSeries.Normal,
  calcParams: [1],
  calc: async dataList => {
    return dataList
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
    const [count] = params.indicator.calcParams
    const result = params.indicator.result as KLineData[]

    const { from, to } = params.chart.getVisibleRange()

    const data = result.slice(from, to)

    if (data.length < 2) {
      return false
    }

    const last = data.slice(-1)[0]
    const end = params.xAxis.convertTimestampToPixel(last.timestamp)

    const Rect = getFigureClass('rect') as FigureConstructor<RectAttrs, Partial<RectStyle>>

    const gap: {
      low: number
      high: number
      direction: 'up' | 'down'
      start: number
    }[] = []

 

    let min = data.slice(-1)[0].low
    let max = data.slice(-1)[0].high

    data
      .reverse()
      .slice(1)
      .forEach((d) => {
        if (gap.length >= count) {
          return false
        }
        const { low, high } = d
        if (low > max) {
          gap.push({
            low: max,
            high: low,
            direction: 'down',
            start: d.timestamp
          })
        } else if (high < min) {
          gap.push({
            low: high,
            high: min,
            direction: 'up',
            start: d.timestamp
          })
        }

        min = Math.min(min, low)
        max = Math.max(max, high)
      })

    gap.forEach(g => {
      new Rect({
        name: 'gapRect',
        attrs: {
          x: params.xAxis.convertTimestampToPixel(g.start),
          y: params.yAxis.convertToPixel(g.low),
          width: end - params.xAxis.convertTimestampToPixel(g.start),
          height: params.yAxis.convertToPixel(g.high) - params.yAxis.convertToPixel(g.low),
        },
        styles: {
          color: 'rgba(127.5, 127.5, 127.5,0.2)',
          style: PolygonType.Fill
        }
      }).draw(params.ctx)
    })

    return true
  }
}
