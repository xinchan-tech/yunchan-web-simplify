import type { ECOption } from '@/utils/echarts'
import type { CustomSeriesOption, LineSeriesOption } from 'echarts/charts'
import type { KChartState } from './ctx'
import echarts from '@/utils/echarts'
import { renderUtils } from './utils'

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
export const drawerLine: DrawerFunc<[string, number][]> = (options, _, { index, data, extra }) => {
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

/**
 * 文本
 * 值类型为 [x, y, text]
 */
export const drawerText: DrawerFunc<[string, number, string, boolean][]> = (options, _, { index, data, extra }) => {
  const line: CustomSeriesOption = {
    xAxisIndex: index,
    yAxisIndex: index,
    type: 'custom',
    renderItem: (_, api) => {
      if (!api.value(3)) return null
      const x = api.value(0)
      const y = api.value(1) as number
      const text = api.value(2) as string
      const point = api.coord([x, y])
 

      return {
        type: 'text',
        style: {
          text,
          fill: extra?.color ?? '#00943c',
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

/**
 * 画一个矩形
 * 值类型为 [x, bottom, top, width, empty, render]
 * @example ['2030-01-01', 0, 111380, 0.8, 0]
 */
export const drawerRect: DrawerFunc<[string, number, number, number, number, boolean][]> = (
  options,
  _,
  { index, data, extra }
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
      if (!api.value(5)) return null
      const x = api.value(0) as number
      const y1 = api.value(1) as number
      const y2 = api.value(2) as number
      const top = Math.max(y1, y2)
      const bottom = Math.min(y1, y2)
      const yValue = bottom - top
      const start = api.coord([x, bottom])
      const width = (api.value(3) as number) * 10
      const size = api.size!([x, yValue]) as number[]
      const empty = api.value(4) as number
 
      // const start = api.coord([x, api.value(2)])

      // const size = api.size!([x - width / 2, start[1]]) as number[]

      return {
        type: 'rect',
        shape: {
          x: start[0] - width / 2,
          y: start[1],
          width: width,
          height: -size[1]
        },
        z: 10,
        style: {
          fill: empty === 0 ? extra?.color ?? '#00943c' : 'transparent',
          stroke: empty !== 0 ? extra?.color ?? '#00943c' : 'transparent',
          lineWidth: 1
        }
      }
    },
    data: data
  }

  Array.isArray(options.series) && options.series.push(line)

  return options
}
