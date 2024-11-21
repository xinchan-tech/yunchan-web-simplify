import * as echarts from 'echarts/core'

import { LineChart, type LineSeriesOption, TreemapChart, type TreemapSeriesOption } from 'echarts/charts'


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
  type LegendComponentOption
} from 'echarts/components'

import { LabelLayout, UniversalTransition } from 'echarts/features';
// 引入 Canvas 渲染器，注意引入 CanvasRenderer 或者 SVGRenderer 是必须的一步
import { CanvasRenderer, SVGRenderer } from 'echarts/renderers';

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
  SVGRenderer,
  MarkLineComponent,
  TreemapChart,
  LegendComponent
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
>

export default echarts