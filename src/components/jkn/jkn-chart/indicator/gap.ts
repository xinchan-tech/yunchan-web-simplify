import { type FigureConstructor, getFigureClass, IndicatorSeries, type KLineData, PolygonType, type RectAttrs, type RectStyle, type IndicatorTemplate } from "jkn-kline-chart"


export const gapIndicator: IndicatorTemplate<any, any> = {
  name: 'gap-indicator',
  shortName: 'gap-indicator',
  zLevel: -1,
  series: IndicatorSeries.Normal,
  calcParams: [1],
  calc: async (dataList) => {
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

    const {from, to} = params.chart.getVisibleRange()

    const data = result.slice(from, to)
    const Rect = getFigureClass('rect') as FigureConstructor<RectAttrs, Partial<RectStyle>>

    let c = 0
    const gap: {
      low: number
      high: number
      direction: 'up' | 'down'
      start: number
    }[] = []

    let min = Number.MAX_SAFE_INTEGER
    let max = Number.MIN_SAFE_INTEGER
    
    data.reverse().forEach((d, i) => {
      const {low, high} = d

      if(min > high){
        gap.push({
          low: high,
          high: min,
          direction: 'down',
          start: i
        })
      }else if(max < low){
        gap.push({
          low: high,
          high: max,
          direction: 'up',
          start: i
        })
      }else {
        min = Math.min(min, low)
        max = Math.max(max, high)
      }
      // if(c >= count){
      //   return
      // }
      // const prev = data[i + 1]
      // if(prev){
      //   if(d.high < prev.low || d.low > prev.high){
      //     c++

      //     const startX = params.xAxis.convertTimestampToPixel(prev.timestamp)
      //     const endX = params.xAxis.convertTimestampToPixel(result[result.length - 1].timestamp)

      //     let bottom = 0
      //     let top = 0
          

      //     if(d.low > prev.high){
      //       bottom = params.yAxis.convertToPixel(prev.high)
      //       top = params.yAxis.convertToPixel(d.low)
      //     }else if(d.high < prev.low){
      //       bottom = params.yAxis.convertToPixel(d.high)
      //       top = params.yAxis.convertToPixel(prev.low)
      //     }

      //     new Rect({
      //       name: 'gapRect',
      //       attrs: {
      //         x: startX,
      //         y: top,
      //         width: endX - startX,
      //         height: bottom - top
      //       },
      //       styles: {
      //         color: 'rgba(127.5, 127.5, 127.5,0.2)',
      //         style: PolygonType.Fill
      //       }
      //     }).draw(params.ctx)
      //   }
      // }
    })

    console.log(gap)

    return true
  }
}
