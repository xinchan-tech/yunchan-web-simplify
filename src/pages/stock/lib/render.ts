import { StockChartInterval, type StockRawRecord, type getStockChart } from '@/api'
import { useConfig } from '@/store'
import { type ECOption, echartUtils } from '@/utils/echarts'
import { stockUtils } from '@/utils/stock'
import { colorUtil } from '@/utils/style'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import type { CandlestickSeriesOption, LineSeriesOption } from 'echarts/charts'
import type { GraphicComponentOption } from 'echarts/components'
import type { EChartsType } from 'echarts/core'
import type { XAXisOption, YAXisOption } from 'echarts/types/dist/shared'
import {
  calcBottomSignal,
  calcCoilingPivots,
  calcCoilingPivotsExpands,
  calcTradePoints,
  calculateMA,
  calculateTradingPoint
} from './coilling'
import { CoilingIndicatorId, type Indicator, type KChartContext, isTimeIndexChart } from './ctx'
import {
  type DrawerRectShape,
  type DrawerTextShape,
  LineType,
  drawGradient,
  drawHLine,
  drawHdlyLabel,
  drawIcon,
  drawLine,
  drawNumber,
  drawPivots,
  drawPolyline,
  drawRect,
  drawRectRel,
  drawScatter,
  drawText,
  drawTradePoints
} from './drawer'
import { chartEvent } from './event'
import { renderUtils } from './utils'
import { dateUtils } from '@/utils/date'
import { listify } from 'radash'

const MAIN_CHART_NAME = 'kChart'
const MAIN_CHART_NAME_VIRTUAL = 'kChart-virtual'

const TEXT_COLOR = 'rgb(31, 32, 33)'
const LINE_COLOR = 'rgb(31, 32, 33)'

const X_AXIS_TICK = 8

type ChartState = ArrayItem<KChartContext['state']>

/**
 * 初始化配置
 */
export const initOptions = (): ECOption => {
  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      },
      borderWidth: 1,
      borderColor: '#29292a',
      backgroundColor: '#202020',
      padding: 10,
      textStyle: {
        color: '#fff'
      },
      formatter: (v: any) => {
        const series = (v as any[]).find(_v => _v.seriesName === MAIN_CHART_NAME) as any
        const data = series?.data.value as StockRawRecord

        if (!data) return ''
        const stock = stockUtils.toStock(data)

        let time = dayjs(stock.timestamp).tz('America/New_York').format('MM-DD HH:mm w')

        if (time.slice(6, 11) === '00:00') {
          time = dayjs(stock.timestamp).tz('America/New_York').format('YYYY-MM-DD w')
        }

        const isUp = stockUtils.isUp(stock)

        chartEvent.event.emit('tooltip', v)

        return `
            <span class="text-xs">
             ${time}<br/>
            开盘&nbsp;&nbsp;${Decimal.create(stock.open).toFixed(3)}<br/>
            最高&nbsp;&nbsp;${Decimal.create(stock.high).toFixed()}<br/>
            最低&nbsp;&nbsp;${Decimal.create(stock.low).toFixed()}<br/>
            收盘&nbsp;&nbsp;${Decimal.create(stock.close).toFixed()}<br/>
            涨跌额&nbsp;&nbsp;${`<span class="${isUp ? 'text-stock-up' : 'text-stock-down'}">${isUp ? '+' : ''}${Decimal.create(stockUtils.getPercentAmount(stock)).toFixed(3)}</span>`}<br/>
            涨跌幅&nbsp;&nbsp;${`<span class="${isUp ? 'text-stock-up' : 'text-stock-down'}">${isUp ? '+' : ''}${Decimal.create(stockUtils.getPercent(stock)).mul(100).toFixed(2)}%</span>`}<br/>
            成交量&nbsp;&nbsp;${stock.volume}<br/>
            </span>
            `
      },
      position: (pos, _, __, ___, size) => {
        const obj = {
          top: 10
        } as any
        obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30
        return obj
      }
    },
    axisPointer: {
      link: [
        {
          xAxisIndex: 'all'
        }
      ],
      label: {}
    },
    toolbox: {}
  }
}

/**
 * 主图通用配置
 */
