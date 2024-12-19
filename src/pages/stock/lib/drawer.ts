import type { ECOption } from '@/utils/echarts'
import type { CustomSeriesOption, LineSeriesOption } from 'echarts/charts'
import type { KChartState } from './ctx'
import echarts from '@/utils/echarts'
import { colorUtil } from '@/utils/style'

type XAxis = number
type YAxis = number
type Width = number
type empty = 0 | 1
type DrawerColor = number
/**
 * 线型
 * 0: 实线
 * 1: 虚线
 */
export enum LineType {
  SOLID = 0,
  DASH = 1
}

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
   * 额外的数据
   */
  extra?: Record<string, any>
}

type DrawerFunc<T = any> = (options: ECOption, state: KChartState['state'][0], params: DrawerFuncOptions<T>) => ECOption

/**
 * 画一条线
 */
export const drawLine: DrawerFunc<[XAxis, number][]> = (options, _, { xAxisIndex, yAxisIndex, data, extra }) => {
  const line: LineSeriesOption = {
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    type: 'line',
    showSymbol: false,
    symbol: 'none',
    connectNulls: true,
    z: 0,
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
 * 画折线
 */
export const drawPolyline: DrawerFunc<[XAxis, YAxis, XAxis, YAxis, LineType][]> = (
  options,
  _,
  { xAxisIndex, yAxisIndex, data, extra }
) => {
  const line: CustomSeriesOption = {
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    type: 'custom',
    encode: {
      x: [0, 2],
      y: [1, 3]
    },
    renderItem: (_, api) => {
      const start = api.coord([api.value(0), api.value(1)])
      const end = api.coord([api.value(2), api.value(3)])
      const lineType = api.value(4) as LineType
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
    data: data
  }

  Array.isArray(options.series) && options.series.push(line)

  return options
}

export type DrawerTextShape = [XAxis, YAxis, string, DrawerColor]

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
export const drawText: DrawerFunc<DrawerTextShape[]> = (options, _, { xAxisIndex, yAxisIndex, data }) => {
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

      return {
        type: 'text',
        style: {
          text,
          fill: color,
          fontSize: 12,
          textAlign: 'left',
          textVerticalAlign: 'top'
        },
        z: 100,
        position: [point[0] + 2, point[1]]
      }
    },
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
export const drawRect: DrawerFunc<DrawerRectShape[]> = (options, _, { xAxisIndex, yAxisIndex, data, extra }) => {
  const extraColor = extra?.color
  const line: CustomSeriesOption = {
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    encode: {
      x: [0],
      y: [1, 2]
    },
    type: 'custom',
    renderItem: (_, api) => {
      const x = api.value(0) as number
      const y1 = api.value(1) as number
      const y2 = api.value(2) as number
      const bottom = Math.min(y1, y2)
      const yValue = Math.abs(y1 - y2)
      const start = api.coord([x, bottom])
      const width = (api.value(3) as number)
      const size = api.size!([x, yValue]) as number[]
      const empty = api.value(4) as number
      const color = (api.value(5) as string) || extraColor || '#00943c'

      return {
        type: 'rect',
        shape: {
          x: start[0] - width / 2,
          y: start[1],
          width: width,
          height: -size[1]
        },
        z: 10,
        emphasisDisabled: true,
        style: {
          fill: empty === 0 ? color : 'transparent',
          stroke: empty !== 0 ? color : 'transparent',
          lineWidth: 1
        }
      }
    },
    data: data
  }

  Array.isArray(options.series) && options.series.push(line)

  return options
}

type GradientData = {
  x: XAxis
  y: XAxis
}

/**
 * 填充渐变
 */
export const drawGradient: DrawerFunc<[XAxis, GradientData[], string[]][]> = (options, _, { xAxisIndex, yAxisIndex, data }) => {
  const right = 50
  const points = data
    .filter(item => !!item[0])
    .map((item, index) => {
      const start = item[0]
      const ps = item[1]

      const mid = ps[Math.round(ps.length / 2)]

      return [start, mid.x, index]
    })

  /**
   * 两种方法性能未知，待测试
   * 方法一
   */
  const series: CustomSeriesOption = {
    type: 'custom',
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    encode: {
      x: [0, 1],
      y: [2]
    },
    renderItem: (params, api) => {
      if (params.context.rendered) return
      params.context.rendered = true

      const rightMax = api.getWidth() - right
      const polygons: { color: string[]; points: number[][] }[] = []

      points.forEach(p => {
        const item: [XAxis, GradientData[], string[]] = data[p[2]]

        const colors = (item[2] as unknown as string[]).map(colorUtil.hexToRGBA)
        const c = ['transparent', 'transparent']
        colors.forEach((color, index) => {
          if (color) {
            c[index] = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
          }
        })

        const _points: number[][] = []

        item[1].forEach(p => {
          const po = api.coord([p.x, p.y])

          if (po[0] > rightMax) {
            po[0] = rightMax
          }

          if (po[0] < 0) {
            return
          }
          _points.push(po)
        })

        if (_points.length <= 0) {
          return
        }

        polygons.push({
          color: c,
          points: _points
        })
      })

      return {
        type: 'group',
        children: polygons.map(polygon => ({
          type: 'polygon',
          shape: {
            points: [...polygon.points]
          },
          emphasisDisabled: true,
          style: {
            fill: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: polygon.color[0]
              },
              {
                offset: 1,
                color: polygon.color[1]
              }
            ])
          }
        }))
      }
    },
    data: points
  }

  /**
   * 方法二
   */
  // const series: CustomSeriesOption = {
  //   type: 'custom',
  //   xAxisIndex: index,
  //   yAxisIndex: index,
  //   encode: {
  //     x: [0, 1],
  //     y: [2]
  //   },
  //   renderItem: (_, api) => {
  //     const y = api.value(2) as number
  //     const item: [XAxis, GradientData[], string[]] = data[y]

  //     const colors = (item[2] as unknown as string[]).map(colorUtil.hexToRGBA)
  //     const c = ['transparent', 'transparent']
  //     colors.forEach((color, index) => {
  //       if (color) {
  //         c[index] = `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
  //       }
  //     })

  //     const _points: number[][] = []
  //     const rightMax = api.getWidth() - right

  //     item[1].forEach(p => {
  //       const po = api.coord([p.x, p.y])

  //       if (po[0] > rightMax) {
  //         po[0] = rightMax
  //       }

  //       _points.push(po)
  //     })

  //     return {
  //       type: 'polygon',
  //       shape: {
  //         points: [..._points]
  //       },
  //       emphasisDisabled: true,
  //       style: {
  //         fill: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
  //           {
  //             offset: 0,
  //             color: c[0]
  //           },
  //           {
  //             offset: 1,
  //             color: c[1]
  //           }
  //         ])
  //       }
  //     }
  //   },
  //   data: points
  // }

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
export const drawPivots: DrawerFunc<DrawPivotsShape[]> = (options, _, { xAxisIndex, yAxisIndex, data }) => {
  const pivots: CustomSeriesOption = {
    xAxisIndex: xAxisIndex,
    yAxisIndex: yAxisIndex,
    encode: {
      x: [0, 2],
      y: [1, 3]
    },
    type: 'custom',
    renderItem: (_, api) => {
      const startPoint = [api.value(0), api.value(1)] as [XAxis, YAxis]
      const endPoint = [api.value(2), api.value(3)] as [XAxis, YAxis]
      const start = api.coord(startPoint)
      const end = api.coord(endPoint)
      const width = end[0] - start[0]
      const height = end[1] - start[1]
      const bgColor = api.value(5) as string
      const [positive, text, extend, mark] = (api.value(4) as string).split('_')
      const color = api.value(6) as string
      const offset = extend === '1' ? 5 : 0

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
            z: 1,
            emphasisDisabled: true,
            style: {
              // 抄客户端的逻辑
              fill: extend === '1' && text !== 'A²' ? 'transparent' : bgColor ,
              stroke: !(extend === '1' && text !== 'A²') ? 'transparent' : bgColor,
              lineDash: 'dashed',
              lineWidth: 1
            }
          }
        ]
      } as any

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
  xIndex: XAxis
  y: YAxis
  large: boolean
  buy: boolean
  positive: number
  color: string
  type: number
}

/**
 * 绘制主图买卖点
 */
export const drawTradePoints: DrawerFunc<DrawTradePointsShape[]> = (options, _, { xAxisIndex, yAxisIndex, data }) => {
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
      const height = !buy ? -40 : 40

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
    data: data.map(item => [item.xIndex, item.y, item.large, item.buy, item.positive, item.color, item.type])
  }

  Array.isArray(options.series) && options.series.push(series)

  return options
}