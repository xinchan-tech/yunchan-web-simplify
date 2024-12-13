import type { getStockChart, StockRawRecord } from '@/api'
import { useConfig } from '@/store'
import { dateToWeek } from '@/utils/date'
import type { ECOption } from '@/utils/echarts'
import { numToFixed } from '@/utils/price'
import { StockRecord } from '@/utils/stock'
import { colorUtil } from '@/utils/style'
import dayjs from 'dayjs'
import Decimal from 'decimal.js'
import { type Indicator, type IndicatorData, isTimeIndexChart, type KChartState } from './ctx'
import { cloneDeep, slice } from 'lodash-es'
import type { CandlestickSeriesOption, LineSeriesOption } from 'echarts/charts'
import {
  drawerGradient,
  drawerLine,
  drawerRect,
  type DrawerRectShape,
  drawerText,
  type DrawerTextShape
} from './drawer'

const MAIN_CHART_NAME = 'kChart'

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
      if(!errData) return ''
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
  state: ArrayItem<KChartState['state']>,
  data?: Awaited<ReturnType<typeof getStockChart>>,
  secondary?: boolean
) => void

/**
 * 渲染图表
 */
export const renderChart = (
  state: ArrayItem<KChartState['state']>,
  data?: Awaited<ReturnType<typeof getStockChart>>
): ECOption => {
  const chain: ChartRender[] = [renderGrid, renderMainChart, renderMarkLine]
  const _options = cloneDeep(options)

  options.dataZoom = [
    {
      minSpan: 2,
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
        drawerLine(options, {} as any, {
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
    drawerRect(options, {} as any, {
      index: 0,
      data: stickLineData
    })
  }

  if (textData.length > 0) {
    drawerText(options, {} as any, {
      index: 0,
      data: textData
    })
  }
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
        drawerLine(options, {} as any, {
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

        drawerGradient(options, {} as any, {
          index: index + 1,
          data: data as any
        })
      }
    })

    if (stickLineData.length > 0) {
      drawerRect(options, {} as any, {
        index: index + 1,
        data: stickLineData
      })
    }

    if (textData.length > 0) {
      drawerText(options, {} as any, {
        index: index + 1,
        data: textData
      })
    }
  })

  return options
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
