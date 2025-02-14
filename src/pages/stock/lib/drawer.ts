import type { ECOption } from '@/utils/echarts'
import echarts from '@/utils/echarts'
import { colorUtil } from '@/utils/style'
import type { CustomSeriesOption, LineSeriesOption, ScatterSeriesOption } from 'echarts/charts'
import type { GraphicComponentOption } from 'echarts/components'
import type { EChartsType } from 'echarts/core'
import type { KChartContext } from './ctx'
import { renderUtils } from './utils'

type XAxis = number
type YAxis = number
type Width = number
type empty = 0 | 1
type DrawerColor = string
/**
 * 线型
 * 0: 实线
 * 1: 虚线
 */
export enum LineType {
  SOLID = 0,
  DASH = 1
}

/**
 * X轴一个TICK和指标宽度的比例
 * x轴一个Tick默认是8
 * 指标宽度默认是10
 */
const TICK_WIDTH_PERCENT = 1.8

type DrawerFuncOptions<T = any> = {
  /**
   * @deprecated
   * 画在第几个数据集上
   */
  index?: number
  /**
   * X轴序号
   */
  xAxisIndex: number
  /**
   * Y轴序号
   */
  yAxisIndex: number
  /**
   * 对应的数据
   */
  data: T
  /**
   * 数据名称
   */
  name?: string
  /**
   * 额外的数据
   */
  extra?: {
    /**
     * 颜色
     */
    color?: string
    /**
     * 线型
     */
    type?: 'solid' | 'dotted' | 'dashed'
    /**
     * z轴
     */
    z?: number
    /**
     * 序列
     */
    seriesId?: string
    /**
     * bgColor
     */
    bgColor?: string
  }
  /**
   *
   */
  chart?: EChartsType
}

type DrawerFunc<T = any> = (
  options: ECOption,
  state: KChartContext['state'][0],
  params: DrawerFuncOptions<T>
) => ECOption

/**
 * 画一条线
 */
export const drawLine: DrawerFunc<[XAxis, number | null][]> = (
  options,
  _,
  { xAxisIndex, yAxisIndex, data, extra, name }
) => {
  const line: LineSeriesOption = {
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    name,
    type: 'line',
    showSymbol: false,
    symbol: 'none',
    z: extra?.z ?? 0,
    id: extra?.seriesId,
    silent: true,
    emphasis: {
      disabled: true
    },
    color: extra?.color,
    lineStyle: {
      type: extra?.type ?? 'solid'
    },
    data: [...data.map(item => item[1])]
  }

  Array.isArray(options.series) && options.series.push(line)

  return options
}

/**
 * 水平线
 */
export const drawHLine: typeof drawLine = (options, _, { xAxisIndex, yAxisIndex, data, extra, name }) => {
  const grid = Array.isArray(options.grid) ? options.grid : [options.grid]
  const left = grid[0] ? (grid[0].left as number) : 0

  const maxRight = left + (grid[0] ? (grid[0].width as number) : 0)

  const currentGrid = grid[yAxisIndex - 2]

  const line: CustomSeriesOption = {
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    name,
    type: 'custom',
    id: extra?.seriesId,
    renderItem: (params, _) => {
      if (params.context.rendered) return
      params.context.rendered = true

      return {
        type: 'line',
        shape: {
          x1: left,
          y1: (currentGrid!.top as number) + 20,
          x2: maxRight,
          y2: (currentGrid!.top as number) + 20
        },
        emphasisDisabled: true,
        z: extra?.z ?? 0,
        style: {
          stroke: extra?.color,
          lineDash: extra?.type ?? 'solid',
          lineWidth: 1
        }
      }
    },
    data: data
  }

  Array.isArray(options.series) && options.series.push(line)

  return options
}

/**
 * 画折线
 */
