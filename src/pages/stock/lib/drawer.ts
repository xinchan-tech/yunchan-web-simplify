import type { ECOption } from '@/utils/echarts'
import type { CustomSeriesOption, LineSeriesOption } from 'echarts/charts'
import type { KChartState } from './ctx'
import echarts from "@/utils/echarts"

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
export const drawerText: DrawerFunc<[string, number, string]> = (options, state, { index, data }) => {

  const line: CustomSeriesOption = {
    xAxisIndex: index,
    yAxisIndex: index,
    type: 'custom',
    coordinateSystem: 'cartesian2d',
    renderItem: (params, api) => {
      console.log("🚀 ~ (params, api:", params, api)
      const x = api.value(0)
      const y = api.value(1)
      const text = api.value(2)


      return {
        type: 'jknText',
        shape: {
          x: api.coord([x, y])[0],
          y: api.coord([x, y])[1],
          text
        }
      }
    },
    data: [data]
  }

  Array.isArray(options.series) && options.series.push(line)

  return options
}
