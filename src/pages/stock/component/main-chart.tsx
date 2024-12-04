import { useEffect, useRef, useState } from "react"
import { useKChartContext, useSymbolQuery } from "../lib"
import dayjs from "dayjs"
import { useConfig, useTime } from "@/store"
import { useQuery } from "@tanstack/react-query"
import { getStockChart, StockChartInterval } from "@/api"
import { useMount, useUpdateEffect } from "ahooks"
import { useChart } from "@/hooks"
import type { ECOption } from "@/utils/echarts"

const getStartTime = (usTime: number, time: StockChartInterval) => {
  if (time >= StockChartInterval.DAY || time <= StockChartInterval.INTRA_DAY) return undefined

  return dayjs(usTime).tz('America/New_York').add(-15 * time, 'day').format('YYYY-MM-DD')
}

const options: ECOption = {
  animation: false,
  dataset: [{
    dimensions: ['date', 'open', 'close'],
    source: []
  }],
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
    borderColor: '#ccc',
    padding: 10,
    textStyle: {
      color: '#000'
    },
    position: (pos, _, __, ___, size) => {
      const obj = {
        top: 10
      } as any
      obj[['left', 'right'][+(pos[0] < size.viewSize[0] / 2)]] = 30
      return obj
    },
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
        return v.max + 30
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
      start: 96,
      end: 100
    },
    {
      minSpan: 2,
      show: true,
      xAxisIndex: [0, 1],
      type: 'slider',
      top: '90%',
      start: 96,
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
      showSymbol: false,
      name: 'kChart',
      type: 'line',
      encode: {
        y: 'close'
      },
      xAxisIndex: 0,
      yAxisIndex: 0,
      datasetIndex: 0,
      color: '#4a65bf',
      areaStyle: {
        color: {
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: 'rgba(74, 101, 191, .35)' // 0% 处的颜色
          }, {
            offset: .6, color: 'rgba(74, 101, 191, .2)' // 100% 处的颜色
          }, {
            offset: 1, color: 'transparent' // 100% 处的颜色
          }]
        }
      }
    }
  ]
}

export const MainChart = () => {
  const symbol = useSymbolQuery()
  const { getStockColor } = useConfig()
  const [symbolSelected, setSymbolSelected] = useState(symbol)
  const [chart, dom] = useChart()
  const { timeIndex } = useKChartContext()
  const { usTime } = useTime()
  const startTime = getStartTime(usTime, timeIndex)

  useEffect(() => {
    setSymbolSelected(symbol)
  }, [symbol])

  const query = useQuery({
    queryKey: [getStockChart.cacheKey, symbolSelected, timeIndex, '1'],
    queryFn: () => getStockChart({
      start_at: startTime,
      ticker: symbolSelected,
      interval: timeIndex,
      gzencode: true
    })
  })

  console.log(query.data)

  const setData = () => {
    const lastData = query.data?.history[query.data?.history.length - 1]
    const lineColor = lastData ? getStockColor(lastData[2] >= +lastData[lastData?.length - 1]) : ''
    chart.current?.setOption({
      xAxis: [],
      dataset: [
        {
          source: query.data?.history ?? []
        }
      ],
      series: [
        {
          name: 'kChart',
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
              [{
                xAxis: 'max',
                yAxis: query.data?.history[query.data?.history.length - 1][2]
              }, {
                yAxis: query.data?.history[query.data?.history.length - 1][2],
                x: '94%'
              }]
            ]
          }
        }
      ]
    })
  }

  useMount(() => {
    chart.current?.setOption(options)
    setData()
  })

  useUpdateEffect(() => {
    setData()
  }, [query.data])


  return (
    <div className="w-full h-full" ref={dom}>

    </div>
  )
}