export const drawPolyline: DrawerFunc<[XAxis, YAxis, XAxis, YAxis, LineType][]> = (
  options,
  _,
  { xAxisIndex, yAxisIndex, data, extra, name }
) => {
  const grid = Array.isArray(options.grid) ? options.grid : [options.grid]
  const left = grid[0] ? (grid[0].left as number) : 0

  const maxRight = left + (grid[0] ? (grid[0].width as number) : 0)

  const line: CustomSeriesOption = {
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    type: 'custom',
    id: extra?.seriesId,
    encode: {
      x: [0, 2],
      y: [1, 3]
    },
    renderItem: (_, api) => {
      const start = api.coord([api.value(0), api.value(1)])
      const end = api.coord([api.value(2), api.value(3)])
      const lineType = api.value(4) as LineType

      if (maxRight > 0 && end[0] > maxRight) {
        //计算y轴角度
        const angle = Math.atan((end[1] - start[1]) / (end[0] - start[0]))
        //计算 maxRight 对应的 y
        const y = (maxRight - start[0]) * Math.tan(angle) + start[1]

        end[0] = maxRight
        end[1] = y
      }

      if (start[0] < left) {
        //计算y轴角度
        const angle = Math.atan((end[1] - start[1]) / (end[0] - start[0]))
        //计算 maxRight 对应的 y
        const y = (left - start[0]) * Math.tan(angle) + start[1]

        start[0] = left
        start[1] = y
      }

      return {
        type: 'line',
        shape: {
          x1: start[0],
          y1: start[1],
          x2: end[0],
          y2: end[1]
        },
        emphasisDisabled: true,
        z: 100,
        z2: 1,
        style: {
          stroke: extra?.color,
          lineDash: lineType === LineType.DASH ? 'dashed' : 'solid',
          lineWidth: 1
        }
      }
    },
    name,
    data: data
  }

  Array.isArray(options.series) && options.series.push(line)

  return options
}

export type DrawerTextShape = [XAxis, YAxis, string, DrawerColor, number, number]

/**
 * 文本
 * 值类型为 [x, y, text]
 * @param options echarts配置
 * @param state 当前窗口状态
 * @param opts 画图参数
 * @param opts.index 画在第几个数据集上
 * @param opts.data 对应的数据
 * @param opts.extra 额外的数据
 * @returns echarts配置
 *
 * @example ['2030-01-01', 111380, 'text', '#00943c']
 *
 */
export const drawText: DrawerFunc<DrawerTextShape[]> = (options, _, { xAxisIndex, yAxisIndex, data, name }) => {
  const line: CustomSeriesOption = {
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    type: 'custom',
    renderItem: (_, api) => {
      const x = api.value(0)
      const y = api.value(1) as number
      const text = api.value(2) as string
      const point = api.coord([x, y])
      const color = (api.value(3) as string) ?? '#00943c'
      const yOffset = -api.value(5) as number
      const xOffset = api.value(4) as number

      return {
        type: 'text',
        emphasisDisabled: true,

        silent: true,
        style: {
          text,
          fill: color,
          fontSize: 12,
          textAlign: 'center',
          textVerticalAlign: 'middle'
        },
        z: 100,
        position: [point[0] + xOffset, point[1] + yOffset]
      }
    },
    name,
    data: data
  }

  Array.isArray(options.series) && options.series.push(line)

  return options
}

export type DrawerRectShape = [XAxis, YAxis, YAxis, Width, empty, DrawerColor]

/**
 * 画一个矩形
 * 值类型为 [x, bottom, top, width, empty, color]
 * x: x轴坐标
 * bottom: 底部y轴坐标
 * top: 顶部y轴坐标
 * width: 宽度
 * empty: 是否为空
 * color: 颜色
 * @example ['2030-01-01', 0, 111380, 0.8, 0]
 */
export const drawRect: DrawerFunc<DrawerRectShape[]> = (options, _, { xAxisIndex, yAxisIndex, data, extra, name }) => {
  const grid = renderUtils.getGridIndex(options, 0)
  const left = (grid?.left ?? 1) + 6

  const maxRight = left + (grid?.width ?? 0) - 6

  const extraColor = extra?.color
  const line: CustomSeriesOption = {
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    encode: {
      x: [0],
      y: [1, 2]
    },
    type: 'custom',
    renderItem: (params, api) => {
      if (!params.context.tickWidth) {
        params.context.tickWidth = (api.size!([1, 0]) as number[])[0]
      }
      const startX = api.value(0) as number
      const startY = api.value(1) as number
      const y2 = api.value(2) as number

      const start = api.coord([startX, startY])
      const size = api.size!([0, Math.abs(y2 - startY)]) as number[] as number[]
      const height = size[1]
      let width = ((api.value(3) as number) / TICK_WIDTH_PERCENT) * (params.context.tickWidth as number)
      // let width = api.value(3) as number
      const empty = api.value(4) as number
      const color = (api.value(5) as string) || extraColor || '#fff'
      if (start[0] + width / 2 > maxRight) {
        width = maxRight - start[0]
      }

      return {
        type: 'rect',
        shape: {
          x: start[0] - width / 2,
          y: start[1],
          width: width,
          height: -((y2 - startY) / Math.abs(y2 - startY)) * height
        },
        z: 30,
        emphasisDisabled: true,
        style: {
          fill: empty === 0 ? color : 'transparent',
          stroke: empty !== 0 ? color : 'transparent',
          lineWidth: 1
        }
      }
    },
    name: name,
    data: data
  }

  Array.isArray(options.series) && options.series.push(line)

  return options
}

