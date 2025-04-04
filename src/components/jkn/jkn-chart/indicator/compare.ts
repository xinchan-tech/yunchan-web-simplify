import { getStockChartV2 } from '@/api'
import { queryClient } from '@/utils/query-client'
import { stockUtils } from '@/utils/stock'
import {
  type FigureConstructor,
  IndicatorSeries,
  type IndicatorTemplate,
  type KLineData,
  type LineAttrs,
  type LineStyle,
  getFigureClass
} from 'jkn-kline-chart'
import type { Candlestick } from '../types'

const findNearestTime = (data: Candlestick[], time: number, gte?: boolean) => {
  if (data.length === 0) return
  if (data.length === 1)
    return {
      index: 0,
      data: data
    }

  let left = 0
  let right = data.length - 1

  while (left < right) {
    const mid = Math.floor((left + right) / 2)
    const midTime = +data[mid].timestamp!

    if (midTime === time) {
      return {
        index: mid,
        data: data[mid]
      }
    }

    if (midTime < time) {
      left = mid + 1
    } else {
      right = mid
    }
  }

  if (gte) {
    return {
      index: left,
      data: data[left]
    }
  }
  return {
    index: left - 1,
    data: data[left - 1]
  }
}

export const compareIndicator: IndicatorTemplate<any, any> = {
  name: 'compare-indicator',
  shortName: 'compare-indicator',
  zLevel: 1,
  forceRange: true,
  series: IndicatorSeries.Price,
  getValueRangeInVisibleRange(indicator, chart) {
    const { realFrom, realTo } = chart.getVisibleRange()
    const range = {
      min: Number.MAX_SAFE_INTEGER,
      max: Number.MIN_SAFE_INTEGER
    }
    const result = indicator.result[0] as { validIndex: number; data: number[]; color: string }
    if (!result) return range

    const validFrom = realFrom > result.validIndex ? realFrom : result.validIndex
    const dataList = chart.getDataList()

    const base = dataList[validFrom]?.close

    if (!base) return range

    const k = base / result.data[validFrom]

 
    result.data.slice(realFrom, realTo + 1).forEach((item) => {
      const y = item ? item * k : 0
      range.min = Math.min(range.min, y)
      range.max = Math.max(range.max, y)
    })
    return range
  },
  calcParams: ['#FF0000', '', 0, ''],
  calc: async (_dataList, indicator) => {
    if (_dataList.length === 0) return []


    const cache = indicator.extendData as Nullable<{ dataLen: number, data: [
      {
        validIndex: number
        data: KLineData[],
        color: string
      }
    ] }>

    if(cache){
      if(cache.dataLen === _dataList.length){
        console.warn('use cache')
        return cache.data
      }
    }

    const [color, symbol, interval, startAt] = indicator.calcParams
    const queryKey = [
      getStockChartV2.cacheKey,
      {
        symbol,
        interval,
        time_format: 'int'
      }
    ]

    const r = await queryClient.ensureQueryData({
      queryKey: queryKey,
      queryFn: () => {
        return getStockChartV2({
          symbol,
          period: stockUtils.intervalToPeriod(interval),
          start_at: startAt,
          time_format: 'int'
        })
      }
    })
    
    if (!r.data.list.length) return []
    
    const compareStockStart = r.data.list[0][0]! as unknown as number
 
    const startInCandlesticksIndex = findNearestTime(_dataList, compareStockStart * 1000)

    if (!startInCandlesticksIndex || startInCandlesticksIndex?.index === -1) return []

    const compareCandlesticks = new Array(startInCandlesticksIndex!.index).fill(null).concat(r.data.list.map(c => c[2]))

    const validIndex = compareCandlesticks.findIndex((x: number) => x !== null)

    const ret = [
      {
        validIndex: validIndex,
        data: compareCandlesticks,
        color: color
      }
    ]

    indicator.extendData = {
      dataLen: _dataList.length,
      data: ret
    }

    return ret
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

    const { realFrom } = chart.getVisibleRange()
    const result = indicator.result[0] as { validIndex: number; data: number[]; color: string }

    if (!result) return false
 
    const Line = getFigureClass('line')! as FigureConstructor<LineAttrs, Partial<LineStyle>>
    const validFrom = realFrom > result.validIndex ? realFrom : result.validIndex
    const dataList = chart.getDataList()

    const base = dataList[validFrom]?.close

    if (!base) return false

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
