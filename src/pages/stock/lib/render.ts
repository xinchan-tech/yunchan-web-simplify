import { StockChartInterval, type StockRawRecord, type getStockChart } from '@/api'
import { useConfig } from '@/store'
import { echartUtils, type ECOption } from '@/utils/echarts'
import { stockUtils } from '@/utils/stock'
import { colorUtil } from '@/utils/style'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import type { CandlestickSeriesOption, LineSeriesOption } from 'echarts/charts'
import { CoilingIndicatorId, type Indicator, type KChartContext, chartEvent, isTimeIndexChart } from './ctx'
import {
  type DrawerRectShape,
  type DrawerTextShape,
  drawGradient,
  drawHdlyLabel,
  drawHLine,
  drawLine,
  drawNumber,
  drawPivots,
  drawPolyline,
  drawRect,
  drawText,
  drawTradePoints,
  LineType
} from './drawer'
import {
  calcBottomSignal,
  calcCoilingPivots,
  calcCoilingPivotsExpands,
  calcTradePoints,
  calculateMA,
  calculateTradingPoint
} from './coilling'
import { renderUtils } from './utils'
import type { GraphicComponentOption } from 'echarts/components'
import type { XAXisOption, YAXisOption } from 'echarts/types/dist/shared'
import type { EChartsType } from 'echarts/core'

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

        let time = dayjs(stock.timestamp).format('MM-DD HH:mm w')

        if (time.slice(6, 11) === '00:00') {
          time = dayjs(stock.timestamp).format('YYYY-MM-DD w')
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
          const scale = renderUtils.getScaledZoom(chart, 0)

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
      min: v => {
        return v.min - (v.max - v.min) * 0.1 - 0.1
      },
      max: v => {
        return v.max + (v.max - v.min) * 0.2 + 0.1
      },
      splitLine: {
        lineStyle: {
          color: 'rgb(31, 32, 33)'
        }
      },
      axisLabel: {
        showMaxLabel: false,
        showMinLabel: false,
        color: v => {
          const scale = renderUtils.getScaledZoom(chart, 0)

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
      min: v => {
        return v.min - (v.max - v.min) * 0.1 - 0.1
      },
      max: v => {
        return v.max + (v.max - v.min) * 0.2 + 0.1
      },
      axisPointer: {
        label: {
          padding: [0, 0, 0, 0],
          formatter: (params: any) => {
            const scale = renderUtils.getScaledZoom(chart, 0)
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

            const start = data[0]

            if (!start || start.length < 2) return TEXT_COLOR

            return `${(((v - start[2]) / start[2]) * 100).toFixed(2)}%`
          }

          return v
        },
        color: v => {
          const scale = renderUtils.getScaledZoom(chart, 0)

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
      minSpan: 1,
      type: 'inside',
      xAxisIndex: [0, 1, 2, 3, 4, 5, 6],
      start: 90,
      end: 100,
      filterMode: 'weakFilter'
    },
    {
      filterMode: 'weakFilter',
      minSpan: 2,
      show: true,
      xAxisIndex: [0, 1, 2, 3, 4, 5, 6],
      type: 'slider',
      bottom: 0,
      start: 90,
      end: 100,
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
  max: v => {
    return v.max + (v.max - v.min) * 0.1 + 0.1
  },
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
  const _options = createOptions(chart)

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
          const scale = renderUtils.getScaledZoom(chart, 0)
          const startDay = xData[scale[0]]
          //获取时间跨度
          const time = dayjs(+xData[scale[1]]).diff(+startDay, 'day')

          if (time < 1) {
            return dayjs(+v).format('HH:mm')
          }

          if (time < 365) {
            return dayjs(+v).format('MM-DD')
          }

          if (time < 365 * 5) {
            return dayjs(+v).format('YY-MM')
          }

          return dayjs(+v).format('YYYY')
        }
        // interval: (index: number) => {
        //   if (isTimeIndexChart(state.timeIndex) && state.timeIndex !== StockChartInterval.FIVE_DAY) {
        //     return index % 15 === 0
        //   }
        //   const scale = renderUtils.getScaledZoom(chart, 0)

        //   const offset = Math.round((scale[1] - scale[0]) / X_AXIS_TICK)

        //   if (offset <= X_AXIS_TICK) {
        //     return index % 4 === 0
        //   }

        //   return (index - scale[0]) % offset === 0
        // }
      },
      axisPointer: {
        label: {
          show: true,
          backgroundColor: '#353535',
          formatter: params => {
            if (params.axisDimension === 'x') {
              let time = dayjs(+params.value).format('MM-DD HH:mm w')
              if (isTimeIndexChart(state.timeIndex) && state.timeIndex !== StockChartInterval.FIVE_DAY) {
                time = dayjs(+params.value).format('YYYY-MM-DD HH:mm')
              } else {
                if (time.slice(6, 11) === '00:00') {
                  time = dayjs(+params.value).format('YYYY-MM-DD w')
                }
              }

              return time
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
  virtualLine.yAxisIndex = 0

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

  Array.isArray(options.series) && options.series.push(virtualLine)

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
        return params.data.yAxis.toFixed(3)
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

/**
 * 渲染主图指标
 */
export const renderMainIndicators = (options: ECOption, indicators: Indicator[]) => {
  /** 合并绘制 */
  const stickLineData: DrawerRectShape[] = []
  const textData: DrawerTextShape[] = []
  indicators.forEach(indicator => {
    if (!indicator.data || indicator.visible === false) {
      return
    }

    indicator.data.forEach(d => {
      if (typeof d === 'string') {
        return
      }

      if (d.style?.style_type === 'NODRAW') {
        return
      }

      if (!d.draw) {
        drawLine(options, {} as any, {
          extra: {
            color: d.style?.color || '#ffffff'
          },
          name: `main_${indicator.id}_${d.name}`,
          xAxisIndex: 0,
          yAxisIndex: 1,
          data: (d.data as number[]).map((s, i) => [i, s])
        })
      } else if (d.draw === 'STICKLINE') {
        const data: DrawerRectShape[] = Object.keys(d.data).map(key => [
          +key,
          ...(d.data as NormalizedRecord<number[]>)[key],
          d.style.color
        ]) as any[]
        stickLineData.push(...data)
      } else if (d.draw === 'DRAWTEXT') {
        const data: DrawerTextShape[] = Object.keys(d.data).map(key => [
          +key,
          ...(d.data as NormalizedRecord<number[]>)[key],
          d.style.color
        ]) as any[]
        textData.push(...data)
      } else if (d.draw === 'DRAWNUMBER') {
        const data = Object.entries(d.data as NormalizedRecord<number[]>).map(([key, value]) => [
          +key,
          ...value,
          d.style.color
        ])

        drawNumber(options, {
          xAxisIndex: 0,
          yAxisIndex: 1,
          data: data as any
        })
      }
    })
  })

  if (stickLineData.length > 0) {
    drawRect(options, {} as any, {
      xAxisIndex: 0,
      yAxisIndex: 1,
      name: 'main_stick_line',
      data: stickLineData
    })
  }

  if (textData.length > 0) {
    drawText(options, {} as any, {
      xAxisIndex: 0,
      yAxisIndex: 1,
      name: 'main_text',
      data: textData
    })
  }
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
      data: stock.data.history.map(o => [dayjs(o[0]).valueOf().toString(), ...o.slice(1)]),
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

  // /**
  //  * 添加legend
  //  */
  // if (!options.legend) {
  //   options.legend = {
  //     show: false,
  //     data: data.map(stock => stock.symbol),
  //     icon: 'rect',
  //     itemWidth: 10,
  //     itemHeight: 10,
  //     borderColor: '#fff',
  //     borderWidth: 1,
  //     emphasis: {
  //       selectorLabel: {
  //         color: 'red'
  //       }
  //     },
  //     itemStyle: {
  //       borderRadius: 0
  //     },
  //     textStyle: {
  //       color: '#fff'
  //     }
  //   }
  // }

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
      const x = dayjs(item.date).hour(0).minute(0).second(0).valueOf().toString()
      const y = (series.data as any[])?.find(s => s[0] === x)?.[2] as number | undefined

      return [x, y, item.event_zh]
    })
    .filter(v => !!v[1]) as [string, number, string][]

  series.markLine?.data?.push(
    ...(data.map(d => [
      { xAxis: d[0], yAxis: d[1], name: mark.title },
      { xAxis: d[0], y: 46 }
    ]) as any)
  )
}

/**
 * 渲染副图
 */
export const renderSecondary = (options: ECOption, indicators: Indicator[]) => {
  /** 合并绘制 */

  indicators.forEach((indicator, index) => {
    if (!indicator.data) {
      return
    }
    if (renderUtils.isLocalIndicator(indicator.id)) return
    const stickLineData: DrawerRectShape[] = []
    const textData: DrawerTextShape[] = []

    indicator.data.forEach(d => {
      if (typeof d === 'string') {
        return
      }

      if (d.style?.style_type === 'NODRAW') {
        return
      }

      if (!d.draw) {
        drawLine(options, {} as any, {
          extra: {
            color: d.style?.color || '#ffffff'
          },
          xAxisIndex: index + 2,
          yAxisIndex: index + 3,
          name: `secondary_${indicator.id}_${d.name}_${index}`,
          data: (d.data as number[]).map((s, i) => [i, s])
        })
      } else if (d.draw === 'STICKLINE') {
        const data: DrawerRectShape[] = Object.keys(d.data).map(key => [
          +key,
          ...(d.data as NormalizedRecord<number[]>)[key].map((s, i) => (i === 2 ? s * 10 : s)),
          d.style.color
        ]) as any[]
        stickLineData.push(...data)
      } else if (d.draw === 'DRAWTEXT') {
        const data: DrawerTextShape[] = Object.keys(d.data).map(key => [
          +key,
          ...(d.data as NormalizedRecord<number[]>)[key],
          d.style.color
        ]) as any[]
        textData.push(...data)
      } else if (d.draw === 'DRAWGRADIENT') {
        const _data = d.data as NormalizedRecord<number[][]>
        const data = Object.keys(d.data).map(key => {
          const start = Number.parseInt(key)
          const points: { x: number; y: number }[] = []
          const p2: { x: number; y: number }[] = []
          _data[key][0].forEach((item: number, i: number) => {
            points.push({ x: i + start, y: item })
          })
          _data[key][1].forEach((item: number, i: number) => {
            p2.unshift({ x: i + start, y: item })
          })

          return [points[0].x, [...points, ...p2], [_data[key][2], _data[key][3]]]
        })

        drawGradient(options, {} as any, {
          xAxisIndex: index + 2,
          name: `secondary_${indicator.id}_${d.name}_${index}`,
          yAxisIndex: index + 3,
          data: data as any
        })
      } else if (d.draw === 'DRAWNUMBER') {
        const data = Object.entries(d.data as NormalizedRecord<number[]>).forEach(([key, value]) => [key, ...value])

        drawNumber(options, {
          xAxisIndex: index + 2,
          yAxisIndex: index + 3,
          name: `secondary_${indicator.id}_${d.name}_${index}`,
          data: data as any
        })
      }
    })

    if (stickLineData.length > 0) {
      drawRect(options, {} as any, {
        xAxisIndex: index + 2,
        yAxisIndex: index + 3,
        data: stickLineData
      })
    }

    if (textData.length > 0) {
      drawText(options, {} as any, {
        xAxisIndex: index + 2,
        yAxisIndex: index + 3,
        data: textData
      })
    }
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
        } else if(d.draw === 'HDLY_LABEL'){
          drawHdlyLabel(options, {} as any, {
            xAxisIndex: index + 2,
            yAxisIndex: index + 3,
            data: d.data,
            extra: {
              color: d.style?.color
            }
          })
        }
        else if (d.draw === 'HORIZONTALLINE') {
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
          ...X0.map((x, i) => [i, 0, x * 1000, 20, 0, x > 0 ? 'magenta' : 'cyan'] as any),
          ...Z.map((z, i) => [i, 0, z * 1000, 20, 0, z > 0 ? 'magenta' : 'cyan'] as any)
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
          const scale = renderUtils.getScaledZoom(chart, 0)

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
  if (!isTimeIndexChart(timeIndex)) {
    options.graphic = []
    return
  }

  if (timeIndex === StockChartInterval.FIVE_DAY){
    options.graphic = []
    return
  }

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
            : '盘中交易',
      fill: 'rgba(255, 255, 255, 0.05)',
      font: 'bold 96px sans-serif',
      align: 'center'
    }
  }

  if (!options.graphic) {
    options.graphic = [watermark]
  } else if (Array.isArray(options.graphic)) {
    options.graphic.push(watermark)
  } else {
    options.graphic = [options.graphic, watermark]
  }
}

/**
 * 配置缩放
 */
export const renderZoom = (options: ECOption, zoom: [number, number]) => {
  if (Array.isArray(options.dataZoom)) {
    for (const z of options.dataZoom) {
      z.start = zoom[0]
      z.end = zoom[1]
    }
  }
}

// /**
//  * 显示坐标轴的线，因为坐标轴要根据dataZoom最左边的点来显示
//  */
// export const renderAxisLine = (state: ChartState, start: number, end: number) => {
//   const rightAxisLine: LineSeriesOption = {
//     type: 'line',
//     name: 'right-axis-line',
//     xAxisIndex: 0,
//     data: [],
//     yAxisIndex: 1,
//     encode: {
//       x: [0],
//       y: [2]
//     },
//     symbol: 'none',
//     lineStyle: {
//       color: 'transparent',
//       width: 1
//     }
//   }

//   if (state.yAxis.right === 'price') {
//     rightAxisLine.data = state.mainData.history
//   } else {
//     rightAxisLine.data = state.mainData.history.map((h, i) => {
//       /**
//        * 1.01，x轴100%是state.mainData.length * 1.01，100%的时候要向左偏移0.01
//        * 所以对应data的100%其实是100/1.01 = 98.02%
//        * 所以差值是100 - 98.02 = 1.98
//        */
//       const _start = start + 0.95 > 100 ? 100 : start + 0.95
//       const _end = end + 0.95 > 100 ? 100 : end + 0.95

//       const startIndex = Math.round((_start / 100) * (state.mainData.history.length - 1))
//       const endIndex = Math.round((_end / 100) * (state.mainData.history.length - 1))
//       if (i < startIndex) {
//         return 0
//       }
//       if (i > endIndex) {
//         return (
//           ((state.mainData.history[endIndex][2] - state.mainData.history[startIndex][2]) /
//             state.mainData.history[startIndex][2]) *
//           100
//         )
//       }
//       return ((h[2] - state.mainData.history[startIndex][2]) / state.mainData.history[startIndex][2]) * 100
//     })
//   }

//   return rightAxisLine
// }
