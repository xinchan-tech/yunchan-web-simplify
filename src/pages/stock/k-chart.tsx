import { cn } from "@/utils/style"
import { useCallback, useEffect, useMemo, useRef } from "react"
import { useImmer } from "use-immer"
import { ChartContextMenu } from "./component/chart-context-menu"
import { ChartToolSelect } from "./component/chart-tool"
import { MainChart } from "./component/main-chart"
import { TimeIndexSelect } from "./component/time-index"
import { type Indicator, type IndicatorCache, KChartContext, type KChartState, createDefaultChartState, isTimeIndexChart } from "./lib"
import { getStockChart, getStockTabData, getStockTabList, StockChartInterval } from "@/api"
import dayjs from "dayjs"
import { renderUtils } from "./lib/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useTime } from "@/store"
import { nanoid } from "nanoid"


/**
 * @examples
 * @returns 
 */

export const KChart = () => {
  const [context, setContext] = useImmer<KChartState>({
    viewMode: 'single',
    secondaryIndicators: [
      { id: '9', type: 'system', timeIndex: StockChartInterval.DAY, symbol: 'QQQ', key: nanoid() },
      { id: '10', type: 'system', timeIndex: StockChartInterval.DAY, symbol: 'QQQ', key: nanoid() }
    ],
    state:
      [
        createDefaultChartState({
          index: 0,
          symbol: 'QQQ'
        })
      ],
    activeChartIndex: 0
  })
  const indicatorCache = useRef<IndicatorCache>(new WeakMap())
  const indicatorMap = useRef(new Map())
  const queryClient = useQueryClient()
  const { usTime } = useTime()

  const tabList = useQuery({
    queryKey: [getStockTabList.cacheKey],
    queryFn: () => getStockTabList(),
    placeholderData: () => ([])
  })

  const setMainSystem: KChartContext['setMainSystem'] = ({ index, system }) => {
    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      chart.system = system
    })
  }

  const setMainIndicators: KChartContext['setMainIndicators'] = ({ index, indicators }) => {
    const _indicators = Array.isArray(indicators) ? indicators : [indicators]
    const _indicatorsMap: NormalizedRecord<Indicator> = {}

    _indicators.forEach(({ id, type, timeIndex, symbol }) => {
      const cacheKey = `${symbol}-${timeIndex}-${id}-${type}`

      let idt = { id: id, type, timeIndex, symbol, key: nanoid() }
      if (indicatorMap.current.has(cacheKey)) {
        idt = indicatorMap.current.get(cacheKey)
      } else {
        indicatorMap.current.set(cacheKey, idt)
      }

      _indicatorsMap[id] = idt
    })

    setContext(d => {
      d.state[index ?? d.activeChartIndex].mainIndicators = _indicatorsMap
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
    const newMainIndicators = Object.values(context.state[index ?? context.activeChartIndex].mainIndicators).map(v => ({ ...v, timeIndex }))
    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      chart.timeIndex = timeIndex

      if(isTimeIndexChart(timeIndex )) {
        chart.type = 'line'
      }

    })

    setMainIndicators({ index, indicators: newMainIndicators })

    const newSecondaryIndicators = context.state[index ?? context.activeChartIndex].secondaryIndicators.map(v => ({ ...v, timeIndex }))

    newSecondaryIndicators.forEach((indicator, idx) => {
      setSecondaryIndicator({ indicator, index, indicatorIndex: idx })
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


  const setSecondaryIndicatorsCount: KChartContext['setSecondaryIndicatorsCount'] = ({ index, count, indicator }) => {
    setContext(d => {
      const chart = d.state[index ?? context.activeChartIndex]
      let newIndicators: Indicator[] = [...chart.secondaryIndicators]

      if (chart.secondaryIndicators.length > count) {
        newIndicators = chart.secondaryIndicators.slice(0, count)
      } else {
        for (let i = 0; i < count - chart.secondaryIndicators.length; i++) {
          newIndicators.push(indicator)
        }
      }

      chart.secondaryIndicators = newIndicators

      if (index === 1) {
        d.secondaryIndicators = newIndicators
      }
    })
  }

  const setSecondaryIndicator: KChartContext['setSecondaryIndicator'] = ({ index, indicatorIndex, indicator }) => {
    setContext(d => {
      const chart = d.state[index ?? context.activeChartIndex]
      const cacheKey = `${indicator.symbol}-${indicator.timeIndex}-${indicator.id}-${indicator.type}`

      let idt = indicator
      if (indicatorMap.current.has(cacheKey)) {
        idt = indicatorMap.current.get(cacheKey)
      } else {
        indicatorMap.current.set(cacheKey, idt)
      }

      chart.secondaryIndicators[indicatorIndex] = idt

      if (index === 1) {
        d.secondaryIndicators = chart.secondaryIndicators
      }
    })
  }

  const setMainData: KChartContext['setMainData'] = useCallback(({ index, data }) => {
    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      chart.mainData = data ? { ...data, history: data.history.map(v => [dayjs(v[0]).valueOf().toString(), ...v.slice(1)]) } as any : {
        history: [],
        coiling_data: undefined,
        md5: ''
      }
    })
  }, [setContext])

  const setIndicatorData: KChartContext['setIndicatorData'] = useCallback(({ indicator, data }) => {
    const cacheKey = `${indicator.symbol}-${indicator.timeIndex}-${indicator.id}-${indicator.type}`

    let idt = indicator

    if (indicatorMap.current.has(cacheKey)) {
      idt = indicatorMap.current.get(cacheKey)
    }

    indicatorCache.current.set(idt, data)
  }, [])

  const getIndicatorData: KChartContext['getIndicatorData'] = useCallback(({ indicator }) => {
    const cacheKey = `${indicator.symbol}-${indicator.timeIndex}-${indicator.id}-${indicator.type}`

    if (indicatorMap.current.has(cacheKey)) {
      return indicatorCache.current.get(indicatorMap.current.get(cacheKey))
    }
    return indicatorCache.current.get(indicator)
  }, [])

  const setViewMode: KChartContext['setViewMode'] = ({ viewMode }) => {
    const count = renderUtils.getViewMode(viewMode)

    setContext(d => {
      const chart = d.state[d.activeChartIndex]
      d.viewMode = viewMode
      if (d.state.length > count) {
        d.state = d.state.slice(0, count)
      } else {
        for (let i = d.state.length; i < count; i++) {
          d.state.push(createDefaultChartState({
            index: i,
            symbol: chart.symbol
          }))
        }
      }
    })
  }

  const addOverlayStock: KChartContext['addOverlayStock'] = ({ index, symbol }) => {
    const chart = context.state[index ?? context.activeChartIndex]

    if (chart.overlayStock.find(o => o.symbol === symbol)) return
    const startTime = renderUtils.getStartTime(usTime, chart.timeIndex)
    const params = {
      start_at: startTime,
      ticker: symbol,
      interval: chart.timeIndex,
      gzencode: true
    }

    queryClient.ensureQueryData({
      queryKey: [getStockChart.cacheKey, params],
      queryFn: () => getStockChart(params)
    }).then(r => {
      setContext(d => {
        const chart = d.state[index ?? d.activeChartIndex]
        chart.overlayStock.push({ symbol, data: r })
        queryClient.invalidateQueries({
          queryKey: [getStockChart.cacheKey, params]
        })
      })
    })

  }

  const removeOverlayStock: KChartContext['removeOverlayStock'] = ({ index, symbol }) => {
    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      const overlayStock = chart.overlayStock.filter(o => o.symbol !== symbol)
      chart.overlayStock = overlayStock
    })
  }

  const setOverlayMark: KChartContext['setOverlayMark'] = async ({ index, mark, type, title }) => {
    const chart = context.state[index ?? context.activeChartIndex]
    if (chart.overlayMark?.mark === mark) return

    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      chart.overlayMark = { mark, title }
    })

    const r = await queryClient.ensureQueryData({
      queryKey: [getStockTabData.cacheKey, { type, mark, symbol: chart.symbol }],
      queryFn: () => getStockTabData({ param: {[type]: [mark]}, ticker: chart.symbol, start: '2010-01-01' }),
      revalidateIfStale: true
    })

    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      chart.overlayMark = { mark, data: r[type], title }
    })
  }

  const chartCount = useMemo(() => renderUtils.getViewMode(context.viewMode), [context.viewMode])

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <KChartContext.Provider value={{
        ...context,
        setState: setContext, setMainIndicators, setMainSystem, toggleMainChartType, setMainCoiling, setTimeIndex, activeChart,
        setSecondaryIndicatorsCount, setSecondaryIndicator, setMainData, addOverlayStock, removeOverlayStock, setOverlayMark,
        setIndicatorData, getIndicatorData, setViewMode, overMarkList: tabList.data ?? []
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

        .main-chart-three-left-single {
            grid-template-areas: 
            'chart-1 chart-2'
            'chart-1 chart-3';
            grid-template-rows: 50% 50%;
            grid-template-columns: 50% 50%;
        }

        .main-chart-three-right-single {
              grid-template-areas: 
              'chart-2 chart-1'
              'chart-3 chart-1';
              grid-template-rows: 50% 50%;
              grid-template-columns: 50% 50%;
        }

        .main-chart-three-vertical-top-single {
              grid-template-areas: 
              'chart-1 chart-1'
              'chart-2 chart-3';
              grid-template-rows: 1fr 1fr;
              grid-template-columns: 1fr 1fr;
        }

        .main-chart-three-vertical-bottom-single {
              grid-template-areas: 
              'chart-2 chart-3'
              'chart-1 chart-1';
              grid-template-rows: 1fr 1fr;
              grid-template-columns: 1fr  1fr;
        }

        .main-chart-four {
              grid-template-areas: 
              'chart-1 chart-2'
              'chart-3 chart-4';
              grid-template-rows: 50% 50%;
              grid-template-columns: 50% 50%;
        }

        .main-chart-six {
              grid-template-areas: 
              'chart-1 chart-2 chart-3'
              'chart-4 chart-5 chart-6';
              grid-template-rows: 50% 50%;
              grid-template-columns: 33.3% 33.3% 33.3%;
        }

        .main-chart-nine {
              grid-template-areas: 
              'chart-1 chart-2 chart-3'
              'chart-4 chart-5 chart-6'
              'chart-7 chart-8 chart-9';
              grid-template-rows: 33.33% 33.33% 33.33%;
              grid-template-columns: 33.33% 33.33% 33.33%;
        }
      `}</style>
    </div >
  )
}



