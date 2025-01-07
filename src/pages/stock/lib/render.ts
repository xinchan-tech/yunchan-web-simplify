import { StockChartInterval, type StockRawRecord, type getStockChart } from '@/api'
import { useConfig } from '@/store'
import { dateToWeek, getTradingPeriod } from '@/utils/date'
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
  calcTradePoints,
  calculateMA,
  calculateTradingPoint
} from './coilling'
import { renderUtils } from './utils'
import type { GraphicComponentOption } from 'echarts/components'
import type { DataZoomComponentOption, YAXisOption } from 'echarts/types/dist/shared'

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
      const errData = (v as any[]).find(_v => _v.seriesName === MAIN_CHART_NAME)
      const priceData = (v as any[]).find(_v => _v.seriesName === MAIN_CHART_NAME_VIRTUAL)
      if (!errData) return ''
      const data = errData?.seriesType === 'candlestick' ? errData?.value.slice(1) : (errData.value as StockRawRecord)

      data[0] = dayjs(+priceData.value[0]).format('YYYY-MM-DD HH:mm:ss')
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
    label: {}
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
      boundaryGap: false,
      axisLabel: {
        show: false,
        formatter: (v: any) => {
          return v ? dayjs(v).format('MM-DD') : ''
        }
      },
      min: 'dataMin',
      max: v => {
        return v.max + Math.round((v.max - v.min) * 0.01)
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: 'rgb(31, 32, 33)'
        }
      },
      axisPointer: {
        z: 100
      }
    }
  ],
  yAxis: [
    {
      scale: true,
      gridIndex: 0,
      position: 'left',
      show: true,
      axisPointer: {
        label: {
          show: false
        }
      },
      min: v => {
        return v.min - (v.max - v.min) * 0.1
      },
      max: v => {
        return v.max + (v.max - v.min) * 0.1
      },
      splitLine: {
        lineStyle: {
          color: 'rgb(31, 32, 33)'
        }
      }
    },
    {
      scale: true,
      show: true,
      gridIndex: 0,
      position: 'right',
      splitLine: {
        show: false
      },
      min: v => {
        return v.min - (v.max - v.min) * 0.1
      },
      max: v => {
        return v.max + (v.max - v.min) * 0.1
      },
      axisLabel: {}
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
  const grids = renderUtils.calcGridSize(size, state.secondaryIndicators.length, !!state.yAxis.left)

  options.grid = grids

  const yAxis = options.yAxis as YAXisOption[]

  if (Array.isArray(options.xAxis)) {
    const xAxis = options.xAxis?.find(x => x.id === 'main-x')
    if (xAxis) {
      if (isTimeIndexChart(state.timeIndex) && state.timeIndex !== StockChartInterval.FIVE_DAY) {
        ;(xAxis as any).data = getTradingPeriod(
          state.timeIndex === StockChartInterval.PRE_MARKET
            ? 'preMarket'
            : state.timeIndex === StockChartInterval.AFTER_HOURS
              ? 'afterHours'
              : 'intraDay',
          dayjs(+state.mainData.history[0]?.[0])
        ).map(item => dayjs(item).valueOf().toString())
        xAxis.max = (xAxis as any).data.length
        ;(xAxis.axisLabel as any)!.interval = (index: number) => {
          return index % 15 === 0
        }
      } else {
        ;(xAxis as any).data = state.mainData.history.map(item => item[0])
      }
    }
  }

  // 分时图不允许缩放
  if (isTimeIndexChart(state.timeIndex)) {
    options.dataZoom = []
  }

  if (options.axisPointer && !Array.isArray(options.axisPointer)) {
    options.axisPointer.label!.formatter = params => {
      if (params.axisDimension === 'x') {
        let time = dayjs(+params.value).format('MM-DD hh:mm') + dateToWeek(params.value as string, '周')
        if (isTimeIndexChart(state.timeIndex) && state.timeIndex !== StockChartInterval.FIVE_DAY) {
          time = dayjs(+params.value).format('YYYY-MM-DD hh:mm')
        }

        return time
      }

      return Decimal.create(params.value as string).toFixed(3)
    }
  }

  if (state.yAxis.left) {
    const left = yAxis[0]
    if (left) {
      left.show = true
      if (left.axisPointer?.label) {
        left.axisPointer.label.show = true
      }
    }
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

  const upColor = getStockColor(true, 'hex')
  const downColor = getStockColor(false, 'hex')

  const yAxisIndex = state.yAxis.right === 'price' ? 1 : 0

  if (state.type === 'k-line') {
    mainSeries.type = 'candlestick'
    mainSeries.itemStyle = {
      color: upColor,
      color0: downColor,
      borderColor: upColor,
      borderColor0: downColor
    }
    mainSeries.data = data
    mainSeries.yAxisIndex = yAxisIndex
    mainSeries.encode = {
      x: [1],
      y: [2, 3, 5, 4]
    }
  } else {
    let color = '#4784cf'

    const lastData = StockRecord.of('', '', data[data.length - 1])

    if (isTimeIndexChart(state.timeIndex)) {
      color = getStockColor(lastData.isUp, 'hex')
    }
    const rgbColor = colorUtil.hexToRGB(color)
    const _mainSeries = mainSeries as LineSeriesOption
    _mainSeries.type = 'line'
    _mainSeries.showSymbol = false
    _mainSeries.encode = {
      x: [0],
      y: [2]
    }
    mainSeries.yAxisIndex = yAxisIndex
    _mainSeries.data = data
    mainSeries.color = color
    ;(mainSeries as any).areaStyle = {
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

  if (state.yAxis.right !== 'price') {
    const zoom = options.dataZoom as DataZoomComponentOption[]
    if (Array.isArray(zoom) && zoom[0]) {
      const axisLine = renderAxisLine(state, zoom[0].start!, zoom[0].end!)
      Array.isArray(options.series) && options.series.push(axisLine as any)
    }
  }

  Array.isArray(options.series) && options.series.push(virtualLine)

  // 如果grid > 1 ，取消显示axisPointer标签
  if (Array.isArray(options.xAxis)) {
    const xAxis = options.xAxis.find(y => y.id === 'main-x')

    if (xAxis) {
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
        ;(xAxis.axisLabel as any)!.formatter = (v: any, index: number) => {
          return v
            ? index % 2 === 0
              ? isTimeIndexChart(state.timeIndex) && state.timeIndex !== StockChartInterval.FIVE_DAY
                ? dayjs(+v).format('hh:mm')
                : dayjs(+v).format('MM-DD')
              : ''
            : ''
        }
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

  const lineColor = getStockColor(lastData.isUp, 'hex')

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
}

/**
 * 主图缠论
 */
export const renderMainCoiling = (options: ECOption, state: ChartState) => {
  if (state.mainCoiling.length === 0) return options
  const points = calcCoilingPoints(state.mainData.history, state.mainData.coiling_data)
  const pivots = calcCoilingPivots(state.mainData.coiling_data, points)
  const expands = calcCoilingPivotsExpands(state.mainData.coiling_data, points)
  const yAxisIndex = state.yAxis.right === 'price' ? 1 : 0
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
      drawPolyline(options, {} as any, { xAxisIndex: 0, yAxisIndex: yAxisIndex, data: p, extra: { color: '#ffffff' } })
    } else if (coiling === CoilingIndicatorId.PIVOT) {
      drawPivots(options, {} as any, { xAxisIndex: 0, yAxisIndex: yAxisIndex, data: expands as any })
      drawPivots(options, {} as any, { xAxisIndex: 0, yAxisIndex: yAxisIndex, data: pivots as any })
    } else if (
      [CoilingIndicatorId.ONE_TYPE, CoilingIndicatorId.TWO_TYPE, CoilingIndicatorId.THREE_TYPE].includes(coiling)
    ) {
      const tradePoints = calcTradePoints(state.mainData.coiling_data, points, coiling as any)
      drawTradePoints(options, {} as any, { xAxisIndex: 0, yAxisIndex: yAxisIndex, data: tradePoints })
    } else if (coiling === CoilingIndicatorId.SHORT_LINE) {
      const cma = calculateMA(20, state.mainData.history)
      const cma2 = calculateMA(30, state.mainData.history)
      drawLine(options, {} as any, {
        yAxisIndex: yAxisIndex,
        xAxisIndex: 0,
        data: cma.map((s, i) => [i, s]),
        extra: {
          color: 'rgb(186, 64, 127)'
        }
      })
      drawLine(options, {} as any, {
        yAxisIndex: yAxisIndex,
        xAxisIndex: 0,
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
        yAxisIndex: yAxisIndex,
        xAxisIndex: 0,
        data: cma.map((s, i) => [i, s]),
        extra: {
          color: 'rgb(250,28,19)'
        }
      })
      drawLine(options, {} as any, {
        yAxisIndex: yAxisIndex,
        xAxisIndex: 0,
        data: cma1.map((s, i) => [i, s]),
        extra: {
          color: 'rgb(255,255,255)'
        }
      })
      drawLine(options, {} as any, {
        yAxisIndex: yAxisIndex,
        xAxisIndex: 0,
        data: cma2.map((s, i) => [i, s]),
        extra: {
          color: 'rgb(51,251,41)'
        }
      })
      drawLine(options, {} as any, {
        yAxisIndex: yAxisIndex,
        xAxisIndex: 0,
        data: cma3.map((s, i) => [i, s]),
        extra: {
          color: 'rgb(51,251,41)'
        }
      })
      drawLine(options, {} as any, {
        yAxisIndex: yAxisIndex,
        xAxisIndex: 0,
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
    } else if (indicator.id === '10') {
      const { S1, S2, X0, Z } = calculateTradingPoint(state.mainData.history)

      drawRect(options, {} as any, {
        xAxisIndex: index + 1,
        yAxisIndex: index + 2,
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
        xAxisIndex: index + 1,
        yAxisIndex: index + 2,
        data: S1.map((s, i) => [i, s * 1000])
      })
      drawLine(options, {} as any, {
        extra: {
          color: 'white',
          type: 'solid',
          z: 10
        },
        xAxisIndex: index + 1,
        yAxisIndex: index + 2,
        data: S2.map((s, i) => [i, s * 1000])
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
      data: [...(options.xAxis[0] as any).data],
      boundaryGap: false,
      axisLine: {
        onZero: false,
        lineStyle: {
          color: 'rgb(31, 32, 33)'
        }
      },
      axisLabel: {
        show: index === state.secondaryIndicators.length - 1,
        color: '#fff',
        formatter: (v: any, index) => {
          console.log(index)
          return v
            ? index % 2 === 0
              ? isTimeIndexChart(state.timeIndex) && state.timeIndex !== StockChartInterval.FIVE_DAY
                ? dayjs(+v).format('hh:mm')
                : dayjs(+v).format('MM-DD')
              : ''
            : ''
        },
        interval:
          isTimeIndexChart(state.timeIndex) && state.timeIndex !== StockChartInterval.FIVE_DAY
            ? index => {
                return index % 15 === 0
              }
            : undefined
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
      max:
        isTimeIndexChart(state.timeIndex) && state.timeIndex !== StockChartInterval.FIVE_DAY
          ? (options.xAxis[0] as any).data.length
          : v => {
              return v.max + Math.round((v.max - v.min) * 0.01)
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

/**
 * 显示坐标轴的线，因为坐标轴要根据dataZoom最左边的点来显示
 */
export const renderAxisLine = (state: ChartState, start: number, end: number) => {
  const rightAxisLine: LineSeriesOption = {
    type: 'line',
    name: 'right-axis-line',
    xAxisIndex: 0,
    data: [],
    yAxisIndex: 1,
    encode: {
      x: [0],
      y: [2]
    },
    symbol: 'none',
    lineStyle: {
      color: 'transparent',
      width: 1
    }
  }

  if (state.yAxis.right === 'price') {
    rightAxisLine.data = state.mainData.history
  } else {
    rightAxisLine.data = state.mainData.history.map((h, i) => {
      /**
       * 1.01，x轴100%是state.mainData.length * 1.01，100%的时候要向左偏移0.01
       * 所以对应data的100%其实是100/1.01 = 98.02%
       * 所以差值是100 - 98.02 = 1.98
       */
      const _start = start + 0.95 > 100 ? 100 : start + 0.95
      const _end = end + 0.95 > 100 ? 100 : end + 0.95

      const startIndex = Math.round((_start / 100) * (state.mainData.history.length - 1))
      const endIndex = Math.round((_end / 100) * (state.mainData.history.length - 1))
      if (i < startIndex) {
        return 0
      }
      if (i > endIndex) {
        return (
          ((state.mainData.history[endIndex][2] - state.mainData.history[startIndex][2]) /
            state.mainData.history[startIndex][2]) *
          100
        )
      }
      return ((h[2] - state.mainData.history[startIndex][2]) / state.mainData.history[startIndex][2]) * 100
    })
  }

  return rightAxisLine
}