type GradientData = [number, number, number, number, [number, number][], string, string]
/**
 * 填充渐变
 */
export const drawGradient: DrawerFunc<GradientData[]> = (options, _, { xAxisIndex, yAxisIndex, data, name }) => {
  const grid = renderUtils.getGridIndex(options, 0)
  const left = grid?.left ?? 1

  const maxRight = left + (grid?.width ?? 0)

  const series: CustomSeriesOption = {
    type: 'custom',
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    encode: {
      x: [0, 1],
      y: [2, 3]
    },
    renderItem: (_, api) => {
      // if (params.context.rendered) return
      // params.context.rendered = true

      // const polygons: { color: string[]; points: number[][] }[] = []
      // const rawPoints = api.ordinalRawValue(4) as unknown as [number, number][]
      const rawPoints = api.value(4) as string
      const color1 = api.value(5) as string
      const color2 = api.value(6) as string

      // console.log(
      const points = rawPoints.split(',').map(p => {
        let [x, y] = api.coord(p.split('-').map(Number))

        if (x > maxRight) {
          x = maxRight
        }
        if (x < left) {
          x = left
        }

        return [x, y]
      })

      return {
        type: 'polygon',
        shape: {
          points: points
        },
        emphasisDisabled: true,
        silent: true,
        style: {
          fill: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            {
              offset: 0,
              color: color1
            },
            {
              offset: 1,
              color: color2
            }
          ])
        }
      }
    },
    name,
    data: data.map(item => {
      const pointStr = item[4].map(p => p.join('-')).join(',') as any
      return [item[0], item[1], item[2], item[3], pointStr, item[5], item[6]]
    })
  }

  Array.isArray(options.series) && options.series.push(series)

  // console.log(data
  //   .filter(item => !!item[0]))

  return options
}

type DrawPivotsShape = {
  start: [XAxis, YAxis]
  end: [XAxis, YAxis]
  bgColor: string
  mark: string
  color: string
}

/**
 * 绘制主图中枢区域
 */
export const drawPivots: DrawerFunc<DrawPivotsShape[]> = (options, _, { xAxisIndex, yAxisIndex, data, name }) => {
  const grid = Array.isArray(options.grid) ? options.grid : [options.grid]
  const left = (grid[0] ? (grid[0].left as number) : 0) + 6

  const maxRight = left + (grid[0] ? (grid[0].width as number) : 0) - 6

  const pivots: CustomSeriesOption = {
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    encode: {
      x: [0, 2],
      y: [1, 3]
    },
    z: 1,
    type: 'custom',
    renderItem: (_, api) => {
      const startPoint = [api.value(0), api.value(1)] as [XAxis, YAxis]
      const endPoint = [api.value(2), api.value(3)] as [XAxis, YAxis]
      const start = api.coord(startPoint)

      if (start[0] < left) {
        start[0] = left
      }

      const end = api.coord(endPoint)
      let width = end[0] - start[0]
      const height = end[1] - start[1]
      const bgColor = api.value(5) as string
      const [positive, text, extend, mark] = (api.value(4) as string).split('_')
      const color = api.value(6) as string
      const offset = extend === '1' ? 5 : 0

      if (end[0] > maxRight) {
        width = maxRight - start[0]
      }

      const group = {
        type: 'group',
        emphasisDisabled: true,
        children: [
          {
            type: 'rect',
            shape: {
              x: start[0] - offset,
              y: start[1] + offset,
              width: width + offset * 2,
              height: height - offset * 2
            },
            emphasisDisabled: true,
            style: {
              // 抄客户端的逻辑
              fill: extend === '1' && text !== 'A²' ? 'transparent' : bgColor,
              stroke: !(extend === '1' && text !== 'A²') ? 'transparent' : bgColor,
              lineDash: 'dashed',
              lineWidth: 1
            }
          }
        ]
      } as any

      if (end[0] + 28 < maxRight) {
        group.children.push({
          type: 'text',
          emphasisDisabled: true,
          style: {
            text: `${positive}${text}`,
            fill: color,
            font: 'bold 24px SimHei',
            textVerticalAlign: 'bottom'
          },
          position: [end[0] + 4, start[1]]
        })
      }

      if (mark) {
        group.children.push({
          type: 'text',
          emphasisDisabled: true,
          style: {
            text: mark,
            fill: color,
            font: 'bold 12px SimHei',
            textVerticalAlign: 'bottom'
          },
          position: [end[0] + 44, start[1] - 10]
        })
      }

      return group
    },
    name,
    data: data.map(item => [
      item.start[0],
      item.start[1],
      item.end[0],
      item.end[1],
      item.mark,
      item.bgColor,
      item.color
    ])
  }

  Array.isArray(options.series) && options.series.push(pivots)

  return options
}