export const createOptions = (chart: EChartsType): ECOption => ({
  animation: false,
  grid: [
    {
      left: 0,
      right: '6%',
      height: '97%'
    }
  ],
  xAxis: [
    {
      type: 'category',
      id: 'main-x',
      gridIndex: 0,
      axisLine: { onZero: false, show: false },
      axisTick: {
        show: false
      },
      boundaryGap: true,
      axisLabel: {
        show: false,
        interval: (index: number) => {
          const scale = renderUtils.getScaledZoom(chart, 0)!

          const offset = Math.round((scale[1] - scale[0]) / X_AXIS_TICK)

          if (offset <= X_AXIS_TICK) {
            return index % 4 === 0
          }

          return (index - scale[0]) % offset === 0
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgb(31, 32, 33)'
        }
      },
      axisPointer: {
        label: {
          show: false
        }
      },
      data: []
    }
  ],
  yAxis: [
    {
      scale: true,
      gridIndex: 0,
      position: 'left',
      splitNumber: 8,
      show: true,
      axisPointer: {
        label: {
          show: false
        }
      },
      min: renderUtils.setYMin,
      max: renderUtils.setYMax,
      splitLine: {
        lineStyle: {
          color: 'rgb(31, 32, 33)'
        }
      },
      axisLabel: {
        showMaxLabel: false,
        showMinLabel: false,
        show: true,
        color: v => {
          const scale = renderUtils.getScaledZoom(chart, 0)!

          const data = chart.meta!.mainData?.slice(scale[0], scale[1])

          if (!data || !v) return TEXT_COLOR

          const start = data[0]

          if (!start || start.length < 2) return TEXT_COLOR

          const getStockColor = useConfig.getState().getStockColor

          return v >= start[2] ? getStockColor(true, 'hex') : getStockColor(false, 'hex')
        }
      }
    },
    {
      scale: true,
      show: true,
      gridIndex: 0,
      position: 'right',
      splitNumber: 8,
      splitLine: {
        show: false
      },
      min: renderUtils.setYMin,
      max: renderUtils.setYMax,
      axisPointer: {
        label: {
          padding: [0, 0, 0, 0],
          formatter: (params: any) => {
            const scale = renderUtils.getScaledZoom(chart, 0)!
            const data = chart.meta!.mainData?.slice(scale[0], scale[1])

            if (!data) return params.value

            const start = data[0]

            if (chart.meta?.yAxis?.right === 'percent') {
              const percent = ((params.value - start[2]) / start[2]) * 100

              return `{${percent >= 0 ? 'u' : 'd'}|${percent.toFixed(2)}%}`
            }

            return `{${params.value >= start[2] ? 'u' : 'd'}|${params.value.toFixed(2)}}`
          },
          rich: {
            u: {
              backgroundColor: useConfig.getState().getStockColor(true, 'hex'),
              width: '100%',
              color: '#fff',
              padding: [4, 4],
              borderRadius: 4
            },
            d: {
              backgroundColor: useConfig.getState().getStockColor(false, 'hex'),
              width: '100%',
              color: '#fff',
              padding: [4, 4],
              borderRadius: 4
            }
          }
        }
      },
      axisLabel: {
        showMaxLabel: false,
        showMinLabel: false,
        formatter: (v: any) => {
          if (chart.meta?.yAxis?.right === 'percent') {
            const scale = echartUtils.getAxisScale(chart, 0)

            const data = chart.meta!.mainData?.[scale[0]]

            if (!data) return '-'

            const start = data[2]

            if (!start) return v

            return `${(((v - start) / start) * 100).toFixed(2)}%`
          }

          return v
        },
        color: v => {
          const scale = renderUtils.getScaledZoom(chart, 0)!

          const data = chart.meta!.mainData?.slice(scale[0], scale[1])

          if (!data || data.length === 0 || !v) return TEXT_COLOR

          const start = data[0]

          const getStockColor = useConfig.getState().getStockColor

          return v >= start[2] ? getStockColor(true, 'hex') : getStockColor(false, 'hex')
        }
      }
    }
  ],
  dataZoom: [
    {
      minSpan: 4,
      type: 'inside',
      xAxisIndex: [0, 1, 2, 3, 4, 5, 6],
      filterMode: 'weakFilter'
    },
    {
      filterMode: 'weakFilter',
      minSpan: 4,
      show: true,
      xAxisIndex: [0, 1, 2, 3, 4, 5, 6],
      type: 'slider',
      bottom: 0,
      zoomLock: true,
      fillerColor: 'rgba(255, 255, 255, 0.2)',
      selectedDataBackground: {
        areaStyle: {
          color: 'transparent'
        },
        lineStyle: {
          color: 'transparent'
        }
      },
      labelFormatter: () => '',
      textStyle: {
        show: false
      },
      backgroundColor: 'transparent',
      dataBackground: {
        lineStyle: {
          color: 'transparent'
        },
        areaStyle: {
          color: 'transparent'
        }
      },
      borderColor: 'transparent',
      handleStyle: {
        color: 'transparent',
        opacity: 0
      },
      handleSize: 0,
      moveHandleIcon: 'none',
      moveHandleSize: 0,
      moveHandleStyle: {
        color: 'transparent'
      }
    }
  ],
  series: []
})

/**
 * 默认x轴配置
 */
const defaultXAxis: XAXisOption = {
  type: 'category',
  boundaryGap: true,
  axisLine: {
    onZero: false,
    lineStyle: {
      color: LINE_COLOR
    }
  },

  axisTick: {
    show: false
  },
  splitLine: {
    show: true,
    lineStyle: {
      color: LINE_COLOR
    }
  },
  axisPointer: {
    label: {
      show: false
    }
  }
}

