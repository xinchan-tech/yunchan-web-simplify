import { useIndicator } from '@/store'
import { calcIndicator } from '@/utils/coiling'
import { aesDecrypt } from '@/utils/string'
import { type FigureConstructor, getFigureClass, IndicatorSeries, type IndicatorTemplate } from 'jkn-kline-chart'
import { candlestickToRaw } from './utils'
import type { IndicatorData } from './types'

export const localIndicator: IndicatorTemplate = {
  name: 'local-indicator',
  shortName: 'local-indicator',
  zLevel: 1,
  series: IndicatorSeries.Price,
  calcParams: [],
  calc: async (dataList, indicator) => {
    const [indicatorId, symbol, interval] = indicator.calcParams as [string, string, number]
    const formula = useIndicator.getState().formula
    const rawData = dataList.map(candlestickToRaw)
    if (!formula[indicatorId]) return []

    return await calcIndicator(
      {
        formula: aesDecrypt(formula[indicatorId]),
        symbal: symbol,
        indicatorId
      },
      rawData,
      interval
    ).then(r => r.data)
  },
  createTooltipDataSource: () => ({
    name: '',
    icons: [],
    legends: [],
    calcParamsText: ''
  }),
  draw: ({ ctx, chart, indicator, bounding, xAxis, yAxis }) => {
    const { realFrom, realTo } = chart.getVisibleRange()
    const result = indicator.result as IndicatorData
    const dataList = chart.getDataList()
    console.log(result)
    if (!result) return false

    result.forEach(d => {
      if (d.draw === '') {
        const range = d.data.slice(realFrom, realTo)
        console.log(range)
        const Line = getFigureClass('line')!
        drawLine(Line, {
          color: d.color,
          width: d.linethick,
          type: 'solid',
          data: range.map((v, i) => ({ x: xAxis.convertToPixel(i), y: yAxis.convertToPixel(v[0]) }))
        })
      }
    })

    return true
  }
}

type LineShape = {
  color: string
  width?: number
  type: 'solid' | 'dash'
  data: { x: number; y: number }[]
}
const drawLine = (Line: FigureConstructor, attr: LineShape) => {
  new Line({
    name: 'line',
    attrs: {
      coordinates: attr.data
    },
    styles: {
      color: attr.color,
      size: attr.width || 1
    }
  }).draw(ctx)
}