type DrawTradePointsShape = {
  index: XAxis
  price: YAxis
  large: boolean
  buy: number
  positive: number
  color: string
  type: number
}

/**
 * 绘制主图买卖点
 */
export const drawTradePoints: DrawerFunc<DrawTradePointsShape[]> = (
  options,
  _,
  { xAxisIndex, yAxisIndex, data, name }
) => {
  const series: CustomSeriesOption = {
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    encode: {
      x: [0],
      y: [1]
    },
    type: 'custom',
    renderItem: (_, api) => {
      const x = api.value(0) as number
      const y = api.value(1) as number
      const type = api.value(6) as string
      const buy = api.value(3) as number
      const height = !buy ? -30 : 30

      const start = api.coord([x, y])
      const cStart = [start[0], start[1] + height + (!buy ? -12 : 12)]
      const color = api.value(5) as string

      return {
        type: 'group',
        children: [
          {
            type: 'line',
            shape: {
              x1: start[0],
              y1: start[1],
              x2: start[0],
              y2: start[1] + height
            },
            z2: 10,
            style: {
              stroke: color,
              lineDash: 'dashed',
              lineWidth: 1
            }
          },
          {
            type: 'circle',
            shape: {
              cx: cStart[0],
              cy: cStart[1],
              r: 12
            },
            z2: 10,
            style: {
              fill: color
            }
          },
          {
            type: 'text',
            position: [cStart[0], cStart[1]],
            z2: 10,
            style: {
              text: type + (buy ? '买' : '卖'),
              // text: x.toString(),
              fill: '#fff',
              font: 'bold 12px SimHei',
              textAlign: 'center',
              textVerticalAlign: 'middle'
            }
          }
        ]
      }
    },
    name,
    data: data.map(item => [item.index, item.price, item.large, item.buy, item.positive, item.color, item.type])
  }

  Array.isArray(options.series) && options.series.push(series)

  return options
}

type YOffset = number
type Text = string
type FontSize = number
/**
 * 神奇九转数字
 */
export const drawNumber = (
  options: ECOption,
  params: DrawerFuncOptions<[XAxis, YAxis, Text, YOffset, FontSize, DrawerColor]>
) => {
  const custom: CustomSeriesOption = {
    xAxisIndex: params.xAxisIndex,
    yAxisIndex: params.yAxisIndex,
    encode: {
      x: [0],
      y: [1]
    },
    type: 'custom',
    renderItem: (_, api) => {
      const x = api.value(0) as number
      const y = api.value(1) as number
      const text = api.value(2) as string
      const yOffset = api.value(4) as number
      const _yOffset = -yOffset
      const xOffset = api.value(3) as number
      const color = api.value(5) as string

      const point = api.coord([x, y])

      return {
        type: 'text',
        silent: true,
        emphasisDisabled: true,
        style: {
          text,
          fill: color ?? '#00943c',
          fontSize: 16,
          textAlign: 'center',
          textVerticalAlign: 'middle'
        },
        position: [point[0] + xOffset, point[1] + _yOffset]
      }
    },
    name: params.name,
    data: params.data
  }

  Array.isArray(options.series) && options.series.push(custom)
}

type DrawHdlyLabelShape = {
  index: XAxis
  yAxis: YAxis
  label: string
}

/**
 * 绘制海底捞月标签
 */