/**
 * 默认Y轴配置
 */
const defaultYAxis: YAXisOption = {
  scale: true,
  position: 'right',
  axisLine: { onZero: false, show: false },
  axisTick: {
    show: false
  },
  axisPointer: {
    label: {
      show: false
    }
  },
  axisLabel: { show: false },
  splitLine: {
    show: false
  }
}

type ChartRender = (
  options: ECOption,
  state: ChartState,
  data?: Awaited<ReturnType<typeof getStockChart>>,
  secondary?: boolean
) => void

/**
 * 渲染图表
 */
export const renderChart = (chart: EChartsType): ECOption => {
  const _initOptions = initOptions()
  const _options = createOptions(chart)

  Object.assign(_options, _initOptions)

  return _options
}

/**
 * 渲染布局
 */
export const renderGrid = (options: ECOption, state: ChartState, size: [number, number], chart: EChartsType) => {
  /**
   * 布局策略
   * 1. 无副图 -> 主图占满, 底部留出24显示标签
   * 2. 副图 <= 3 -> 副图占20% * 副图数量，底部留24标签
   * 3. 副图 > 3 -> 副图占60%平均分，底部留24标签
   *
   * 左右留出50px显示标签
   */
  const grids = renderUtils.calcGridSize(size, state.secondaryIndicators.length, !!state.yAxis.left)

  options.grid = grids

  const yAxis = options.yAxis as YAXisOption[]

  //   分时图不允许缩放
  if (isTimeIndexChart(state.timeIndex)) {
    options.dataZoom = []
  }

  const mainXAxis = renderUtils.getXAxisIndex(options, 0)
  if (mainXAxis) {
    ;(mainXAxis as any).data = renderUtils.calcXAxisData(state.mainData.history, state.timeIndex)
  }

  const { getStockColor } = useConfig.getState()

  yAxis[1].axisLabel!.rich = {
    u: {
      color: getStockColor(true, 'hex')
    },
    d: {
      color: getStockColor(false, 'hex')
    }
  }

  /**
   * 设置底部X轴
   * 底部x轴一定要在附图坐标之前配置，否则附图指标index会错乱
   * 详见： https://echarts.apache.org/zh/api.html#echartsInstance.setOption 组件合并模式
   */
  Array.isArray(options.xAxis) &&
    options.xAxis.push({
      ...defaultXAxis,
      show: true,
      gridIndex: grids.length - 1,
      data: (options.xAxis[0] as any).data,
      id: 'xAxis-x',
      axisLabel: {
        show: true,
        alignMinLabel: 'left',
        color: '#fff',
        formatter: (v: any) => {
          if (!v) return ''
          // @ts-ignore
          const xData = options.xAxis[0].data as any[]
          const scale = renderUtils.getScaledZoom(chart, 0)!
          const startDay = xData[scale[0]] * 1000
          //获取时间跨度
          const time = dayjs(+xData[scale[1]] * 1000).diff(+startDay, 'day')
          const d = dayjs(+v * 1000).tz('America/New_York')
          if (time < 1) {
            return d.format('HH:mm')
          }

          if (time < 300) {
            return d.format('MM-DD')
          }

          if (time < 365 * 5) {
            return d.format('YY-MM')
          }

          return d.format('YYYY')
        },
        interval: (index: number) => {
          const scale = renderUtils.getScaledZoom(chart, 0)!

          const offset = Math.round((scale[1] - scale[0]) / X_AXIS_TICK)

          if (offset <= X_AXIS_TICK) {
            return index % 4 === 0
          }

          return (index - scale[0]) % offset === 0
        }
      },
      axisPointer: {
        label: {
          show: true,
          backgroundColor: '#353535',
          formatter: params => {
            if (params.axisDimension === 'x') {
              const time = dateUtils.toUsDay(+params.value)
              if (isTimeIndexChart(state.timeIndex) && state.timeIndex !== StockChartInterval.FIVE_DAY) {
                return time.format('YYYY-MM-DD HH:mm')
              }
              if (time.minute() === 0) {
                return time.format('YYYY-MM-DD w')
              }

              return time.format('MM-DD HH:mm w')
            }

            return Decimal.create(params.value as string).toFixed(3)
          }
        }
      }
    })

  Array.isArray(options.yAxis) &&
    options.yAxis.push({
      ...defaultYAxis,
      gridIndex: grids.length - 1,
      position: 'right',
      id: 'xAxis-y'
    })

  Array.isArray(options.series) &&
    options.series.push({
      type: 'line',
      xAxisIndex: grids.length - 1,
      yAxisIndex: grids.length,
      symbol: 'none',
      emphasis: {
        disabled: true
      },
      data: state.mainData.history.map(v => [v[0], 0]),
      color: 'transparent',
      encode: {
        x: [0],
        y: [1]
      }
    })

  for (let i = 0; i < state.secondaryIndicators.length; i++) {
    renderSecondaryAxis(options, state, i, chart)
  }

  return options
}

