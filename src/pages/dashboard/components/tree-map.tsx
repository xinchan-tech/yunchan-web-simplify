import { useStockList } from "@/store"
import echarts, { type ECOption } from "@/utils/echarts"
import { useMount, useSize, useUnmount, useUpdateEffect } from "ahooks"
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
  const stockList = useStockList()
  const chartRef = useRef<echarts.EChartsType>()
  const chartDomRef = useRef<HTMLDivElement>(null)
  const treeMapSize = useSize(chartDomRef)
  const dataRef = useRef<TreeMapData[]>([])


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
        fontSize: 12,
        fontWeight: 'bold',
        formatter: (v) => `{${v.name}| }\n${v.name}`,
        rich: {
        }
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
          // color:()=> {
          //   return '#fff'
          // },
          upperLabel: {
            show: true,
            // backgroundColor: themeToken.colorBgContainer,
            // color: themeToken.colorText,
            fontSize: 12,
            align: 'left',
            lineHeight: 28,
            padding: [0, 0, 0, 6],
            height: 28,
            formatter: (params) => {
              const { name, data } = params.data as { value: number, name: string, data: number }
              const _v = data * 100
              return name ? data >= 0 ? `${name}  {g|${_v.toFixed(3)}%}` : `${name}  {r|${_v.toFixed(3)}%}` : ''
            },
            rich: {
              r: {
                color: '#ff2c3f'
              },
              g: {
                color: '#00a74e'
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
    const icons: Record<string, {
      backgroundColor: {
        image: string
      }
    }> = {}

    for (const node of props.data) {
      for (const child of node.children ?? []) {
        const s = stockList.list.find(s => s[1] === child.name)

        if (s?.[0]) {
          icons[child.name] = { 
            backgroundColor: { 
              image: import.meta.env.PUBLIC_BASE_ICON_URL + s[0] ,
              width: 40,
              height: 40
            } 
          }
        }
      }
    }
    option.series[0].label.rich = { ...icons }
    if (dom) {
      chartRef.current = echarts.init(dom)
      chartRef.current.setOption(option)
    }
  })

  useUpdateEffect(() => {
    chartRef.current?.resize()
  }, [treeMapSize])

  useUnmount(() => {
    chartRef.current?.dispose()
    dataRef.current = []
  })


  useUpdateEffect(() => {
    const icons: Record<string, {
      backgroundColor: {
        image: string
      }
      width: number
      height: number
    }> = {}

    for (const node of props.data) {
      for (const child of node.children ?? []) {
        const s = stockList.list.find(s => s[1] === child.name)

        if (s?.[0]) {
          icons[child.name] = { 
            backgroundColor: { 
              image: import.meta.env.PUBLIC_BASE_ICON_URL + s[0] ,
              size: '20%',
            } ,
            overflow: 'hidden',
            borderRadius: 50,
            width: 50,
            height: 50
          }
        }
      }
    }

    chartRef.current?.setOption({
      series: [{
        data: props.data,
        label: {
          rich: {
            ...icons
          }
        }
      }]
    })

    dataRef.current = props.data
  }, [props.data])

  return <div ref={chartDomRef} className="w-full h-full" />
}

export default TreeMap