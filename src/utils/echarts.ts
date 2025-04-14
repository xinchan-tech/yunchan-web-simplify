import * as echarts from 'echarts/core'

import {
  BarChart,
  type BarSeriesOption,
  CandlestickChart,
  type CandlestickSeriesOption,
  CustomChart,
  type CustomSeriesOption,
  LineChart,
  type LineSeriesOption,
  PieChart,
  type PieSeriesOption,
  ScatterChart,
  type ScatterSeriesOption,
  TreemapChart,
  type TreemapSeriesOption
} from 'echarts/charts'

import {
  DataZoomComponent,
  type DataZoomComponentOption,
  DataZoomInsideComponent,
  DataZoomSliderComponent,
  DatasetComponent,
  type DatasetComponentOption,
  GraphicComponent,
  type GraphicComponentOption,
  GridComponent,
  type GridComponentOption,
  LegendComponent,
  type LegendComponentOption,
  MarkLineComponent,
  type MarkLineComponentOption,
  MarkPointComponent,
  type MarkPointComponentOption,
  TitleComponent,
  type TitleComponentOption,
  ToolboxComponent,
  type ToolboxComponentOption,
  TooltipComponent,
  type TooltipComponentOption,
  TransformComponent
} from 'echarts/components'

import { LabelLayout, UniversalTransition } from 'echarts/features'
// 引入 Canvas 渲染器，注意引入 CanvasRenderer 或者 SVGRenderer 是必须的一步
import { CanvasRenderer } from 'echarts/renderers'

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
  PieChart,
  MarkPointComponent,
  ScatterChart
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
  | MarkPointComponentOption
  | ScatterSeriesOption
>

export default echarts

export const echartUtils = {
  getAxisScale: (chart: echarts.ECharts, axisIndex = 0) => {
    // @ts-ignore
    return chart.getModel().getComponent('xAxis', axisIndex).axis.scale.getExtent()
  }
}
