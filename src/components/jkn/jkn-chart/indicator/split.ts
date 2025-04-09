import {
  type FigureConstructor,
  getFigureClass,
  IndicatorSeries,
  type LineAttrs,
  type LineStyle,
  type IndicatorTemplate,
  LineType
} from 'jkn-kline-chart'

export const SplitIndicator: IndicatorTemplate<any, any> = {
  name: 'split-indicator',
  shortName: 'split-indicator',
  zLevel: 1,
  series: IndicatorSeries.Price,
  calcParams: [[]],
  calc: async (_dataList, indicator) => {
    return indicator.calcParams[0]
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
    const { indicator, ctx, bounding, chart, xAxis } = params
    const result = indicator.result as number[]
    const Line = getFigureClass('line')! as FigureConstructor<LineAttrs, Partial<LineStyle>>
    const dataList = chart.getDataList()

    if (!dataList.length) return true

    const lastDrawX = xAxis.convertToPixel(dataList.length - 1)

    result.forEach(x => {
      const _x = bounding.width * x

      if (_x > lastDrawX) return

      new Line({
        name: 'mark-overlay',
        attrs: {
          coordinates: [
            { x: bounding.width * x, y: 0 },
            {
              x: bounding.width * x,
              y: bounding.height
            }
          ]
        },
        styles: {
          style: LineType.Dashed,
          color: '#2E2E2E',
          size: 1,
          dashedValue: [10, 5]
        }
      }).draw(ctx)
    })

    return true
  }
}
