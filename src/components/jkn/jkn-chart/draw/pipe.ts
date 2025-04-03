import {
  type FigureConstructor,
  type IndicatorDrawParams,
  PolygonType,
  type RectAttrs,
  type RectStyle,
  getFigureClass
} from 'jkn-kline-chart'

type PipeShape = {
  color: string
  data: {
    width: number
    y: number
    height: number
    empty: boolean
    position: 'right' | 'left'
  }[]
}
type DrawPipeFunc = (params: IndicatorDrawParams<any, any, any>, data: PipeShape) => void

export const drawPipe: DrawPipeFunc = (params, { data, color }) => {
  const Rect = getFigureClass('rect')! as FigureConstructor<RectAttrs, Partial<RectStyle>>

  const { bar } = params.chart.getBarSpace()
  const {width: boundingWidth} = params.bounding

  const dataList = params.chart.getDataList()

  if(!dataList.length){
    return false
  }

  const lastData = dataList.slice(-1)[0]
  const first = dataList[0]

  const lastX = params.xAxis.convertTimestampToPixel(lastData.timestamp)

  const firstX = params.xAxis.convertTimestampToPixel(first.timestamp)

  data.forEach(({ width, y, height, empty, position }) => {
    let _x = 0
    let _width = 0
    if(position === 'right'){
      if(lastX > boundingWidth){
        const _offset = lastX - boundingWidth
        _width = width * bar - _offset
        _x = boundingWidth - _width
      } else {
        _width = width * bar
        _x = boundingWidth - _width
      }
    }else {
      if(firstX < 0){
        const _offset = Math.abs(firstX)
        _width = width * bar - _offset
        _x = 0
      } else {
        _width = width * bar
        _x = 0
      }
    }

    const _y = params.yAxis.convertToPixel(y)
    const _height = params.yAxis.convertToPixel(y - height) - _y
    
    new Rect({
      name: 'pipe',
      attrs: {
        x: _x,
        y: _y,
        width: _width,
        height: _height
      },
      styles: {
        color: empty ? 'transparent' : color,
        borderColor: empty ? color : 'transparent',
        style: !empty ? PolygonType.Fill : PolygonType.Stroke
      }
    }).draw(params.ctx)
  })

  // data.forEach(({ x, y, width, height, color }) => {
  //   const _width = width / designWidth
  //   const _height = height / designHeight
  //   new Rect({
  //     name: 'rectRel',
  //     attrs: {
  //       x,
  //       y,
  //       width: _width,
  //       height: _height
  //     },
  //     styles: {
  //       color: color
  //     }
  //   }).draw(params.ctx)
  // })
}
