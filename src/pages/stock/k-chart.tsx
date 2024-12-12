import { cn } from "@/utils/style"
import { useMemo, useRef } from "react"
import { useImmer } from "use-immer"
import { ChartContextMenu } from "./component/chart-context-menu"
import { ChartToolSelect } from "./component/chart-tool"
import { MainChart } from "./component/main-chart"
import { TimeIndexSelect } from "./component/time-index"
import { type IndicatorCache,  KChartContext, type KChartState, createDefaultChartState, isTimeIndexChart } from "./lib"



export const KChart = () => {
  const [context, setContext] = useImmer<KChartState>({
    viewMode: 'single',
    secondaryIndicators: ['9', '10'],
    state:
      [
        createDefaultChartState()
      ],
    activeChartIndex: 0
  })
  const indicatorCache = useRef<IndicatorCache>(new WeakMap())

  const setMainSystem: KChartContext['setMainSystem'] = ({ index, system }) => {
    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      chart.system = system
    })
  }

  const setMainIndicators: KChartContext['setMainIndicators'] = ({ index, indicators }) => {
    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      const _indicators = Array.isArray(indicators) ? indicators : [indicators]

      _indicators.forEach(({ id, type, timeIndex, symbol }) => {
        if (!chart.mainIndicators[id]) {
          const idt = { id: id, type, timeIndex, symbol }
          chart.mainIndicators[id] = idt
        }
      })

      Array.from(Reflect.ownKeys(chart.mainIndicators)).forEach((id) => {
        if (!_indicators.some(i => i.id === id)) {
          indicatorCache.current.delete(chart.mainIndicators[id.toString()])
          delete chart.mainIndicators[id.toString()]
        }
      })
    })
  }

  const toggleMainChartType: KChartContext['toggleMainChartType'] = ({ index, type }) => {
    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      if (isTimeIndexChart(chart.timeIndex)) return
      chart.type = type ? type : (chart.type === 'k-line' ? 'line' : 'k-line')
    })
  }

  const setMainCoiling: KChartContext['setMainCoiling'] = ({ index, coiling }) => {
    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      chart.mainCoiling = coiling
    })
  }

  const setTimeIndex: KChartContext['setTimeIndex'] = ({ index, timeIndex }) => {
    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      chart.timeIndex = timeIndex
    })
  }

  const activeChart: KChartContext['activeChart'] = (index) => {
    if (index === undefined) {
      return context.state[context.activeChartIndex]
    }

    if (index > context.state.length) {
      throw new Error('index out of range')
    }

    return context.state[index]
  }

  const setMainIndicatorData: KChartContext['setMainIndicatorData'] = ({ index, id, data }) => {
    const chart = context.state[index ?? context.activeChartIndex]
    const indicator = chart.mainIndicators[id]
    if (!indicator) return

    indicatorCache.current.set(indicator, data)
  }

  const getMainIndicatorData: KChartContext['getMainIndicatorData'] = ({ index, id }) => {
    const chart = context.state[index ?? context.activeChartIndex]
    const indicator = chart.mainIndicators[id]

    return indicatorCache.current.get(indicator)
  }

  const chartCount = useMemo(() => {
    switch (context.viewMode) {
      case 'single':
        return 1
      case 'double':
        return 2
      case 'double-vertical':
        return 2
      case 'three-left-single':
        return 3
      case 'three-right-single':
        return 3
      case 'three-vertical-top-single':
        return 3
      case 'three-vertical-bottom-single':
        return 3
      case 'four':
        return 4
      case 'six':
        return 6
      case 'nine':
        return 9
      default:
        return 1
    }
  }, [context.viewMode])

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <KChartContext.Provider value={{
        ...context,
        setState: setContext, setMainIndicators, setMainSystem, toggleMainChartType, setMainCoiling, setTimeIndex, activeChart,
        setMainIndicatorData, getMainIndicatorData
      }}>
        <div className="w-full flex-shrink-0">
          <div className="flex border border-solid border-border px-4">
            <TimeIndexSelect />
          </div>
          <ChartToolSelect />
        </div>
        <div className={cn('flex-1 overflow-hidden main-chart', `main-chart-${context.viewMode}`)} >
          {
            Array.from({ length: chartCount }).map((_, index) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
              <ChartContextMenu key={index} index={index}>
                <MainChart index={index} />
              </ChartContextMenu>
            ))
          }
        </div>
      </KChartContext.Provider>
      <style jsx>{`
         .main-chart {
           display: grid;
           grid-template-columns: 1fr;
           grid-template-rows: 1fr;
         }

         .main-chart-single{
          grid-template-areas: 'chart-1';
         }

         .main-chart-double {
           grid-template-areas: 'chart-1 chart-2';
           grid-template-columns: 50% 50%;
         }

         .main-chart-double-vertical {
           grid-template-areas: 
           'chart-1'
           'chart-2';
           grid-template-rows: 50% 50%;
           grid-template-columns: 1fr;
         }
      `}</style>
    </div >
  )
}



