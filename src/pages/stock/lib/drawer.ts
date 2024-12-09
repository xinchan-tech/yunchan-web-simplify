import type { ECOption } from "@/utils/echarts"
import type { LineSeriesOption } from "echarts/charts"
import { exists } from "i18next"
import { renderUtils } from "./utils"

type DrawerFuncOptions<T = any> ={
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

type DrawerFunc<T = any> = (options: ECOption,  params: DrawerFuncOptions<T>) => ECOption


/**
 * 画一条线
 */
export const drawerLine: DrawerFunc<[string, number][]> = (options, {index, data, extra}) => {
  const line: LineSeriesOption = {
    xAxisIndex: index,
    yAxisIndex: index,
    type: 'line',
    showSymbol: false,
    color: extra?.color,
    data: [...data.map(item => item[1])]
  }

  Array.isArray(options.series) && options.series.push(line)

  const xAxis = renderUtils.getXAxisIndex(options, index)

  if(xAxis){
    ;(xAxis as any).data = data.map((item: any) => item[0])
  }

  return options
}