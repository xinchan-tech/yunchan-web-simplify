import { dateUtils } from '@/utils/date'
import { FigureConstructor, getFigureClass, IndicatorSeries, type IndicatorTemplate } from 'jkn-kline-chart'
import { MarkOverlayAttrs } from '../figure'
import { inRange } from 'radash'
import { getStockTabData } from '@/api'
import { queryClient } from '@/utils/query-client'
import dayjs from 'dayjs'

export const markIndicator: IndicatorTemplate<any, any> = {
  name: 'mark-indicator',
  shortName: 'mark-indicator',
  zLevel: 1,
  series: IndicatorSeries.Price,
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

    const ret: Array<{ x: number; y: number; date: string; title: string }> = []
    let index = res[type].length - 1

    _dataList.forEach(item => {
      const data = res[type][index]
      const _date = dateUtils.toUsDay(data.date).hour(0).minute(0).second(0)
      console.log(_date.valueOf(), item.timestamp)
      if (item.timestamp > _date.valueOf()) {
        index--
      } else {
        return
      }
    })

    console.log(index, res, _dataList)

    if (index < 0) return []

    _dataList.forEach(item => {
      if (index < 0) return
      const data = res[type][index]
      const _date = dateUtils.toUsDay(data.date).hour(0).minute(0).second(0)

      if (dateUtils.timeEqual(_date, item.timestamp)) {
        ret.push({
          x: index,
          y: item.high,
          date: data.date,
          title: data.event_zh
        })
        index--
      }
    })

    return ret
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

    const Markoverlay = getFigureClass('mark-overlay')! as FigureConstructor<MarkOverlayAttrs>

    const { realFrom, realTo } = chart.getVisibleRange()
    console.log(indicator.result)
    indicator.result.forEach(item => {
      if (!inRange(item.x, realFrom, realTo)) return

      new Markoverlay({
        name: 'mark-overlay',
        attrs: {
          x: xAxis.convertToPixel(item.x),
          y1: yAxis.convertToPixel(item.y),
          y2: yAxis.convertToPixel(bounding.top),
          date: item.date,
          title: item.title
        },
        styles: {}
      }).draw(ctx)
    })

    return true
  }
}
