import * as echarts from 'echarts/core'

import {
  LineChart,
  type LineSeriesOption,
  TreemapChart,
  type TreemapSeriesOption,
  CandlestickChart,
  type CandlestickSeriesOption,
  CustomChart,
  type CustomSeriesOption,
  BarChart,
  type BarSeriesOption,
  PieChart,
  type PieSeriesOption
} from 'echarts/charts'

import {
  TitleComponent,
  type TitleComponentOption,
  TooltipComponent,
  type TooltipComponentOption,
  GridComponent,
  type GridComponentOption,
  DatasetComponent,
  type DatasetComponentOption,
  TransformComponent,
  MarkLineComponent,
  type MarkLineComponentOption,
  LegendComponent,
  type LegendComponentOption,
  ToolboxComponent,
  type ToolboxComponentOption,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  DataZoomComponent,
  type DataZoomComponentOption,
  GraphicComponent,
  type GraphicComponentOption
} from 'echarts/components'

import { LabelLayout, UniversalTransition } from 'echarts/features'
// 引入 Canvas 渲染器，注意引入 CanvasRenderer 或者 SVGRenderer 是必须的一步
import { CanvasRenderer } from 'echarts/renderers'
import { Stock } from "./stock"

echarts.use([
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  TransformComponent,
  LineChart,
  LabelLayout,
  UniversalTransition,
  CanvasRenderer,
  MarkLineComponent,
  TreemapChart,
  ToolboxComponent,
  LegendComponent,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  DataZoomComponent,
  CandlestickChart,
  GraphicComponent,
  CustomChart,
  BarChart,
  PieChart
])

export type ECOption = echarts.ComposeOption<
  | LineSeriesOption
  | TitleComponentOption
  | TooltipComponentOption
  | GridComponentOption
  | DatasetComponentOption
  | DatasetComponentOption
  | MarkLineComponentOption
  | TreemapSeriesOption
  | LegendComponentOption
  | ToolboxComponentOption
  | DataZoomComponentOption
  | CandlestickSeriesOption
  | GraphicComponentOption
  | CustomSeriesOption
  | BarSeriesOption
  | PieSeriesOption
>


export default echarts


export const echartUtils = {
  getAxisScale: (chart: echarts.ECharts, axisIndex = 0) => {
    // @ts-ignore
    return chart.getModel().getComponent('xAxis', axisIndex).axis.scale.getExtent()
  }
}