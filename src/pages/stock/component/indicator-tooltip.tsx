import { cn } from "@/utils/style"
import { EyeClosedIcon, EyeOpenIcon, TrashIcon } from "@radix-ui/react-icons"
import { useBoolean } from "ahooks"
import { throttle } from "radash"
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react"
import { type Indicator, chartEvent, useKChartContext } from "../lib"

interface IndicatorTooltipProps {
  type: 'main' | 'secondary'
  index?: number
  indicator: Indicator
  className?: string
  style?: CSSProperties
  mainIndex: number
}

type IndicatorRef = {
  indicatorId: string
  indicators: {
    name: string
    color: string
  }[]
}

type IndicatorData = { name: string, id: string, value: string, color: string }

export const IndicatorTooltip = (props: IndicatorTooltipProps) => {
  const { setIndicatorVisible, state, setMainIndicators } = useKChartContext()
  const [data, setData] = useState<IndicatorData[]>([])
  const [visible, { setTrue, setFalse }] = useBoolean(true)
  const indicatorRef = useRef<IndicatorRef>({ indicatorId: '', indicators: [] })

  useEffect(() => {
    if (props.indicator.data) {
      const indicators = props.indicator.data.filter(item => !!(item as any).name).map(item => {
        const { name, style: { color } } = item as any
        return {
          name,
          color
        }
      })
      indicatorRef.current = {
        indicatorId: props.indicator.id,
        indicators
      }
    } else {
      indicatorRef.current = {
        indicatorId: props.indicator.id,
        indicators: []
      }
    }
  }, [props.indicator])


  useEffect(() => {
    const handle = throttle({ interval: 200 }, (e: any) => {
      if (!visible) return
      const data: IndicatorData[] = []

      e.forEach((item: any) => {
        if (!item.seriesName) return

        const [type, id, name] = item.seriesName.split('_')

        if (type !== props.type) return

        if (id !== indicatorRef.current.indicatorId) return

        const indicator = indicatorRef.current.indicators.find(indicator => indicator.name === name)

        if (!indicator) return

        data.push({
          name,
          id,
          value: item.value,
          color: indicator.color
        })
      })

      setData(data)
    })

    chartEvent.event.on('data', handle)

    return () => {
      chartEvent.event.off('data', handle)
    }
  }, [props.type, visible])

  const _onChangeIndicatorVisible = (visible: boolean) => {
    if (props.type === 'main') {
      setIndicatorVisible({ indicatorId: props.indicator.id, visible })
    }

    visible ? setTrue() : setFalse()
  }

  /**
   * 主图才能删除指标
   */
  const deleteIndicator = useCallback(() => {
    const ids = state[props.mainIndex].mainIndicators
    const r: Indicator[] = []
    Object.keys(ids).forEach(key => {
      if (key === props.indicator.id) {
        return
      }

      r.push(ids[key])
    })

    setMainIndicators({ index: props.mainIndex, indicators: r })
  }, [props.indicator.id, state, props.mainIndex, setMainIndicators])

  return (
    <div className={cn('text-xs flex items-center text-transparent hover:text-secondary', props.className, !visible && 'opacity-60')} style={props.style}>
      {
        props.type === 'main' && <span className="text-secondary">{props.indicator.name}:&emsp;</span>
      }
      {
        data.length > 0 && visible && (
          data.map(item => (
            <span className="text-secondary" key={item.name} style={{ color: item.color }}>
              {item.name}: {item.value}&emsp;
            </span>
          ))
        )
      }
      {
        props.type === 'main' && (
          <span>
            {
              visible ? <EyeClosedIcon onClick={() => _onChangeIndicatorVisible(false)} className="cursor-pointer" /> : <EyeOpenIcon onClick={() => _onChangeIndicatorVisible(true)} className="cursor-pointer" />
            }
            &emsp;
            <TrashIcon className="cursor-pointer" onClick={deleteIndicator} />
          </span>
        )
      }
    </div>
  )
}