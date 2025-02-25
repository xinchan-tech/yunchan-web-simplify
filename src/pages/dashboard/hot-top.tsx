import { getPalTop } from "@/api"
import { Skeleton } from "@/components"
import { useChart } from "@/hooks"
import { dateUtils } from "@/utils/date"
import echarts, { type ECOption } from "@/utils/echarts"
import { useQuery } from "@tanstack/react-query"
import { useEffect } from "react"

export const HotTop = () => {
  const tops = useQuery({
    queryKey: [getPalTop.cacheKey],
    queryFn: () => getPalTop(),
  })
  const [chart, dom] = useChart()

  useEffect(() => {
    if (!chart.current || !tops.data) return
    // 数据排序，数据大的放中间，数据小的放两边
    const data = tops.data.sort((a, b) => b.score - a.score)
    const r: typeof data = []
    data.forEach((item, index) => {
      if(index % 2 === 0) {
        r.unshift(item)
      }else{
        r.push(item)
      }
    })

    const options: ECOption = {
      grid: {
        left: 30,
        right: 10,
        top: 40,
        bottom: 30,
      },
      tooltip: {
        trigger: 'item',
        borderColor: '#3B3741',
        backgroundColor: '#3B3741',
        formatter: (params: any) => {
          const [name, score, time] = params.data
          return `
            <div class="flex flex-col">
              <div class="text-lg text-center" style="color: #FFFFFF">${name}</div>
              <div class="text-lg text-center" style="color: #FFFFFF">${score}</div>
              <div class="text-xs text-center" style="color: #B7DBF9">${dateUtils.toUsDay(time).format('hh:mm A')}</div>
            </div>
            `
        }
      },
      xAxis: {
        data: r.map((item) => item.name),
        boundaryGap: true,
        splitLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        axisLine: {
          lineStyle: {
            color: '#3B3741'
          }
        },
        axisLabel: {
          color: '#A3A3A3'
        }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          showMinLabel: false,
          color: '#A3A3A3'
        },
        splitLine: {
          lineStyle: {
            color: '#3B3741'
          }
        },

      },
      series: {
        type: 'bar',
        data: r.map((item) => [item.name, item.score, item.update_time]),
        encode: {
          x: 0,
          y: 1,
          time: 2
        },
        itemStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(255, 84, 84, 1)' },
            { offset: 1, color: 'rgba(255, 187, 84, 1)' },
          ]),
          borderRadius: [4, 4, 0, 0],
        },
        barWidth: 12
      },
    }

    chart.current.setOption(options)
  }, [tops.data, chart])

  return (
    <div className="w-full h-full overflow-hidden flex flex-col">
      <div className="text-lg px-4 my-5">热力Top榜单</div>
      <div className="flex-1 relative">
        <div className="w-full h-full" ref={dom} />
        {
          tops.isLoading ? (
            <div className="absolute left-0 top-0 right-0 bottom-0 space-y-2">
              <Skeleton className="w-full h-4 rounded-l-none" />
              <Skeleton className="w-full h-4 rounded-l-none" />
              <Skeleton className="w-full h-4 rounded-l-none" />
              <Skeleton className="w-full h-4 rounded-l-none" />
            </div>
          ) : null
        }
      </div>
    </div>
  )
}