/**
 * 渲染主图
 */
export const renderMainChart: ChartRender = (options, state) => {
  const mainSeries = { name: MAIN_CHART_NAME } as LineSeriesOption | CandlestickSeriesOption
  mainSeries.yAxisIndex = 1
  mainSeries.xAxisIndex = 0
  const { getStockColor } = useConfig.getState()

  const data = state.mainData.history

  if (!data || data.length === 0) return options

  const upColor = getStockColor(true, 'hex')
  const downColor = getStockColor(false, 'hex')

  if (state.type === 'k-line') {
    mainSeries.type = 'candlestick'
    mainSeries.itemStyle = {
      color: upColor,
      color0: downColor,
      borderColor: upColor,
      borderColor0: downColor
    }
    ;(mainSeries as CandlestickSeriesOption).barWidth = '85%'
    mainSeries.emphasis = {
      disabled: true
    }
    mainSeries.z = 1
    mainSeries.data = data.map(item => {
      const percent = stockUtils.toStockWithExt(item).percent ?? 0

      if (Math.abs(percent) < 0.09) {
        return {
          value: item
        }
      }
      return {
        value: item,
        itemStyle: {
          color: percent > 0 ? '#ffffff' : '#9123a7',
          borderColor: percent > 0 ? '#ffffff' : '#9123a7'
        }
      }
    })
    mainSeries.encode = {
      x: [0],
      y: [1, 2, 4, 3]
    }
  } else {
    let color = '#4784cf'

    const lastData = stockUtils.toStock(data[data.length - 1])

    if (isTimeIndexChart(state.timeIndex)) {
      color = getStockColor(stockUtils.isUp(lastData), 'hex')
    }
    const rgbColor = colorUtil.hexToRGB(color)
    const _mainSeries = mainSeries as LineSeriesOption
    _mainSeries.z = 1
    _mainSeries.type = 'line'
    _mainSeries.showSymbol = false
    _mainSeries.encode = {
      x: [0],
      y: [2]
    }
    _mainSeries.data = data.map(item => ({
      value: item
    }))
    _mainSeries.color = color
    _mainSeries.areaStyle = {
      color: {
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          {
            offset: 0,
            color: `rgba(${rgbColor?.r}, ${rgbColor?.g}, ${rgbColor?.b}, .4)` /* 0% 处的颜色*/
          },
          {
            offset: 0.8,
            color: `rgba(${rgbColor?.r}, ${rgbColor?.g}, ${rgbColor?.b}, .1)` /* 100% 处的颜色*/
          },
          {
            offset: 1,
            color: 'transparent' // 100% 处的颜色
          }
        ]
      }
    }
  }
  ;(options.series as any)?.push(mainSeries)

  // 用来给叠加标记定位的虚拟线
  const virtualLine = JSON.parse(JSON.stringify(mainSeries)) as LineSeriesOption

  virtualLine.name = MAIN_CHART_NAME_VIRTUAL
  virtualLine.type = 'line'
  virtualLine.yAxisIndex = 1

  virtualLine.encode = {
    x: [0],
    y: [2]
  }

  virtualLine.color = 'transparent'
  virtualLine.symbol = 'none'
  virtualLine.itemStyle = {}
  virtualLine.areaStyle = {}

  virtualLine.markLine = {
    symbol: ['none', 'none'],
    lineStyle: {
      color: '#949596'
    },
    label: {
      formatter: (v: any) => {
        const x = (v.data as any)?.xAxis as string
        const date = dayjs(new Date(+x)).format('YYYY-MM-DD')

        return `{date|${date}}{abg|}\n{title|${v.data.name}}`
      },
      backgroundColor: '#eeeeee',
      rich: {
        date: {
          color: '#fff',
          align: 'center',
          padding: [0, 10, 0, 10]
        },
        abg: {
          backgroundColor: '#e91e63',
          width: '100%',
          align: 'right',
          height: 25,
          padding: [0, 10, 0, 10]
        },
        title: {
          height: 20,
          align: 'left',
          padding: [0, 10, 0, 10]
        }
      }
    },
    silent: true,
    data: []
  }
  renderUtils.addSeries(options, virtualLine)

  if (state.yAxis.left) {
    const leftYAxisSeries = {
      name: 'left-y-axis',
      type: 'line',
      yAxisIndex: 0,
      xAxisIndex: 0,
      symbol: 'none',
      encode: {
        x: [0],
        y: [1]
      },
      data: data.map(item => ({
        value: item
      })),
      color: 'transparent'
    }

    renderUtils.addSeries(options, leftYAxisSeries)
  }

  return options
}