export const drawHdlyLabel: DrawerFunc<DrawHdlyLabelShape[]> = (options, _, { xAxisIndex, yAxisIndex, data, name }) => {
  const series: CustomSeriesOption = {
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    encode: {
      x: [0],
      y: [1]
    },
    type: 'custom',
    renderItem: (_, api) => {
      const x = api.value(0) as number
      const y = api.value(1) as number
      const label = api.value(2) as string
      const singleLabelWidth = 12
      const height = 22
      const width = singleLabelWidth * label.length + 8

      const start = api.coord([x, y])

      return {
        type: 'group',
        children: [
          {
            type: 'rect',
            shape: {
              x: start[0] - width / 2,
              y: start[1] - height / 2,
              width,
              height,
              r: 4
            },
            z2: 10,
            style: {
              fill: '#ff0066'
            }
          },
          {
            type: 'text',
            position: [start[0], start[1]],
            z2: 10,
            style: {
              text: label,
              // text: x.toString(),
              fill: '#fff',
              font: 'bold 12px SimHei',
              textAlign: 'center',
              textVerticalAlign: 'middle'
            }
          }
        ]
      }
    },
    name,
    data: data.map(item => [item.index, item.yAxis, item.label])
  }

  Array.isArray(options.series) && options.series.push(series)
  return options
}

type DrawScatterShape = {
  x: XAxis
  y: YAxis
}

/**
 * 画散点图
 */
export const drawScatter: DrawerFunc<DrawScatterShape[]> = (
  options,
  _,
  { xAxisIndex, yAxisIndex, data, extra, name }
) => {
  const scatter: ScatterSeriesOption = {
    type: 'scatter',
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    silent: true,
    symbolSize: 3,
    name,
    data: data.map(item => ({
      value: [item.x, item.y],
      itemStyle: {
        color: extra?.color
      },
      emphasis: {
        disabled: true
      }
    }))
  }
  // console.log(data)
  Array.isArray(options.series) && options.series.push(scatter)
  return options
}

/**
 * 画一个固定位置的矩形
 * 传的坐标是以一个width = 1000, height = 1000的画布为基准
 * 需要转换坐标系
 */
type DrawRectRelShape = {
  leftTop: { x: number; y: number }
  rightBottom: { x: number; y: number }
  color: string
}
export const drawRectRel: DrawerFunc<DrawRectRelShape[]> = (options, _, { xAxisIndex, data, name }) => {
  const grid = renderUtils.getGridIndex(options, Math.max(xAxisIndex - 2, 0))
  const gridHeight = grid?.height ?? 0
  const gridWidth = grid?.width ?? 0
  const gridLeftTop = { x: grid?.left ?? 0, y: grid?.top ?? 0 }
  // const gridRightBottom = { x: gridLeftTop.x + gridWidth, y: gridLeftTop.y + gridHeight }

  const rects: GraphicComponentOption[] = []

  data.forEach((d, index) => {
    const transformLeftTopX = (d.leftTop.x / 1000) * gridWidth + gridLeftTop.x
    const transformLeftTopY = (d.leftTop.y / 1000) * gridHeight + gridLeftTop.y
    const rectWidth = ((d.rightBottom.x - d.leftTop.x) / 1000) * gridWidth
    const rectHeight = ((d.rightBottom.y - d.leftTop.y) / 1000) * gridHeight

    const rect: GraphicComponentOption = {
      type: 'rect',
      silent: true,
      name: `graphic-rect-${name}-${index}`,
      z: 10,
      shape: {
        x: transformLeftTopX,
        y: transformLeftTopY,
        width: rectWidth,
        height: rectHeight
      },
      style: {
        fill: colorUtil.rgbaToString(colorUtil.hexToRGBA(d.color))
      }
    }

    rects.push(rect)
  })

  renderUtils.addGraphic(options, rects)

  return options
}

const iconContext = import.meta.webpackContext('@/assets/icon/script_icons')

type DrawIconShape = {
  x: XAxis
  y: YAxis
  iconId: number, 
  offsetX: number
  offsetY: number
}

export const drawIcon: DrawerFunc<DrawIconShape[]> = (
  options,
  _,
  { xAxisIndex, yAxisIndex, data, name }
) => {
  const scatter: ScatterSeriesOption = {
    type: 'scatter',
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    silent: true,
    symbolSize: 20,
    name,
    data: data.map(item => ({
      value: [item.x, item.y],
      symbol: `image://${iconContext(`./draw_${item.iconId}.png`)}`,
      emphasis: {
        disabled: true
      },
      symbolOffset: [item.offsetX, item.offsetY],
    }))
  }
  // console.log(data)
  Array.isArray(options.series) && options.series.push(scatter)
  return options

}
