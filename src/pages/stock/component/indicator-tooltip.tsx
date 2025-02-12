import { cn } from '@/utils/style'
import { EyeClosedIcon, EyeOpenIcon, TrashIcon } from '@radix-ui/react-icons'
import { useBoolean } from 'ahooks'
import Decimal from 'decimal.js'
import { ChevronDownIcon, ChevronUpIcon } from 'lucide-react'
import { throttle } from 'radash'
import { type CSSProperties, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useShallow } from 'zustand/react/shallow'
import { type Indicator, kChartUtils, useKChartStore } from '../lib'
import { chartEvent } from "../lib/event"

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

type IndicatorData = { name: string; id: string; value: string; color: string }

export const IndicatorTooltip = (props: IndicatorTooltipProps) => {
  const [data, setData] = useState<IndicatorData[]>([])
  const [visible, { setTrue, setFalse }] = useBoolean(true)
  const indicatorRef = useRef<IndicatorRef>({ indicatorId: '', indicators: [] })
  const mainIndicators = useKChartStore(useShallow(s => s.state[props.mainIndex].mainIndicators))

  useEffect(() => {
    if (props.indicator.data) {

      const indicators = props.indicator.data
        .filter(item => !!item.name)
        .map(item => {
          const { name, color } = item
          return {
            name: name!,
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
      setData([])
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

    chartEvent.event.on('tooltip', handle)

    return () => {
      chartEvent.event.off('tooltip', handle)
    }
  }, [props.type, visible])

  const _onChangeIndicatorVisible = (visible: boolean) => {
    if (props.type === 'main') {
      kChartUtils.setIndicatorVisible({ indicatorId: props.indicator.id, visible })
    }

    visible ? setTrue() : setFalse()
  }

  /**
   * 主图才能删除指标
   */
  const deleteIndicator = useCallback(() => {
    const r: Indicator[] = []
    Object.keys(mainIndicators).forEach(key => {
      if (key === props.indicator.id) {
        return
      }

      r.push(mainIndicators[key])
    })

    kChartUtils.setMainIndicators({ index: props.mainIndex, indicators: r })
  }, [props.indicator.id, mainIndicators, props.mainIndex])

  return (
    <>
      <div
        className={cn('text-xs flex text-transparent hover:text-secondary', props.className, !visible && 'opacity-60')}
        style={props.style}
      >
        {props.type === 'main' && <span className="text-secondary flex-shrink-0">{props.indicator.name}:&emsp;</span>}
        <span className="pointer-events-none">
          {data.length > 0 &&
            visible &&
            data.map(item => (
              <span className="text-secondary whitespace-nowrap" key={item.name} style={{ color: item.color }}>
                {item.name}: {item.value ? Decimal.create(item.value).toFixed(2) : item.value}&emsp;
              </span>
            ))}
        </span>
        {props.type === 'main' && (
          <span className="flex-shrink-0">
            {visible ? (
              <EyeClosedIcon onClick={() => _onChangeIndicatorVisible(false)} className="cursor-pointer" />
            ) : (
              <EyeOpenIcon onClick={() => _onChangeIndicatorVisible(true)} className="cursor-pointer" />
            )}
            &emsp;
            <TrashIcon className="cursor-pointer" onClick={deleteIndicator} />
          </span>
        )}
      </div>
    </>
  )
}

interface IndicatorTooltipGroupProps {
  mainIndex: number
  indicators: NormalizedRecord<Indicator>
}
export const IndicatorTooltipGroup = memo((props: IndicatorTooltipGroupProps) => {
  const indicators = useMemo(() => {
    return Object.values(props.indicators)
  }, [props.indicators])
  const [expand, { toggle }] = useBoolean(true)
  return (
    <div className="absolute top-4 left-2 space-y-2 main-indicator-tooltip">
      {expand
        ? indicators.map(item => (
            <IndicatorTooltip mainIndex={props.mainIndex} key={item.id} type="main" indicator={item} />
          ))
        : null}
      {indicators.length > 0 && (
        <span
          className="border border-gray-600 border-solid rounded px-1 cursor-pointer flex items-center justify-center w-6 h-4"
          onClick={toggle}
          onKeyDown={() => {}}
        >
          {!expand ? (
            <>
              <ChevronDownIcon className="w-3 h-3 text-tertiary" />
              &nbsp;<span className="text-xs text-tertiary">{indicators.length}</span>
            </>
          ) : (
            <ChevronUpIcon className="w-3 h-3 text-tertiary" />
          )}
        </span>
      )}
    </div>
  )
})