/**
 * 渲染标记线
 */
export const renderMarkLine: ChartRender = (options, state) => {
  if (!options.series && !Array.isArray(options.series)) return options
  const data = state.mainData.history
  if (!data || data.length === 0) return options

  const mainSeries = (options.series as any[]).find(s => s.name === MAIN_CHART_NAME)!

  const { getStockColor } = useConfig.getState()
  const lastData = stockUtils.toStock(data[data.length - 1])

  const lineColor = getStockColor(stockUtils.isUp(lastData), 'hex')
  const grid = renderUtils.getGridIndex(options, 0)

  mainSeries.markLine = {
    symbol: ['none', 'none'],
    lineStyle: {
      color: lineColor
    },
    label: {
      color: '#fff',
      borderRadius: 2,
      padding: [2, 4],
      backgroundColor: lineColor,
      formatter: (params: { data: { yAxis: number } }) => {
        return params.data.yAxis ? Decimal.create(params.data.yAxis).toFixed(2) : ''
      }
    },
    silent: true,
    data: [
      [
        {
          xAxis: 'max',
          yAxis: data[data.length - 1][2] ?? 0
        },
        {
          yAxis: data[data.length - 1][2] ?? 0,
          x: ((grid!.width ?? 0) as number) + ((grid!.left ?? 0) as number)
        }
      ]
    ]
  }

  if (mainSeries.type === 'candlestick') {
    mainSeries.markPoint = {
      symbol: 'rect',
      symbolSize: [20, 1],
      symbolOffset: (_: any, p: any) => {
        if (p.data.type === 'min') {
          return [10, 4]
        }
        return [-10, -4]
      },
      label: {
        show: true,
        color: '#fff'
      },
      silent: true,
      emphasis: {
        disabled: true
      },
      itemStyle: {
        color: '#fff'
      },
      data: [
        {
          type: 'max',
          name: '最大值',
          valueIndex: 3,
          label: {
            position: 'left'
          }
        },
        {
          type: 'min',
          name: '最小值',
          valueIndex: 4,
          label: {
            position: 'right'
          }
        }
      ]
    }
  }
}

/**
 * 主图缠论
 */
export const renderMainCoiling = (options: ECOption, state: ChartState, chart: EChartsType) => {
  if (state.mainCoiling.length === 0 || !state.mainData.coilingData) return options
  const points = state.mainData.coilingData?.points
  const pivots = state.mainData.coilingData?.pivots
  const expands = state.mainData.coilingData?.expands
  state.mainCoiling.forEach(coiling => {
    if (coiling === CoilingIndicatorId.PEN) {
      const p: any[] = []
      points?.slice(1).forEach((point, index) => {
        const prev = points[index]
        p.push([
          prev.index,
          prev.price,
          point.index,
          point.price,
          index === points.length - 2 && state.mainData.coilingData?.status !== 1 ? LineType.DASH : LineType.SOLID
        ])
      })
      drawPolyline(options, {} as any, {
        xAxisIndex: 0,
        yAxisIndex: 1,
        data: p,
        name: `coiling_${CoilingIndicatorId.PEN}`,
        extra: { color: '#ffffff' },
        chart: chart
      })
    } else if (coiling === CoilingIndicatorId.PIVOT) {
      drawPivots(options, {} as any, {
        xAxisIndex: 0,
        yAxisIndex: 1,
        data: calcCoilingPivotsExpands(expands) as any,
        name: `coiling_${CoilingIndicatorId.PIVOT}_ext`
      })
      drawPivots(options, {} as any, {
        xAxisIndex: 0,
        yAxisIndex: 1,
        data: calcCoilingPivots(pivots) as any,
        name: `coiling_${CoilingIndicatorId.PIVOT}`
      })
    } else if (
      [CoilingIndicatorId.ONE_TYPE, CoilingIndicatorId.TWO_TYPE, CoilingIndicatorId.THREE_TYPE].includes(coiling)
    ) {
      const tradePoints = calcTradePoints(state.mainData.coilingData, coiling as any)
      drawTradePoints(options, {} as any, {
        xAxisIndex: 0,
        yAxisIndex: 1,
        data: tradePoints,
        name: `coiling_${coiling}`
      })
    } else if (coiling === CoilingIndicatorId.SHORT_LINE) {
      const cma = calculateMA(20, state.mainData.history)
      const cma2 = calculateMA(30, state.mainData.history)
      drawLine(options, {} as any, {
        yAxisIndex: 1,
        xAxisIndex: 0,
        name: `coiling_${coiling}`,
        data: cma.map((s, i) => [i, s]),
        extra: {
          color: 'rgb(186, 64, 127)'
        }
      })
      drawLine(options, {} as any, {
        yAxisIndex: 1,
        xAxisIndex: 0,
        name: `coiling_${coiling}_2`,
        data: cma2.map((s, i) => [i, s]),
        extra: {
          color: 'rgb(156, 171, 232)'
        }
      })
    } else if (coiling === CoilingIndicatorId.MAIN) {
      const cma = calculateMA(55, state.mainData.history)
      const cma1 = calculateMA(60, state.mainData.history)
      const cma2 = calculateMA(65, state.mainData.history)
      const cma3 = calculateMA(120, state.mainData.history)
      const cma4 = calculateMA(250, state.mainData.history)

      drawLine(options, {} as any, {
        yAxisIndex: 1,
        xAxisIndex: 0,
        name: 'coiling_cma',
        data: cma.map((s, i) => [i, s]),
        extra: {
          color: 'rgb(250,28,19)'
        }
      })
      drawLine(options, {} as any, {
        yAxisIndex: 1,
        xAxisIndex: 0,
        name: 'coiling_cma1',
        data: cma1.map((s, i) => [i, s]),
        extra: {
          color: 'rgb(255,255,255)'
        }
      })
      drawLine(options, {} as any, {
        yAxisIndex: 1,
        xAxisIndex: 0,
        name: 'coiling_cma2',
        data: cma2.map((s, i) => [i, s]),
        extra: {
          color: 'rgb(51,251,41)'
        }
      })
      drawLine(options, {} as any, {
        yAxisIndex: 1,
        xAxisIndex: 0,
        name: 'coiling_cma3',
        data: cma3.map((s, i) => [i, s]),
        extra: {
          color: 'rgb(51,251,41)'
        }
      })
      drawLine(options, {} as any, {
        yAxisIndex: 1,
        xAxisIndex: 0,
        name: 'coiling_cma4',
        data: cma4.map((s, i) => [i, s]),
        extra: {
          color: 'rgb(249,42,251)'
        }
      })
    }
  })
}

