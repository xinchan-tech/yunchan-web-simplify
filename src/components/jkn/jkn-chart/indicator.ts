import { useIndicator } from '@/store'
import { calcIndicator, type IndicatorData } from '@/utils/coiling'
import { aesDecrypt } from '@/utils/string'
import {
  type CircleAttrs,
  type FigureConstructor,
  getFigureClass,
  type IndicatorDrawParams,
  IndicatorSeries,
  type IndicatorTemplate,
  type PolygonAttrs
} from 'jkn-kline-chart'
import { candlestickToRaw } from './utils'
import { inRange, isNumber, title } from 'radash'
import Decimal from 'decimal.js'

type LocalIndicatorExtend = {
  name: string
}

export const localIndicator: IndicatorTemplate<IndicatorData, any, LocalIndicatorExtend> = {
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

    const r = await calcIndicator(
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
  createTooltipDataSource: ({ indicator, crosshair }) => {
    const data = indicator.result.filter(d => d.name)
    return {
      name: (indicator.extendData as LocalIndicatorExtend).name,
      icons: [],
      legends: data.map((d, index, arr) => ({
        title: { text: `${d.name!}: `, color: d.color },
        value: {
          text: isNumber(arr[index].drawData[crosshair.dataIndex!])
            ? Decimal.create(arr[index].drawData[crosshair.dataIndex!] as any).toFixed(3)
            : '',
          color: d.color
        }
      })),
      calcParamsText: ''
    }
  },
  draw: params => {
    const { ctx, chart, indicator, xAxis, yAxis } = params
    const { realFrom, realTo } = chart.getVisibleRange()
    const result = indicator.result as unknown as IndicatorData[]
    if (!result) return false

    result.forEach(d => {
      if (d.draw === '') {
        drawLine(params, {
          color: d.color,
          data: d.drawData,
          type: d.lineType,
          width: d.width
        })
      } else if (d.draw === 'STICKLINE') {
        const Rect = getFigureClass('rect')!
        d.drawData.forEach(item => {
          if (inRange(item.x, realFrom, realTo)) {
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
      } else if (d.draw === 'DRAWTEXT') {
        drawText(params, { color: d.color, data: d.drawData })
      } else if (d.draw === 'DRAWICON') {
        drawIcon(params, { data: d.drawData })
      } else if (d.draw === 'DRAWBAND') {
        const points = d.drawData.map(d => {
          const leftArr: { x: number; y: number }[] = []
          const rightArr: typeof leftArr = []
          d.points.forEach((p, index, arr) => {
            if (p.drawX && p.drawY && index === 0) {
              leftArr.push({ x: p.drawX, y: p.drawY })
              rightArr.push({ x: p.drawX, y: p.drawY })
            }

            if (p.drawX && p.drawY && index === arr.length - 1) {
              leftArr.push({ x: p.drawX, y: p.drawY })
              rightArr.push({ x: p.drawX, y: p.drawY })
            } else {
              leftArr.push({ x: p.x, y: p.y1 })
              rightArr.push({ x: p.x, y: p.y2 })
            }
          })
          return {
            color: d.color,
            x1: d.startIndex,
            x2: d.endIndex,
            points: leftArr.concat(rightArr.reverse())
          }
        })

        drawBand(params, { data: points })
      } else if (d.draw === 'DRAWNUMBER') {
        drawText(params, { color: d.color, data: d.drawData.map(item => ({ ...item, text: item.number })) })
      } else if (d.draw === 'DRAWRECTREL') {
      }
    })

    return true
  }
}

type DrawFunc<T> = (params: IndicatorDrawParams<any, any, any>, data: T) => void

/**
 * 线或者点
 */
type LineShape = {
  color: string
  width?: number
  type: IndicatorData['lineType']
  data: number[]
}
const drawLine: DrawFunc<LineShape> = (params, { color, width, type, data }) => {
  const Line = getFigureClass('line')!
  const Circle = getFigureClass('circle')! as FigureConstructor<CircleAttrs>
  const { realFrom, realTo } = params.chart.getVisibleRange()
  const range = data.slice(realFrom, realTo)
  if (type === 'POINTDOT') {
    range.forEach((y, x) => {
      if (y) {
        new Circle({
          name: 'circle',
          attrs: {
            x: params.xAxis.convertToPixel(x + realFrom),
            y: params.yAxis.convertToPixel(y),
            r: 2
          },
          styles: {
            color: color
          }
        }).draw(params.ctx)
      }
    })
  } else {
    new Line({
      name: 'line',
      attrs: {
        coordinates: range.map((y, x) => ({
          x: params.xAxis.convertToPixel(x + realFrom),
          y: y ? params.yAxis.convertToPixel(y) : y
        }))
      },
      styles: {
        color: color,
        size: width || 1
      }
    }).draw(params.ctx)
  }
}

/**
 * 文本
 */
type TextShape = {
  x: number
  y: number
  text: string | number
  offsetX: number
  offsetY: number
}
const drawText: DrawFunc<{ color: string; data: TextShape[] }> = (params, { color, data }) => {
  const Text = getFigureClass('text')!

  const { xAxis, yAxis } = params
  const { realFrom, realTo } = params.chart.getVisibleRange()
  data.forEach(item => {
    if (item.x < realFrom || item.x > realTo) return
    new Text({
      name: 'text',
      attrs: {
        x: xAxis.convertToPixel(item.x) + item.offsetX,
        y: yAxis.convertToPixel(item.y) + item.offsetY,
        text: item.text,
        align: 'center',
        baseline: 'middle'
      },
      styles: {
        color: color
      }
    }).draw(params.ctx)
  })

  return true
}

/**
 * 画icon
 */
type IconShape = {
  data: {
    x: number
    y: number
    icon: number
    offsetX: number
    offsetY: number
  }[]
}
const drawIcon: DrawFunc<IconShape> = (params, { data }) => {
  const Icon = getFigureClass('icon')!
  const { xAxis, yAxis } = params
  data.forEach(({ x, y, icon, offsetX, offsetY }) => {
    new Icon({
      name: 'icon',
      attrs: {
        x: xAxis.convertToPixel(x) + offsetX,
        y: yAxis.convertToPixel(y) + offsetY,
        icon: icon,
        width: 20,
        height: 20
      },
      styles: {}
    }).draw(params.ctx)
  })
}

/**
 * 画带
 *
 */
type BandShape = {
  data: {
    color: string
    x1: number
    x2: number
    points: { x: number; y: number; convertX?: boolean; convertY?: boolean }[]
  }[]
}
const drawBand: DrawFunc<BandShape> = (params, { data }) => {
  const Polygon = getFigureClass('polygon')! as FigureConstructor<PolygonAttrs>
  const { realFrom, realTo } = params.chart.getVisibleRange()
  data.forEach(({ color, x1, x2, points }) => {
    /**
     * 只有一种情况不画
     * 1. 两个点都一侧可视区域外
     */
    if ((x1 < realFrom && x2 < realFrom) || (x1 > realTo && x2 > realTo)) return
    new Polygon({
      name: 'band',
      attrs: {
        coordinates: points.map(({ x, y }) => ({
          x: params.xAxis.convertToPixel(x),
          y: params.yAxis.convertToPixel(y)
        }))
      },
      styles: {
        color: color
      }
    }).draw(params.ctx)
  })
}
