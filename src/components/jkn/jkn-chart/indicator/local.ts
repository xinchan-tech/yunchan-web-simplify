import { useIndicator } from '@/store'
import { type IndicatorData, calcIndicator } from '@/utils/coiling'
import { aesDecrypt } from '@/utils/string'
import Decimal from 'decimal.js'
import { IndicatorSeries, type IndicatorTemplate } from 'jkn-kline-chart'
import { isNumber } from 'radash'
import { calcBottomSignal, calculateTradingPoint } from '../coiling-calc'
import {
  drawBand,
  drawGradient,
  drawHDLYLabel,
  drawHorizonLine,
  drawIcon,
  drawLine,
  drawStickLine,
  drawText
} from '../draw'
import { candlestickToRaw } from '../utils'
import { getStockIndicatorData } from "@/api"

type LocalIndicatorExtend = {
  name: string
  action?: ('visible' | 'delete')[]
  isRemote?: boolean
}

const isCoilingIndicator = (indicatorId: string) => {
  return indicatorId === '9' || indicatorId === '10'
}

export const localIndicator: IndicatorTemplate<IndicatorData, any, LocalIndicatorExtend> = {
  name: 'local-indicator',
  shortName: 'local-indicator',
  zLevel: 1,
  series: IndicatorSeries.Normal,
  calcParams: [],
  getValueRangeInVisibleRange: ({ result }, chart) => {
    let max = Number.MIN_SAFE_INTEGER
    let min = Number.MAX_SAFE_INTEGER
    const { realFrom, realTo } = chart.getVisibleRange()

    for (let i = realFrom; i < realTo; i++) {
      result.forEach((r: any) => {
        if (!r.draw) {
          const value = r.drawData[i]
          if (isNumber(value)) {
            max = Math.max(max, value)
            min = Math.min(min, value)
          }
        }
      })
    }
    return { max, min }
  },
  calc: async (dataList, indicator) => {
    const [indicatorId, symbol, interval] = indicator.calcParams as [string, string, number]
    const formula = useIndicator.getState().formula
    if(!dataList.length) return []
    const rawData = dataList.map(candlestickToRaw)

    if (isCoilingIndicator(indicatorId)) {
      if (indicatorId === '9') {
        return calcBottomSignal(rawData)
      }
      if (indicatorId === '10') {
        return calculateTradingPoint(rawData)
      }

      return []
    }

    if(indicator.extendData?.isRemote) {
      const r = await getStockIndicatorData({
        symbol,
        id: indicatorId,
        cycle: interval,
        db_type: "system"
      })
      
      return r.result.map(item => ({
        draw: item.draw as any,
        name: item.name,
        drawData: item.data,
        color: item.style?.color ?? '#fff',
        lineType: item.style?.style_type as any,
        width: item.style?.linethick ?? 1
      }))
    }

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
  createTooltipDataSource: ({ indicator, crosshair }) => {
    const data = indicator.result.filter(d => d.name)
    return {
      name: (indicator.extendData as LocalIndicatorExtend).name,
      features: [],
      legends: data.map((d, index, arr) => ({
        title: { text: `${d.name!}: `, color: d.color as string },
        value: {
          text: isNumber(arr[index].drawData?.[crosshair.dataIndex!])
            ? Decimal.create(arr[index].drawData[crosshair.dataIndex!] as any).toFixed(3)
            : '',
          color: d.color as string
        }
      })),
      calcParamsText: '',
      action: (indicator.extendData as LocalIndicatorExtend).action || []
    }
  },
  draw: params => {
    const { indicator } = params
    const result = indicator.result as unknown as IndicatorData[]
    if (!result) return false

    result.forEach(d => {
      if (d.draw === '') {
        drawLine(params, {
          color: (d.color as string) ?? '#fff',
          data: d.drawData,
          type: d.lineType,
          width: d.width
        })
      } else if (d.draw === 'STICKLINE') {
        drawStickLine(params, {
          color: d.color as string | string[],
          data: d.drawData
        })
      } else if (d.draw === 'DRAWTEXT') {
        drawText(params, { color: d.color as string, attrs: d.drawData })
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
        drawText(params, { color: d.color as string, attrs: d.drawData.map(item => ({ ...item, text: item.number })) })
      } else if (d.draw === 'DRAWRECTREL') {
      } else if (d.draw === 'HORIZONTALLINE') {
        drawHorizonLine(params, { color: d.color as string, data: d.drawData })
      } else if (d.draw === 'HDLY_LABEL') {
        drawHDLYLabel(params, { color: d.color as string, data: d.drawData })
      } else if (d.draw === 'DRAWGRADIENT') {
        drawGradient(params, d.drawData)
      }
    })

    return true
  }
}
