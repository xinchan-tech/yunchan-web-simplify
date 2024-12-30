import { StockChartInterval, type StockRawRecord, type getStockChart } from '@/api'
import { useConfig } from '@/store'
import { dateToWeek } from '@/utils/date'
import type { ECOption } from '@/utils/echarts'
import { StockRecord } from '@/utils/stock'
import { colorUtil } from '@/utils/style'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import type { CandlestickSeriesOption, LineSeriesOption } from 'echarts/charts'
import { CoilingIndicatorId, type Indicator, type KChartState, isTimeIndexChart } from './ctx'
import {
  type DrawerRectShape,
  type DrawerTextShape,
  drawGradient,
  drawLine,
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
  calcCoilingPoints,
  calcTradePoints
} from './coilling'
import { renderUtils } from './utils'
import type { GraphicComponentOption } from 'echarts/components'
import type { YAXisOption } from 'echarts/types/dist/shared'

const MAIN_CHART_NAME = 'kChart'
const MAIN_CHART_NAME_VIRTUAL = 'kChart-virtual'

type ChartState = ArrayItem<KChartState['state']>

/**
 * 主图通用配置
 */
export const createOptions = (): ECOption => ({
  animation: false,
  grid: [
    {
      left: 0,
      right: '6%',
      height: '97%'
    }
  ],
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
      const errData = (v as any[]).find(_v => _v.axisId === 'main-x')

      if (!errData) return ''
      const data = errData?.seriesType === 'candlestick' ? errData?.value.slice(1) : (errData.value as StockRawRecord)

      data[0] = dayjs(+data[0]).format('YYYY-MM-DD HH:mm:ss')

      const stock = StockRecord.of('', '', data)

      let time = stock.time ? dayjs(stock.time).format('MM-DD hh:mm') + dateToWeek(stock.time, '周') : '-'
      if (stock.time?.slice(11) === '00:00:00') {
        time = stock.time.slice(0, 11) + dateToWeek(stock.time, '周')
      }

      return `
          <span class="text-xs">
           ${time}<br/>
          开盘&nbsp;&nbsp;${Decimal.create(stock.open).toFixed(3)}<br/>
          最高&nbsp;&nbsp;${Decimal.create(stock.high).toFixed()}<br/>
          最低&nbsp;&nbsp;${Decimal.create(stock.low).toFixed()}<br/>
          收盘&nbsp;&nbsp;${Decimal.create(stock.close).toFixed()}<br/>
          涨跌额&nbsp;&nbsp;${`<span class="${stock.isUp ? 'text-stock-up' : 'text-stock-down'}">${stock.isUp ? '+' : ''}${Decimal.create(stock.percentAmount).toFixed(3)}</span>`}<br/>
          涨跌幅&nbsp;&nbsp;${`<span class="${stock.isUp ? 'text-stock-up' : 'text-stock-down'}">${stock.isUp ? '+' : ''}${Decimal.create(stock.percent).mul(100).toFixed(2)}%</span>`}<br/>
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
    label: {
      formatter: params => {
        if (params.axisDimension === 'x') {
          let time = dayjs(params.value).format('MM-DD hh:mm') + dateToWeek(params.value as string, '周')
          if ((params.value as string).slice(11) === '00:00:00') {
            time = (params.value as string).slice(0, 11) + dateToWeek(params.value as string, '周')
          }

          return time
        }

        return Decimal.create(params.value as string).toFixed(3)
      }
    }
  },
  toolbox: {},
  xAxis: [
    {
      type: 'category',
      id: 'main-x',
      gridIndex: 0,
      axisLine: { onZero: false, show: false },
      axisTick: {
        show: false
      },
      axisLabel: {
        show: false,
        formatter: (v: any) => {
          return v ? dayjs(v).format('MM-DD') : ''
        }
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgb(31, 32, 33)'
        }
      },
      min: 'dataMin',
      max: v => {
        return Math.round(v.max * 1.01)
      },
      axisPointer: {
        z: 100
      }
    }
  ],
  yAxis: [
    {
      id: 'main-price',
      scale: true,
      gridIndex: 0,
      position: 'left',
      show: true,
      axisPointer: {
        label: {
          show: false
        }
      },
      max: renderUtils.calcAxisMax,
      splitLine: {
        lineStyle: {
          color: 'rgb(31, 32, 33)'
        }
      }
    },
    {
      id: 'main-right',
      scale: true,
      show: true,
      gridIndex: 0,
      position: 'right',
      max: renderUtils.calcAxisMax,
      splitLine: {
        show: false,
        lineStyle: {
          color: 'rgb(31, 32, 33)'
        }
      }
    }
  ],
  series: []
})

type ChartRender = (
  options: ECOption,
  state: ChartState,
  data?: Awaited<ReturnType<typeof getStockChart>>,
  secondary?: boolean
) => void

/**
 * 渲染图表
 */
export const renderChart = (): ECOption => {
  const _options = createOptions()

  _options.dataZoom = [
    {
      minSpan: 1,
      type: 'inside',
      xAxisIndex: [0, 1, 2, 3, 4, 5],
      start: 90,
      end: 100,
      filterMode: 'weakFilter'
    },
    {
      fillerColor: 'weakFilter',
      minSpan: 2,
      show: true,
      xAxisIndex: [0, 1, 2, 3, 4, 5],
      type: 'slider',
      bottom: 0,
      start: 90,
      end: 100,
      backgroundColor: 'transparent',
      dataBackground: {
        lineStyle: {
          color: 'rgb(31, 32, 33)'
        }
      },
      borderColor: 'rgb(31, 32, 33)',
      labelFormatter: (_, e) => {
        return e
      }
    }
  ]

  return _options
}

/**
 * 渲染布局
 */
export const renderGrid = (options: ECOption, state: ChartState, size: [number, number]) => {
  /**
   * 布局策略
   * 1. 无副图 -> 主图占满, 底部留出24显示标签
   * 2. 副图 <= 3 -> 副图占20% * 副图数量，底部留24标签
   * 3. 副图 > 3 -> 副图占60%平均分，底部留24标签
   *
   * 左右留出50px显示标签
   */
  // const Y_AXIS_WIDTH = 50
  // const X_AXIS_HEIGHT = 24
  // const [width, height] = size

  // const gridLeft = state.yAxis.left ? Y_AXIS_WIDTH: 0

  // const gridSize = [
  //   width - Y_AXIS_WIDTH - gridLeft,
  //   height - X_AXIS_HEIGHT
  // ]

  // const grid = []

  // const tops = renderUtils.calcGridTopByGridIndex(state.secondaryIndicators.length)
  const grids = renderUtils.calcGridSize(size, state.secondaryIndicators.length, !!state.yAxis.left)

  options.grid = grids

  const yAxis = options.yAxis as YAXisOption[]

  if (state.yAxis.left) {
    const left = yAxis.find(axis => axis.id === 'main-price')
    if (left) {
      // left.show = true
    }
  }

  for (let i = 0; i < state.secondaryIndicators.length; i++) {
    renderSecondaryAxis(options, state, i)
  }
  return options
}

/**
 * 渲染主图
 */
export const renderMainChart: ChartRender = (options, state) => {
  const mainSeries = { name: MAIN_CHART_NAME } as LineSeriesOption | CandlestickSeriesOption
  mainSeries.yAxisIndex = 0
  mainSeries.xAxisIndex = 0
  const { getStockColor } = useConfig.getState()

  const data = state.mainData.history

  if (!data || data.length === 0) return options

  if (state.type === 'k-line') {
    mainSeries.type = 'candlestick'
    mainSeries.itemStyle = {
      color: `hsl(${getStockColor(true)})`,
      color0: `hsl(${getStockColor(false)})`,
      borderColor: `hsl(${getStockColor(true)})`,
      borderColor0: `hsl(${getStockColor(false)})`
    }
    mainSeries.data = state.mainData.history ?? []
    mainSeries.yAxisId = 'main-price'
    mainSeries.encode = {
      x: [1],
      y: [2, 3, 5, 4]
    }
  } else {
    let color = getStockColor()

    const lastData = StockRecord.of('', '', data[data.length - 1])

    if (isTimeIndexChart(state.timeIndex)) {

      color = getStockColor(lastData.isUp)
    }

    const _mainSeries = mainSeries as LineSeriesOption
    _mainSeries.type = 'line'
    _mainSeries.showSymbol = false
    _mainSeries.encode = {
      x: [0],
      y: [2]
    }
    mainSeries.yAxisId = 'main-price'
    _mainSeries.data = state.mainData.history ?? []
    mainSeries.color = `rgba(${color})`
    ;(mainSeries as any).areaStyle = {
      color: {
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          {
            offset: 0,
            color: `hsl(${color} / 100)` /* 0% 处的颜色*/
          },
          {
            offset: 0.6,
            color: `hsl(${color} / 20)` /* 100% 处的颜色*/
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

  const stocks = data
    .map(item => StockRecord.of('', '', item))
    .map(stock => [stock.time, state.yAxis.right === 'price' ? stock.close : stock.percent])

  Array.isArray(options.series) &&
    options.series.push({
      name: 'price',
      type: 'line',
      data: stocks,
      encode: {
        x: [0],
        y: [1]
      },
      xAxisIndex: 0,
      yAxisId: 'main-right',
      showSymbol: false,
      lineStyle: {
        color: 'transparent'
      }
    })

  // 如果grid > 1 ，取消显示axisPointer标签
  if (Array.isArray(options.xAxis)) {
    const xAxis = options.xAxis.find(y => y.id === 'main-x')

    if (xAxis) {
      ;(xAxis as any).data = state.mainData.history.map(item => item[0])

      if (Array.isArray(options.grid) && options.grid.length > 1) {
        xAxis.axisPointer = {
          label: {
            show: false,
            formatter: (v: any) => {
              return v.value.slice(5, 11)
            }
          }
        }
      } else {
        xAxis.axisLabel!.show = true
      }
    }
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
  const lastData = StockRecord.of('', '', data[data.length - 1])

  const lineColor = `hsl(${getStockColor(lastData.isUp)})`

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
          x: '96%'
        }
      ]
    ]
  }

  // 虚拟线
  const virtualLine = JSON.parse(JSON.stringify(mainSeries)) as LineSeriesOption

  virtualLine.name = MAIN_CHART_NAME_VIRTUAL
  virtualLine.type = 'line'

  virtualLine.encode = {
    x: [0],
    y: [2]
  }

  virtualLine.color = 'transparent'
  virtualLine.symbol = 'none'
  virtualLine.itemStyle = {}

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
}

/**
 * 主图缠论
 */
export const renderMainCoiling = (options: ECOption, state: ChartState) => {
  if (state.mainCoiling.length === 0) return options
  const points = calcCoilingPoints(state.mainData.history, state.mainData.coiling_data)
  const pivots = calcCoilingPivots(state.mainData.coiling_data, points)
  const expands = calcCoilingPivotsExpands(state.mainData.coiling_data, points)
  state.mainCoiling.forEach(coiling => {
    if (coiling === CoilingIndicatorId.PEN) {
      const p: any[] = []
      points.slice(1).forEach((point, index) => {
        const prev = points[index]
        p.push([
          prev.xIndex,
          prev.y,
          point.xIndex,
          point.y,
          index === points.length - 2 && state.mainData.coiling_data?.status !== 1 ? LineType.DASH : LineType.SOLID
        ])
      })
      drawPolyline(options, {} as any, { xAxisIndex: 0, yAxisIndex: 0, data: p, extra: { color: '#ffffff' } })
    } else if (coiling === CoilingIndicatorId.PIVOT) {
      drawPivots(options, {} as any, { xAxisIndex: 0, yAxisIndex: 0, data: expands as any })
      drawPivots(options, {} as any, { xAxisIndex: 0, yAxisIndex: 0, data: pivots as any })
    } else if (
      [CoilingIndicatorId.ONE_TYPE, CoilingIndicatorId.TWO_TYPE, CoilingIndicatorId.THREE_TYPE].includes(coiling)
    ) {
      const tradePoints = calcTradePoints(state.mainData.coiling_data, points, coiling as any)
      drawTradePoints(options, {} as any, { xAxisIndex: 0, yAxisIndex: 0, data: tradePoints })
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
    if (!indicator.data) {
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
          xAxisIndex: 0,
          yAxisIndex: 0,
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
      }
    })
  })

  if (stickLineData.length > 0) {
    drawRect(options, {} as any, {
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: stickLineData
    })
  }

  if (textData.length > 0) {
    drawText(options, {} as any, {
      xAxisIndex: 0,
      yAxisIndex: 0,
      data: textData
    })
  }
}

/**
 * 股票叠加
 */
export const renderOverlay = (options: ECOption, data?: ChartState['overlayStock']) => {
  if (!data || data.length === 0) return options

  data.forEach(stock => {
    const series: LineSeriesOption = {
      name: stock.symbol,
      smooth: true,
      symbol: 'none',
      type: 'line',
      data: stock.data.history.map(o => [dayjs(o[0]).valueOf().toString(), ...o.slice(1)]),
      encode: {
        x: [0],
        y: [2]
      },
      yAxisIndex: 0,
      xAxisIndex: 0
    }

    if (!options.series) {
      options.series = [series]
    } else {
      Array.isArray(options.series) && options.series.push(series)
    }
  })

  /**
   * 添加legend
   */
  if (!options.legend) {
    options.legend = {
      data: data.map(stock => stock.symbol),
      icon: 'rect',
      itemWidth: 10,
      itemHeight: 10,
      itemStyle: {
        borderRadius: 0
      },
      textStyle: {
        color: '#fff'
      }
    }
  }

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
          xAxisIndex: index + 1,
          yAxisIndex: index + 2,
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
          xAxisIndex: index + 1,
          yAxisIndex: index + 2,
          data: data as any
        })
      }
    })

    if (stickLineData.length > 0) {
      drawRect(options, {} as any, {
        xAxisIndex: index + 1,
        yAxisIndex: index + 2,
        data: stickLineData
      })
    }

    if (textData.length > 0) {
      drawText(options, {} as any, {
        xAxisIndex: index + 1,
        yAxisIndex: index + 2,
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
            xAxisIndex: index + 1,
            yAxisIndex: index + 2,
            data: d.data,
            extra: {
              color: d.style?.color
            }
          })
        } else {
          drawLine(options, {} as any, {
            extra: {
              color: d.style?.color,
              type: d.style?.style_type
            },
            xAxisIndex: index + 1,
            yAxisIndex: index + 2,
            data: (d.data as number[]).map((s, i) => [i, s])
          })
        }
      })
    }
  })
}

/**
 * 渲染坐标轴
 */
const renderSecondaryAxis = (options: ECOption, state: KChartState['state'][0], index: number) => {
  Array.isArray(options.xAxis) &&
    options.xAxis.push({
      type: 'category',
      gridIndex: index + 1,
      data: state.mainData.history.map(item => item[0]),
      axisLine: {
        onZero: false,
        lineStyle: {
          color: 'rgb(31, 32, 33)'
        }
      },
      axisLabel: {
        show: index === state.secondaryIndicators.length - 1,
        color: '#fff',
        formatter: (v: any) => {
          return v ? dayjs(v).format('MM-DD') : ''
        }
      },
      axisTick: {
        show: false
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgb(31, 32, 33)'
        }
      },
      min: 'dataMin',
      max: v => {
        return Math.round(v.max * 1.01)
      },
      axisPointer: {
        z: 100,
        label: {
          show: index + 1 === state.secondaryIndicators.length
        }
      }
    })

  Array.isArray(options.yAxis) &&
    options.yAxis.push({
      scale: true,
      gridIndex: index + 1,
      max: v => {
        return Math.round(v.max * 1.1)
      },
      position: 'right',
      id: `secondary-${index}`,
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
    })

  return options
}

/**
 * 渲染水印
 * 只有在盘前盘中盘后显示
 */
export const renderWatermark = (options: ECOption, timeIndex: ChartState['timeIndex']) => {
  if (!isTimeIndexChart(timeIndex)) return

  if (timeIndex === StockChartInterval.FIVE_DAY) return

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
