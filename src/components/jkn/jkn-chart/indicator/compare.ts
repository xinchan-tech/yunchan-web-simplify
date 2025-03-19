import {
  type FigureConstructor,
  IndicatorSeries,
  type IndicatorTemplate,
  type LineAttrs,
  type LineStyle,
  getFigureClass
} from 'jkn-kline-chart'

export const compareIndicator: IndicatorTemplate<any, any> = {
  name: 'compare-indicator',
  shortName: 'compare-indicator',
  zLevel: 1,
  series: IndicatorSeries.Price,
  calcParams: [[], '#FF0000'],
  calc: (_dataList, indicator) => {
    const validIndex = indicator.calcParams[0].findIndex((x: number) => x !== null)
    return [
      {
        validIndex,
        data: indicator.calcParams[0],
        color: indicator.calcParams[1]
      }
    ]
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
    const { indicator, chart, ctx, xAxis, yAxis } = params

    const { realFrom, realTo } = chart.getVisibleRange()
    const result = indicator.result[0] as { validIndex: number; data: number[]; color: string }
    if (!result) return false

    const Line = getFigureClass('line')! as FigureConstructor<LineAttrs, Partial<LineStyle>>
    const validFrom = realFrom > result.validIndex ? realFrom : result.validIndex
    const dataList = chart.getDataList()

    const base = dataList[validFrom].close
    const k = base / result.data[validFrom]

    new Line({
      name: 'line',
      attrs: {
        coordinates: result.data.map((item, index) => {
          return {
            x: xAxis.convertToPixel(index),
            y: item ? yAxis.convertToPixel(item! * k) : 0
          }
        })
      },
      styles: {
        color: result.color
      }
    }).draw(ctx)

    return true
  }
}
