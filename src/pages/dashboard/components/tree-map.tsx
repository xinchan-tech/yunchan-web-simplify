import echarts, { type ECOption } from "@/utils/echarts"
import { useMount, useUnmount, useUpdateEffect } from "ahooks"
import { theme } from "antd"
import { useRef } from "react"

type TreeMapData = {
  name: string,
  value: number,
  data: number,
  children?: TreeMapData[]
}

interface TreeMapProps {
  data: TreeMapData[]
  parentLabel?: boolean
}

const TreeMap = (props: TreeMapProps) => {
  const chartRef = useRef<echarts.EChartsType>()
  const chartDomRef = useRef<HTMLDivElement>(null)
  const { token: themeToken } = theme.useToken()


  const option: ECOption = {
    grid: {
      top: 0,
      left: 0,
      bottom: 0,
      right: 0
    },
  
    series: [{
      type: 'treemap',
      left: 0,
      silent: false,
      right: 0,
      top: 0,
      bottom: 0,
      roam: false,
      nodeClick: false,
      visibleMin: 0,
      color: ['#30333c'],
      label: {
        show: true,
        color: themeToken.colorTextSecondary,
        fontSize: 12,
        fontWeight: 'bold',
        formatter: '{b}'
      },
      itemStyle: {
        borderColor: 'transparent',
        gapWidth: 1.5
      },
      breadcrumb: {
        show: false
      },
      levels: [
        {},
        {
          upperLabel: {
            show: true,
            backgroundColor: themeToken.colorBgContainer,
            color: themeToken.colorText,
            fontSize: 12,
            align: 'left',
            lineHeight: 28,
            padding: [0, 0, 0, 6],
            height: 28,
            formatter: (params) => {
              const { value, name, data } = params.data as { value: number, name: string, data: number }
              const _v = data * 100
              return name ? data >= 0 ? `${name}  {r|${_v.toFixed(3)}%}` : `${name}  {g|${_v.toFixed(3)}%}` : ''
            },
            rich: {
              r: {
                color: '#ff1e3a'
              },
              g: {
                color: '#00ab43'
              }
            }
          }
        }
      ],
      data: props.data
    }]
  }

  useMount(() => {
    const dom = chartDomRef.current
    if(dom){
      chartRef.current = echarts.init(dom)
      chartRef.current.setOption(option)
    }
  })

  useUnmount(() => {
    chartRef.current?.dispose()
  })

  useUpdateEffect(() => {
    chartRef.current?.setOption({
      series: [{
        data: props.data
      }]
    })
  }, [props.data])

  return <div ref={chartDomRef} className="w-full h-full" />
}

export default TreeMap