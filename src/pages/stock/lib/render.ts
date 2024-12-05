import type { StockRawRecord } from '@/api'
import { useConfig } from '@/store'
import { dateToWeek } from "@/utils/date"
import type echarts from '@/utils/echarts'
import type { ECOption } from '@/utils/echarts'
import { numToFixed } from "@/utils/price"
import { StockRecord } from '@/utils/stock'
import { colorUtil } from "@/utils/style"
import dayjs from "dayjs"
import Decimal from "decimal.js"

/**
 * 主图通用配置
 */
export const options: ECOption = {
  animation: false,
  dataset: [
    {
      dimensions: ['date', 'open', 'close', 'lowest', 'highest'],
      source: []
    }
  ],
  grid: [
    {
      left: 0,
      right: '6%',
      height: '60%'
    },
    {
      left: 0,
      right: '8%',
      top: '60%',
      height: '20%'
    },
    {
      left: 0,
      right: '8%',
      top: '80%',
      height: '20%'
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
      const data = v[0]?.data as StockRawRecord
      const stock = new StockRecord('', '', data)
      let time = dayjs(stock.time).format('MM-DD hh:mm') + dateToWeek(stock.time, '周')
      if(stock.time.slice(11) === '00:00:00'){
        time = stock.time.slice(0, 11) + dateToWeek(stock.time, '周')
      }

      return `
          <span class="text-xs">
           ${time}<br/>
          开盘&nbsp;&nbsp;${numToFixed(stock.open, 3)}<br/>
          收盘&nbsp;&nbsp;${numToFixed(stock.close)}<br/>
          最高&nbsp;&nbsp;${numToFixed(stock.high)}<br/>
          最低&nbsp;&nbsp;${numToFixed(stock.low)}<br/>
          涨跌额&nbsp;&nbsp;${`<span class="${stock.percentAmount >=0 ? 'text-stock-up': 'text-stock-down'}">${stock.percentAmount >= 0 ? '+': ''}${numToFixed(stock.percentAmount, 3)}</span>`}<br/>
          涨跌幅&nbsp;&nbsp;${`<span class="${stock.percentAmount >=0 ? 'text-stock-up': 'text-stock-down'}">${stock.percentAmount >= 0 ? '+': ''}${Decimal.create(stock.percent).mul(100).toFixed(2)}%</span>`}<br/>
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
      backgroundColor: '#777'
    }
  },
  toolbox: {
    feature: {
      dataZoom: {
        yAxisIndex: false
      }
    }
  },
  xAxis: [
    {
      type: 'category',
      gridIndex: 0,

      axisLine: { onZero: false, show: false },
      axisTick: {
        show: false
      },
      axisLabel: {
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
        z: 100
      }
    }
  ],
  yAxis: [
    {
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
  dataZoom: [
    {
      minSpan: 2,
      type: 'inside',
      xAxisIndex: [0, 1],
      start: 90,
      end: 100
    },
    {
      minSpan: 2,
      show: true,
      xAxisIndex: [0, 1],
      type: 'slider',
      top: '90%',
      start: 90,
      end: 100,
      backgroundColor: 'transparent',
      dataBackground: {
        lineStyle: {
          color: 'rgb(31, 32, 33)'
        }
      },
      borderColor: 'rgb(31, 32, 33)'
    }
  ],
  series: [
    {
      name: 'kChart',
      type: 'candlestick'
    }
  ]
}

export const renderMarkLine = (up: boolean, yIndex: number, chart?: echarts.ECharts) => {
  if (!chart) return
  const { getStockColor } = useConfig.getState()

  const lineColor = getStockColor(up)

  chart.setOption({
    series: [
      {
        markLine: {
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
                yAxis: yIndex
              },
              {
                yAxis: yIndex,
                x: '94%'
              }
            ]
          ]
        }
      }
    ]
  })
}

/**
 * 渲染K线图
 * @param chart
 * @returns
 */
export const renderCandlestick = (chart?: echarts.ECharts) => {
  if (!chart) return

  const { getStockColor } = useConfig.getState()

  chart.setOption({
    series: [
      {
        name: 'kChart',
        type: 'candlestick',
        datasetIndex: 0,
        yAxisIndex: 0,
        xAxisIndex: 0,
        encode: {
          x: 0,
          y: [1, 2, 4, 3]
        },
        itemStyle: {
          color: getStockColor(true),
          color0: getStockColor(false),
          borderColor: getStockColor(true),
          borderColor0: getStockColor(false)
        }
      }
    ]
  })
}

/**
 * 绘制线形图
 * @param chart echart实例
 * @param isTimeIndex 是否是分时图, 分时图会根据最后一组数据的涨跌渲染颜色
 * @param isUp 是否是涨
 * @returns
 */
export const renderLine = (chart?: echarts.ECharts, isTimeIndex?: boolean, isUp?: boolean) => {
  if (!chart) return
  let color = Object.values(colorUtil.hexToRGB('#4a65bf') ?? {}).join(',')
  if(isTimeIndex){
    const _color = useConfig.getState().getStockColor(isUp)

    color = Object.values(colorUtil.hexToRGB(_color) ?? {}).join(',')
  }

  chart.setOption({
    series: [
      {
        showSymbol: false,
        name: 'kChart',
        type: 'line',
        encode: {
          y: 'close'
        },
        xAxisIndex: 0,
        yAxisIndex: 0,
        datasetIndex: 0,
        color: `rgba(${color})`,
        areaStyle: {
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
    ]
  })
}