const renderIndicator = (
  options: ECOption,
  indicator: Indicator,
  params: { xAxisIndex: number; yAxisIndex: number; type: 'main' | 'secondary' }
) => {
  if (!indicator.data || indicator.visible === false) return

  if (renderUtils.isLocalIndicator(indicator.id)) return

  indicator.data.forEach((d, index) => {
    if (typeof d === 'string') {
      return
    }

    if (d.style_type === 'NODRAW') {
      return
    }

    const seriesName = `${params.type}_${indicator.id}_${d.name}_${index}`

    if (!d.draw) {
      if (d.style_type === 'POINTDOT') {
        drawScatter(options, {} as any, {
          name: seriesName,
          xAxisIndex: params.xAxisIndex,
          extra: {
            color: d.color
          },
          yAxisIndex: params.yAxisIndex,
          data: d.data.map((s, i) => ({ x: i, y: s })).filter(s => !!s.y)
        })
      } else {
        drawLine(options, {} as any, {
          extra: {
            color: d.color || '#ffffff'
          },
          name: seriesName,
          xAxisIndex: params.xAxisIndex,
          yAxisIndex: params.yAxisIndex,
          data: (d.data as number[]).map((s, i) => [i, s])
        })
      }
    } else if (d.draw === 'STICKLINE') {
      const data: DrawerRectShape[] = Object.keys(d.draw_data).map(key => [
        +key,
        ...(d.draw_data as NormalizedRecord<number[]>)[key],
        d.color
      ]) as any[]
      drawRect(options, {} as any, {
        xAxisIndex: params.xAxisIndex,
        yAxisIndex: params.yAxisIndex,
        name: seriesName,
        data: data
      })
    } else if (d.draw === 'DRAWTEXT') {
      const data: DrawerTextShape[] = listify(d.draw_data, (key, value) => [
        +key,
        value[0],
        value[1],
        d.color,
        value[2],
        value[3]
      ])
      drawText(options, {} as any, {
        xAxisIndex: params.xAxisIndex,
        yAxisIndex: params.yAxisIndex,
        name: seriesName,
        data: data
      })
    } else if (d.draw === 'DRAWNUMBER') {
      const data = Object.entries(d.draw_data as NormalizedRecord<number[]>).map(([key, value]) => [
        +key,
        ...value,
        d.color
      ])

      drawNumber(options, {
        xAxisIndex: params.xAxisIndex,
        yAxisIndex: params.yAxisIndex,
        name: seriesName,
        data: data as any
      })
    } else if (d.draw === 'DRAWRECTREL') {
      const data = Object.entries(d.draw_data).map(([_, value]) => ({
        leftTop: { x: value[0], y: value[1] },
        rightBottom: { x: value[2], y: value[3] },
        color: value[4]
      }))

      drawRectRel(options, {} as any, {
        xAxisIndex: params.xAxisIndex,
        yAxisIndex: params.yAxisIndex,
        name: seriesName,
        data: data
      })
    } else if (d.draw === 'DRAWGRADIENT') {
      // const data = Object.entries(d.draw_data).map(([_, value]) => ({
      //   leftTop: { x: value[0], y: value[1] },
      //   rightBottom: { x: value[2], y: value[3] },
      //   color: value[4]
      // }))

      drawGradient(options, {} as any, {
        xAxisIndex: params.xAxisIndex,
        yAxisIndex: params.yAxisIndex,
        name: seriesName,
        data: d.draw_data
      })
    } else if (d.draw === 'DRAWICON') {
      const data = Object.entries(d.draw_data).map(([x, value]) => ({
        x: +x,
        y: value[0],
        iconId: value[1],
        offsetX: value[2],
        offsetY: value[3]
      }))

      drawIcon(options, {} as any, {
        xAxisIndex: params.xAxisIndex,
        yAxisIndex: params.yAxisIndex,
        name: seriesName,
        data: data
      })
    }
  })
}

