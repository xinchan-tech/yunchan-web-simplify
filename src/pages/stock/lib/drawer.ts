import type { ECOption } from '@/utils/echarts'
import type { CustomSeriesOption, LineSeriesOption } from 'echarts/charts'
import type { KChartState } from './ctx'
import echarts from '@/utils/echarts'
import { renderUtils } from './utils'
import { colorUtil } from "@/utils/style"

type XAxis =  number
type YAxis = number
type width = number
type empty = 0 | 1
type DrawerColor = number


type DrawerFuncOptions<T = any> = {
  /**
   * 画在第几个数据集上
   */
  index: number
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
export const drawerLine: DrawerFunc<[XAxis, number][]> = (options, _, { index, data, extra }) => {
  const line: LineSeriesOption = {
    xAxisIndex: index,
    yAxisIndex: index,
    type: 'line',
    showSymbol: false,
    connectNulls: true,
    z: 0,
    color: extra?.color,
    data: [...data.map(item => item[1])]
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
export const drawerText: DrawerFunc<DrawerTextShape[]> = (options, _, { index, data }) => {
  const line: CustomSeriesOption = {
    xAxisIndex: index,
    yAxisIndex: index,
    type: 'custom',
    renderItem: (_, api) => {
      const x = api.value(0)
      const y = api.value(1) as number
      const text = api.value(2) as string
      const point = api.coord([x, y])
      const color = api.value(3) as string ?? '#00943c'

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


export type DrawerRectShape = [XAxis, YAxis, YAxis, width, empty, DrawerColor]

/**
 * 画一个矩形
 * 值类型为 [x, bottom, top, width, empty, render]
 * @example ['2030-01-01', 0, 111380, 0.8, 0]
 */
export const drawerRect: DrawerFunc<DrawerRectShape[]> = (
  options,
  _,
  { index, data }
) => {
  const line: CustomSeriesOption = {
    xAxisIndex: index,
    yAxisIndex: index,
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
      const width = (api.value(3) as number) * ((api.size!(20) as any)[0] as number)
      const size = api.size!([x, yValue]) as number[]
      const empty = api.value(4) as number
      const color = api.value(5) as string ?? '#00943c'
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
export const drawerGradient: DrawerFunc<[XAxis, GradientData[], string[]][]> = (options, _, { index, data }) => {
  const right = Number.parseFloat(renderUtils.getGridIndex(options, index)?.right?.toString() ?? '60')

  const points: CustomSeriesOption[] = data
    .filter(item => !!item[0])
    .map(item => ({
      yAxisIndex: index,
      xAxisIndex: index,
      type: 'custom',
      encode: {
        x: [0],
        y: [1]
      },
      renderItem: (params, api) => {
        if (params.context.rendered) return
        const rightMax = api.getWidth() - right
        params.context.rendered = true

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
          _points.push(po)
        })

        return {
          type: 'polygon',
          shape: {
            points: [..._points]
          },
          emphasisDisabled: true,
          style: {
            fill: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              {
                offset: 0,
                color: c[0]
              },
              {
                offset: 1,
                color: c[1]
              }
            ])
          }
        }
      },
      data: item[1].map(p => [p.x, p.y])
    }))

  Array.isArray(options.series) && options.series.push(...points)

  return options
}
