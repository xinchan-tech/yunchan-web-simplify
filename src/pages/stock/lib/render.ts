import { StockChartInterval, type StockRawRecord, type getStockChart } from '@/api'
import { useConfig } from '@/store'
import { dateToWeek } from '@/utils/date'
import type { ECOption } from '@/utils/echarts'
import { numToFixed } from '@/utils/price'
import { StockRecord } from '@/utils/stock'
import { colorUtil } from '@/utils/style'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import type { CandlestickSeriesOption, LineSeriesOption } from 'echarts/charts'
import { cloneDeep } from 'lodash-es'
import { CoilingIndicatorId, type Indicator, type IndicatorData, type KChartState, isTimeIndexChart } from './ctx'
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
import type { GraphicComponentOption } from "echarts/components"

const MAIN_CHART_NAME = 'kChart'
const MAIN_CHART_NAME_VIRTUAL = 'kChart-virtual'

type ChartState = ArrayItem<KChartState['state']>

/**
 * 主图通用配置
 */
export const options: ECOption = {
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
      let time = dayjs(stock.time).format('MM-DD hh:mm') + dateToWeek(stock.time, '周')
      if (stock.time.slice(11) === '00:00:00') {
        time = stock.time.slice(0, 11) + dateToWeek(stock.time, '周')
      }

      return `
          <span class="text-xs">
           ${time}<br/>
          开盘&nbsp;&nbsp;${numToFixed(stock.open, 3)}<br/>
          最高&nbsp;&nbsp;${numToFixed(stock.high)}<br/>
          最低&nbsp;&nbsp;${numToFixed(stock.low)}<br/>
          收盘&nbsp;&nbsp;${numToFixed(stock.close)}<br/>
          涨跌额&nbsp;&nbsp;${`<span class="${stock.percentAmount >= 0 ? 'text-stock-up' : 'text-stock-down'}">${stock.percentAmount >= 0 ? '+' : ''}${numToFixed(stock.percentAmount, 3)}</span>`}<br/>
          涨跌幅&nbsp;&nbsp;${`<span class="${stock.percentAmount >= 0 ? 'text-stock-up' : 'text-stock-down'}">${stock.percentAmount >= 0 ? '+' : ''}${Decimal.create(stock.percent).mul(100).toFixed(2)}%</span>`}<br/>
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
          return dayjs(v).format('MM-DD')
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
      id: 'main-y',
      scale: true,
      gridIndex: 0,
      position: 'right',
      max: renderUtils.calcAxisMax,
      splitLine: {
        lineStyle: {
          color: 'rgb(31, 32, 33)'
        }
      }
    }
  ],
  series: []
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
export const renderChart = (state: ChartState, data?: Awaited<ReturnType<typeof getStockChart>>): ECOption => {
  const chain: ChartRender[] = [renderGrid, renderMainChart, renderMarkLine]
  const _options = cloneDeep(options)

  options.dataZoom = [
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

  for (const fn of chain) {
    fn(_options, state, data)
  }

  return _options
}

/**
 * 渲染布局
 */
export const renderGrid: ChartRender = (options, state) => {
  /**
   * 布局策略
   * 1. 无副图 -> 主图占满, 底部留出24显示标签
   * 2. 副图 <= 3 -> 副图占20% * 副图数量，底部留24标签
   */
  const grid = []
  if (state.secondaryIndicators.length === 0) {
    grid.push({
      top: 1,
      left: 0,
      right: '4%',
      bottom: 24
    })
  } else if (state.secondaryIndicators.length <= 3) {
    grid.push({
      top: 4,
      left: 0,
      right: '4%',
      height: `${20 * (5 - state.secondaryIndicators.length)}%`
    })

    for (let i = 0; i < state.secondaryIndicators.length; i++) {
      if (i !== state.secondaryIndicators.length - 1) {
        grid.push({
          left: 0,
          right: '4%',
          top: `${20 * (5 - state.secondaryIndicators.length) + 20 * i + 0.4}%`,
          height: '20%'
        })
      } else {
        grid.push({
          left: 0,
          right: '4%',
          top: `${20 * (5 - state.secondaryIndicators.length) + 20 * i + 0.4}%`,
          bottom: 24
        })
      }
    }
  } else {
    grid.push({
      top: 4,
      left: 0,
      right: '4%',
      height: '40%'
    })

    for (let i = 0; i < state.secondaryIndicators.length; i++) {
      // 60%平均分
      grid.push({
        left: 0,
        right: '4%',
        top: `${40 + (60 / state.secondaryIndicators.length) * i}%`,
        height: `${60 / state.secondaryIndicators.length}%`
      })
    }
  }

  options.grid = grid

  for (let i = 0; i < state.secondaryIndicators.length; i++) {
    renderSecondaryAxis(options, state, i)
  }
  return options
}

/**
 * 渲染主图
 */
export const renderMainChart: ChartRender = (options, state, data) => {
  const mainSeries = { name: MAIN_CHART_NAME } as LineSeriesOption | CandlestickSeriesOption
  mainSeries.yAxisIndex = 0
  mainSeries.xAxisIndex = 0
  const { getStockColor } = useConfig.getState()

  if (!data) return options

  if (state.type === 'k-line') {
    mainSeries.type = 'candlestick'
    mainSeries.itemStyle = {
      color: getStockColor(true),
      color0: getStockColor(false),
      borderColor: getStockColor(true),
      borderColor0: getStockColor(false)
    }
    mainSeries.data = state.mainData.history ?? []
    mainSeries.encode = {
      x: [1],
      y: [2, 3, 5, 4]
    }
  } else {
    let color = Object.values(colorUtil.hexToRGB('#4a65bf') ?? {}).join(',')

    const lastData = StockRecord.of('', '', data.history[data.history.length - 1])

    if (isTimeIndexChart(state.timeIndex)) {
      const _color = getStockColor(lastData.isUp)

      color = Object.values(colorUtil.hexToRGB(_color) ?? {}).join(',')
    }
    const _mainSeries = mainSeries as LineSeriesOption
    _mainSeries.type = 'line'
    _mainSeries.showSymbol = false
    _mainSeries.encode = {
      x: [0],
      y: [2]
    }
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
            color: `rgba(${color}, .35)` /* 0% 处的颜色*/
          },
          {
            offset: 0.6,
            color: `rgba(${color}, .2)` /* 100% 处的颜色*/
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
export const renderMarkLine: ChartRender = (options, _, data) => {
  if (!options.series && !Array.isArray(options.series)) return options
  if (!data) return options

  const mainSeries = (options.series as any[]).find(s => s.name === MAIN_CHART_NAME)!

  const { getStockColor } = useConfig.getState()
  const lastData = StockRecord.of('', '', data.history[data.history.length - 1])

  const lineColor = getStockColor(lastData.percentAmount >= 0)

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
          yAxis: data?.history[data?.history.length - 1][2] ?? 0
        },
        {
          yAxis: data?.history[data?.history.length - 1][2] ?? 0,
          x: '96%'
        }
      ]
    ]
  }

  // 虚拟线
  const virtualLine = cloneDeep(mainSeries) as LineSeriesOption
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
      drawPolyline(options, {} as any, { index: 0, data: p, extra: { color: '#ffffff' } })
    } else if (coiling === CoilingIndicatorId.PIVOT) {
      drawPivots(options, {} as any, { index: 0, data: expands as any })
      drawPivots(options, {} as any, { index: 0, data: pivots as any })
    } else if (
      [CoilingIndicatorId.ONE_TYPE, CoilingIndicatorId.TWO_TYPE, CoilingIndicatorId.THREE_TYPE].includes(coiling)
    ) {
      const tradePoints = calcTradePoints(state.mainData.coiling_data, points, coiling as any)
      drawTradePoints(options, {} as any, { index: 0, data: tradePoints })
    }
  })
}

/**
 * 渲染主图指标
 */
export const renderMainIndicators = (options: ECOption, indicators: Indicator[], data: IndicatorData[]) => {
  /** 合并绘制 */
  const stickLineData: DrawerRectShape[] = []
  const textData: DrawerTextShape[] = []

  indicators.forEach((_, index) => {
    if (!data[index]) {
      return
    }

    const indicatorData = data[index]

    indicatorData.forEach(d => {
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
          index: 0,
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
      index: 0,
      data: stickLineData
    })
  }

  if (textData.length > 0) {
    drawText(options, {} as any, {
      index: 0,
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
export const renderSecondary = (options: ECOption, indicators: Indicator[], data: IndicatorData[]) => {
  /** 合并绘制 */

  indicators.forEach((_, index) => {
    if (!data[index]) {
      return
    }
    const stickLineData: DrawerRectShape[] = []
    const textData: DrawerTextShape[] = []

    const indicatorData = data[index]

    indicatorData.forEach(d => {
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
          index: index + 1,
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
          index: index + 1,
          data: data as any
        })
      }
    })

    if (stickLineData.length > 0) {
      drawRect(options, {} as any, {
        index: index + 1,
        data: stickLineData
      })
    }

    if (textData.length > 0) {
      drawText(options, {} as any, {
        index: index + 1,
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
            index: index + 1,
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
            index: index + 1,
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
          return dayjs(v).format('MM-DD')
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
  if(!isTimeIndexChart(timeIndex)) return

  if(timeIndex === StockChartInterval.FIVE_DAY) return

  const watermark: GraphicComponentOption = {
    type: 'text',
    left: 'center',
    top: '25%',
    z2: 0,
    style: {
      text: timeIndex === StockChartInterval.PRE_MARKET ? '盘前交易' : timeIndex === StockChartInterval.AFTER_HOURS ? '盘后交易' : '盘中交易',
      fill: 'rgba(255, 255, 255, 0.05)',
      font: 'bold 96px sans-serif',
      align: 'center',
    }
  }

  if(!options.graphic) {
    options.graphic = [watermark]
  }else if(Array.isArray(options.graphic)) {
    options.graphic.push(watermark)
  }else{
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
