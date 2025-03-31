import { getStockTabData } from '@/api'
import { dateUtils } from '@/utils/date'
import { queryClient } from '@/utils/query-client'
import { type FigureConstructor, IndicatorSeries, type IndicatorTemplate, getFigureClass } from 'jkn-kline-chart'
import { inRange } from 'radash'
import type { MarkOverlayAttrs } from '../figure'
import { findEqualTime } from '../utils'

let markOverlayCache: { x: number; y: number; width: number; height: number }[] = []

export const markIndicator: IndicatorTemplate<any, any> = {
  name: 'mark-indicator',
  shortName: 'mark-indicator',
  zLevel: 1,
  series: IndicatorSeries.Price,
  onClickCheck(e) {
    const { x, y } = e
    for (const item of markOverlayCache) {
      if (inRange(x, item.x, item.x + item.width) && inRange(y, item.y, item.y + item.height)) {
        if(this.onClick){
          this.onClick(this.id as any)
        }
        return true
      }
    }
    return false
  },
  calcParams: ['', '', ''],
  calc: async (_dataList, indicator) => {
    const [symbol, type, mark] = indicator.calcParams

    if (!mark || !symbol || !type) return []

    const queryKey = [
      getStockTabData.cacheKey,
      {
        type,
        mark,
        symbol
      }
    ]

    const res = await queryClient.ensureQueryData({
      queryKey: queryKey,
      queryFn: () => {
        return getStockTabData({ param: { [type]: [mark] }, ticker: symbol, start: '2010-01-01' })
      },
      revalidateIfStale: true
    })

    const ret: Array<{ x: number; y: number; title: string }> = []

    res[type].forEach(item => {
      const data = findEqualTime(_dataList, dateUtils.toUsDay(item.date).hour(0).minute(0).second(0).valueOf())

      if (!data) return

      ret.push({
        x: data.timestamp,
        y: data.close,
        title: item.event_zh
      })
    })

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
    markOverlayCache = []
    const MarkOverlay = getFigureClass('mark-overlay')! as FigureConstructor<MarkOverlayAttrs>

    const { realFrom, realTo } = chart.getVisibleRange()
    const fromPixel = xAxis.convertToPixel(realFrom)
    const toPixel = xAxis.convertToPixel(realTo)
    indicator.result.forEach(item => {
      const xPixel = xAxis.convertTimestampToPixel(item.x)
      if (!inRange(xPixel, fromPixel, toPixel)) return
      const y1 = yAxis.convertToPixel(item.y)
      new MarkOverlay({
        name: 'mark-overlay',
        attrs: {
          x: xPixel,
          y: y1,
          date: dateUtils.toUsDay(item.x).format('YYYY-MM-DD'),
          title: item.title,
          cb(rect) {
            markOverlayCache.push({
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height
            })
          }
        },
        styles: {}
      }).draw(ctx)
    })

    return true
  }
}