/**
 * 渲染主图指标
 */
export const renderMainIndicators = (options: ECOption, indicators: Indicator[]) => {
  /** 合并绘制 */
  // const stickLineData: DrawerRectShape[] = []
  // const textData: DrawerTextShape[] = []
  indicators.forEach(indicator => {
    renderIndicator(options, indicator, {
      xAxisIndex: 0,
      yAxisIndex: 1,
      type: 'main'
    })
  })
}

/**
 * 股票叠加
 */
export const renderOverlay = (options: ECOption, data?: ChartState['overlayStock']) => {
  if (!data || data.length === 0) return options

  data.forEach((stock, index) => {
    const series: LineSeriesOption = {
      name: stock.symbol,
      id: stock.symbol,
      smooth: true,
      symbol: 'none',
      type: 'line',
      data: stock.data.map(o => [o[0]?.toString(), ...o.slice(1)]),
      color: colorUtil.colorPalette[index],
      encode: {
        x: [0],
        y: [2]
      },
      yAxisIndex: 1,
      xAxisIndex: 0
    }

    if (!options.series) {
      options.series = [series]
    } else {
      Array.isArray(options.series) && options.series.push(series)
    }
  })

  return options
}

/**
 * 主图叠加标记
 */
export const renderOverlayMark = (options: ECOption, state: ChartState) => {
  const mark = state.overlayMark
  if (!mark || !mark.mark || !mark.data) return options

  if (!Array.isArray(options.series)) return options

  const series = options.series.find(item => item.name === MAIN_CHART_NAME_VIRTUAL)

  if (!series) return options

  const data = mark.data
    .map((item: any) => {
      const x = dateUtils.toUsDay(item.date).hour(0).minute(0).second(0).valueOf().toString().slice(0, -3)
      const y = (series.data as any[])?.find(s => {
        return s.value[0] === x
      })?.value[3] as number | undefined

      return [x, y, item.event_zh]
    })
    .filter(v => !!v[1]) as [string, number, string][]

  renderUtils.addSeries(
    options,
    data.map(d => [
      { xAxis: d[0], yAxis: d[1], name: mark.title },
      { xAxis: d[0], y: 46 }
    ])
  )
}

/**
 * 渲染副图
 */
export const renderSecondary = (options: ECOption, indicators: Indicator[]) => {
  /** 合并绘制 */
  indicators.forEach((indicator, index) => {
    if (renderUtils.isLocalIndicator(indicator.id)) return

    renderIndicator(options, indicator, {
      xAxisIndex: index + 2,
      yAxisIndex: index + 3,
      type: 'secondary'
    })
  })

  return options
}

/**
 *
 */
export const renderSecondaryLocalIndicators = (options: ECOption, indicators: Indicator[], state: ChartState) => {
  if (!state.mainData.history.length) return options

  indicators.forEach((indicator, index) => {
    if (!renderUtils.isLocalIndicator(indicator.id)) return
    if (indicator.id === '9') {
      const { result } = calcBottomSignal(state.mainData.history)

      result.forEach(d => {
        if (d.draw === 'STICKLINE') {
          drawRect(options, {} as any, {
            xAxisIndex: index + 2,
            yAxisIndex: index + 3,
            data: d.data,
            extra: {
              color: d.style?.color
            }
          })
        } else if (d.draw === 'HDLY_LABEL') {
          drawHdlyLabel(options, {} as any, {
            xAxisIndex: index + 2,
            yAxisIndex: index + 3,
            data: d.data,
            extra: {
              color: d.style?.color
            }
          })
        } else if (d.draw === 'HORIZONTALLINE') {
          drawHLine(options, {} as any, {
            extra: {
              color: d.style?.color,
              type: d.style?.style_type as any
            },
            xAxisIndex: index + 2,
            yAxisIndex: index + 3,
            data: (d.data as number[]).map((s, i) => [i, s])
          })
        } else {
          drawLine(options, {} as any, {
            extra: {
              color: d.style?.color,
              type: d.style?.style_type as any
            },
            xAxisIndex: index + 2,
            yAxisIndex: index + 3,
            data: (d.data as number[]).map((s, i) => [i, s])
          })
        }
      })
    } else if (indicator.id === '10') {
      const { S1, S2, X0, Z } = calculateTradingPoint(state.mainData.history)

      drawRect(options, {} as any, {
        xAxisIndex: index + 2,
        yAxisIndex: index + 3,
        data: [
          ...X0.map((x, i) => [i, 0, x * 1000, 1.5, 0, x > 0 ? 'magenta' : 'cyan'] as any),
          ...Z.map((z, i) => [i, 0, z * 1000, 1.5, 0, z > 0 ? 'magenta' : 'cyan'] as any)
        ]
      })
      drawLine(options, {} as any, {
        extra: {
          color: 'magenta',
          type: 'solid',
          z: 10
        },
        xAxisIndex: index + 2,
        yAxisIndex: index + 3,
        data: S1.map((s, i) => [i, s * 1000])
      })
      drawLine(options, {} as any, {
        extra: {
          color: 'white',
          type: 'solid',
          z: 10
        },
        xAxisIndex: index + 2,
        yAxisIndex: index + 3,
        data: S2.map((s, i) => [i, s * 1000])
      })
    }
  })
}

