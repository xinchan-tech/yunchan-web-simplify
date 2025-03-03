import type { AxisTemplate, KLineData } from "jkn-kline-chart"

export type AxisPosition = NonNullable<AxisTemplate['position']>

export type Candlestick = KLineData

/**
 * 指标数据
 */
export type IndicatorData =
  | (
      | IndicatorDataLine
      | IndicatorDataDrawGradient
      | IndicatorDataDrawStickLine
      | IndicatorDataDrawText
      | IndicatorDataDrawNumber
      | IndicatorDataDrawRectRel
      | IndicatorDataDrawIcon
      | IndicatorDataDrawBand
    )[]
  | undefined
type DrawFunc = '' | 'STICKLINE' | 'DRAWTEXT' | 'DRAWGRADIENT' | 'DRAWNUMBER' | 'DRAWRECTREL' | 'DRAWICON' | 'DRAWBAND'
type IndicatorDataBase<T extends DrawFunc> = {
  draw: T
  color: string
  linethick: number
  name?: string
  style_type?: string
}

type IndicatorDataLine = IndicatorDataBase<''> & {
  data: [number, number][]
}
type IndicatorDataDrawStickLine = IndicatorDataBase<'STICKLINE'> & {
  draw_data: Record<number, [number, number, number, number]>
}
type IndicatorDataDrawText = IndicatorDataBase<'DRAWTEXT'> & {
  draw_data: {
    x: number
    y: number
    drawY: number
    text: string
    offsetX: number
    offsetY: number
  }[]
}
/**
 * 一个渐变的多边形
 * 值类型为 [startX, endX, minY, maxY, [number, number][], color1, color2]
 * startX: 多边形起始x轴坐标
 * endX: 多边形结束x轴坐标
 * minY: 多边形最小y轴坐标
 * maxY: 多边形最大y轴坐标
 * [number, number][]: 多边形的点，每个点是一个数组，第一个元素是x轴坐标，第二个元素是y轴坐标
 * color1: 颜色1
 * color2: 颜色2
 */
type IndicatorDataDrawGradient = IndicatorDataBase<'DRAWGRADIENT'> & {
  draw_data: [number, number, number, number, [number, number][], string, string][]
}
type IndicatorDataDrawNumber = IndicatorDataBase<'DRAWNUMBER'> & {
  draw_data: {
    x: number
    y: number
    drawY: number
    number: number
    offsetX: number
    offsetY: number
  }[]
}
type IndicatorDataDrawBand = IndicatorDataBase<'DRAWBAND'> & {
  draw_data: {
    polygonIndex: number
    x: number
    y: number
    polygon?: {
      color: string
      points: {
        x: number
        drawY: number
      }[]
    }
  }[]
}
/**
 * 一个固定位置的矩形
 * 值类型为 [leftTopX, leftTopY, rightBottomX, rightBottomY, color]
 * leftTopX: 矩形左上角x轴坐标
 * leftTopY: 矩形左上角y轴坐标
 * rightBottomX: 矩形右下角x轴坐标
 * rightBottomY: 矩形右下角y轴坐标
 * color: 颜色
 */
type IndicatorDataDrawRectRel = IndicatorDataBase<'DRAWRECTREL'> & {
  draw_data: Record<number, [number, number, number, number, string]>
}
type IndicatorDataDrawIcon = IndicatorDataBase<'DRAWICON'> & {
  draw_data: {
    x: number
    y: number
    drawY: number
    icon: number
    offsetX: number
    offsetY: number
  }[]
}