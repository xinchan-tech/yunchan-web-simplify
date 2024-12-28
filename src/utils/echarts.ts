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

/**
 * 注册一个文字组件
 */
// const textShape = echarts.graphic.extendShape({
//   shape: {
//     x: 0,
//     y: 0,
//     text: ''
//   },
//   buildPath: (ctx: CanvasRenderingContext2D, shape) => {
//     ctx._ctx.textBaseline = 'bottom'
//     ctx._ctx.font = '12px Arial'
//     ctx._ctx.fillStyle = 'red'
//     ctx._ctx.fillText(shape.text, shape.x, shape.y)
//   }
// })

// echarts.graphic.registerShape('jknText', textShape)

export default echarts