/**
 * 渲染坐标轴
 */
const renderSecondaryAxis = (options: ECOption, _: any, index: number, chart: EChartsType) => {
  Array.isArray(options.xAxis) &&
    options.xAxis.push({
      ...defaultXAxis,
      id: `secondary-${index}`,
      gridIndex: index + 1,
      axisLabel: {
        show: false,
        interval: (index: number) => {
          const scale = renderUtils.getScaledZoom(chart, 0)!

          const offset = Math.round((scale[1] - scale[0]) / X_AXIS_TICK)

          if (offset <= X_AXIS_TICK) {
            return index % 4 === 0
          }

          return (index - scale[0]) % offset === 0
        }
      },
      data: (options.xAxis[0] as any).data
    })

  Array.isArray(options.yAxis) &&
    options.yAxis.push({
      ...defaultYAxis,
      gridIndex: index + 1,
      id: `secondary-${index}`
    })

  return options
}

/**
 * 渲染水印
 * 只有在盘前盘中盘后显示
 */
export const renderWatermark = (options: ECOption, timeIndex: ChartState['timeIndex']) => {
  const watermark: GraphicComponentOption = {
    type: 'text',
    left: 'center',
    top: '25%',
    z2: 0,
    style: {
      text:
        timeIndex === StockChartInterval.PRE_MARKET
          ? '盘前交易'
          : timeIndex === StockChartInterval.AFTER_HOURS
            ? '盘后交易'
            : timeIndex === StockChartInterval.INTRA_DAY
              ? '盘中交易'
              : '',
      fill: 'rgba(255, 255, 255, 0.05)',
      font: 'bold 96px sans-serif',
      align: 'center'
    }
  }

  renderUtils.addGraphic(options, watermark)
}

/**
 * 配置缩放
 */
export const renderZoom = (options: ECOption, addCount: number, zoom?: [number, number]) => {
  if (!zoom) {
    return
  }

  const MaxKLineCount = 1000
  const _zoom = [...zoom]

  if (_zoom[0] === Number.POSITIVE_INFINITY) {
    _zoom[0] = Math.round(addCount * 0.5)
  }
  if (_zoom[1] === Number.NEGATIVE_INFINITY) {
    _zoom[1] = addCount
  }

  const showCount = zoom[1] - zoom[0]
  if (showCount > MaxKLineCount) {
    _zoom[0] = zoom[1] - MaxKLineCount
  }

  if (Array.isArray(options.dataZoom)) {
    for (const z of options.dataZoom) {
      z.startValue = _zoom[0] + addCount
      z.endValue = _zoom[1] + addCount
      z.start = undefined
      z.end = undefined
      z.maxValueSpan = MaxKLineCount
      z.minValueSpan = 90
    }
  }
}

export const renderBackTestMark = (options: ECOption, state: ChartState) => {
  if (!state.backTestMark) return options
  const record: Record<string, NonNullable<typeof state.backTestMark>> = {}
  state.backTestMark.forEach(mark => {
    if (!record[mark.time]) {
      record[mark.time] = []
    }

    record[mark.time].push(mark)
  })

  Object.entries(record).forEach(([time, marks]) => {
    let buyCount = 0
    let sellCount = 0
    const data = marks.map(mark => {
      return [
        {
          xAxis: time,
          yAxis: mark.price,
          name: mark.count
        },
        {
          xAxis: time,
          y: mark.type === '买入' ? 46 + buyCount++ * 10 : 46 - sellCount++ * 10
        }
      ]
    })

    renderUtils.addSeries(options, data)
  })
}
