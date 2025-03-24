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
    
    data.reverse().forEach((d, i) => {
      if(c >= count){
        return
      }
      const prev = data[i + 1]
      if(prev){
        if(d.high < prev.low || d.low > prev.high){
          c++

          const startX = params.xAxis.convertTimestampToPixel(prev.timestamp)
          const endX = params.xAxis.convertTimestampToPixel(result[result.length - 1].timestamp)

          let bottom = 0
          let top = 0
          

          if(d.low > prev.high){
            bottom = params.yAxis.convertToPixel(prev.high)
            top = params.yAxis.convertToPixel(d.low)
          }else if(d.high < prev.low){
            bottom = params.yAxis.convertToPixel(d.high)
            top = params.yAxis.convertToPixel(prev.low)
          }

          new Rect({
            name: 'gapRect',
            attrs: {
              x: startX,
              y: top,
              width: endX - startX,
              height: bottom - top
            },
            styles: {
              color: 'rgba(127.5, 127.5, 127.5,0.2)',
              style: PolygonType.Fill
            }
          }).draw(params.ctx)
        }
      }
    })

    return true
  }
}
