import { useIndicator } from '@/store'
import { calcIndicator, type IndicatorData } from '@/utils/coiling'
import { aesDecrypt } from '@/utils/string'
import { Chart, type FigureConstructor, getFigureClass, IndicatorSeries, type IndicatorTemplate, PolygonType } from 'jkn-kline-chart'
import { candlestickToRaw } from './utils'
import { inRange } from "radash"

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
    )
  },
  createTooltipDataSource: () => ({
    name: '',
    icons: [],
    legends: [],
    calcParamsText: ''
  }),
  draw: ({ ctx, chart, indicator, bounding, xAxis, yAxis }) => {
    const { realFrom, realTo } = chart.getVisibleRange()
    const result = indicator.result as unknown as IndicatorData[]
    const dataList = chart.getDataList()
    if (!result) return false

    result.forEach(d => {
      if (d.draw === '') {
        const range = d.drawData.slice(realFrom, realTo)
        const Line = getFigureClass('line')!
        drawLine(Line, ctx, {
          color: d.color,
          width: d.width,
          type: d.lineType as any,
          data: range.map((v, i) => ({ x: xAxis.convertToPixel(i + realFrom), y: yAxis.convertToPixel(v) }))
        })
      }else if (d.draw === 'STICKLINE'){
        const Rect = getFigureClass('rect')!
        d.drawData.forEach((item) => {
          if(inRange(item.x, realFrom, realTo)){
            const { gapBar, halfGapBar } = chart.getBarSpace()
            const y = yAxis.convertToPixel(item.y1)
            const y2 = yAxis.convertToPixel(item.y2)
            new Rect({
              name: 'stickLine',
              attrs: {
                x: xAxis.convertToPixel(item.x) - halfGapBar * item.width,
                y: y2,
                width: gapBar * item.width,
                height: y - y2
              },
              styles: {
                color: item.empty === 1 ? 'transparent' : d.color,
                borderColor: item.empty === 0 ? 'transparent' : d.color,
                borderSize: 1,
                style: item.empty === 1 ? 'stroke' : 'fill'
              }
            }).draw(ctx)
          }
        })
      }else if (d.draw === 'DRAWBAND'){
        
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
const drawLine = (Line: FigureConstructor, ctx: CanvasRenderingContext2D, attr: LineShape) => {
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

