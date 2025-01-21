import { cn } from "@/utils/style"
import { useCallback, useEffect, useMemo } from "react"
import { useImmer } from "use-immer"
import { ChartContextMenu } from "../component/chart-context-menu"
import { ChartToolSelect } from "../component/chart-tool"
import { MainChart } from "../component/main-chart"
import { TimeIndexSelect } from "../component/time-index"
import { type Indicator, KChartContext, type KChartState, createDefaultChartState, isTimeIndexChart, useSymbolQuery } from "../lib"
import { getStockChart, getStockIndicatorData, getStockTabData, getStockTabList } from "@/api"
import dayjs from "dayjs"
import { renderUtils } from "../lib/utils"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { useIndicator, useTime } from "@/store"
import { nanoid } from "nanoid"
import { useUpdateEffect } from "ahooks"
import { useNavigate } from "react-router"
import { produce } from "immer"
import { JknIcon } from "@/components"

interface KChartProps {
  onChangeLeftSide: () => void
  leftSideVisible: 'full' | 'half' | 'hide'
  onChangeRightSize: () => void
  rightSideVisible: 'full' | 'hide'
}

/**
 * @examples
 * @returns 
 */

export const KChart = (props: KChartProps) => {

  const symbol = useSymbolQuery()

  const [context, setContext] = useImmer<KChartState>({
    viewMode: 'single',
    state:
      [
        createDefaultChartState({
          index: 0,
          symbol: symbol
        })
      ],
    activeChartIndex: 0
  })

  const queryClient = useQueryClient()
  const { usTime } = useTime()

  useEffect(() => {
    if (!context.state[0]) return
    const cloneData = produce(context.state[0], draft => {
      draft.mainData = {
        history: [],
        coiling_data: undefined,
        md5: ''
      }

      draft.overlayStock = []
      draft.overlayMark = undefined

      draft.secondaryIndicators.forEach(v => {
        v.data = undefined
      })
      draft.mainIndicators = {}
    })

    const str = JSON.stringify(cloneData)

    localStorage.setItem('k-chart-state', str)
  }, [context.state[0]])

  useUpdateEffect(() => {
    setSymbol({ symbol })
  }, [symbol])

  const navigate = useNavigate()
  useUpdateEffect(() => {
    navigate(`/stock/trading?symbol=${context.state[context.activeChartIndex].symbol}`)
  }, [context.state, context.activeChartIndex])


  const tabList = useQuery({
    queryKey: [getStockTabList.cacheKey],
    queryFn: () => getStockTabList(),
    placeholderData: () => ([])
  })

  const setMainSystem: KChartContext['setMainSystem'] = ({ index, system }) => {
    if(context.state[index ?? context.activeChartIndex].system === system) return
    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      chart.system = system
    })
  }

  const setSymbol: KChartContext['setSymbol'] = ({ index, symbol }) => {
    setContext(d => {
      d.state[index ?? d.activeChartIndex].symbol = symbol
    })
  }

  const setMainIndicators: KChartContext['setMainIndicators'] = ({ index, indicators }) => {
    console.log(indicators)
    const _indicators = Array.isArray(indicators) ? indicators : [indicators]
    const _indicatorsMap: NormalizedRecord<Indicator> = {}
    const chart = context.state[index ?? context.activeChartIndex]
    _indicators.forEach(indicator => {
      _indicatorsMap[indicator.id] = chart.mainIndicators[indicator.id] ?? indicator
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

      if (isTimeIndexChart(timeIndex)) {
        chart.type = 'line'
      }

    })

    setMainIndicators({ index, indicators: newMainIndicators })

    const newSecondaryIndicators = context.state[index ?? context.activeChartIndex].secondaryIndicators.map(v => ({ ...v, timeIndex }))

    newSecondaryIndicators.forEach((indicator, idx) => {
      setSecondaryIndicator({ indicator, index, indicatorIndex: idx })
    })
  }

  const setActiveChart: KChartContext['setActiveChart'] = (index) => {
    setContext(d => {
      d.activeChartIndex = index
    })
  }


  const setSecondaryIndicatorsCount: KChartContext['setSecondaryIndicatorsCount'] = ({ index, count, indicator }) => {
    setContext(d => {
      const chart = d.state[index ?? context.activeChartIndex]
      let newIndicators: Indicator[] = [...chart.secondaryIndicators]

      if (chart.secondaryIndicators.length > count) {
        newIndicators = chart.secondaryIndicators.slice(0, count)
      } else {
        for (let i = 0; i < count - chart.secondaryIndicators.length; i++) {
          newIndicators.push({ ...indicator, key: nanoid() })
        }
      }

      chart.secondaryIndicators = newIndicators
    })
  }

  const { isDefaultIndicatorParams, getIndicatorQueryParams } = useIndicator()

  const setSecondaryIndicator: KChartContext['setSecondaryIndicator'] = ({ index, indicatorIndex, indicator }) => {
    const queryKey = [getStockIndicatorData.cacheKey, { symbol: indicator.symbol, cycle: indicator.timeIndex, id: indicator.id, db_type: indicator.type }] as any[]

    if (!isDefaultIndicatorParams(indicator.id)) {
      queryKey.push(getIndicatorQueryParams(indicator.id))
    }

    const queryData = queryClient.getQueryData(queryKey) as { id: string, data: any[] }

    setContext(d => {
      const chart = d.state[index ?? context.activeChartIndex]

      if (queryData) {
        chart.secondaryIndicators[indicatorIndex] = { ...indicator, data: queryData.data }
        queryClient.invalidateQueries({ queryKey })
      } else {
        chart.secondaryIndicators[indicatorIndex] = indicator
      }
    })
  }

  const setMainData: KChartContext['setMainData'] = useCallback(({ index, data, dateConvert }) => {

    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      chart.mainData = data ? dateConvert ? { ...data, history: data.history.map(v => [dayjs(v[0]).valueOf().toString(), ...v.slice(1)]) } as any : data : {
        history: [],
        coiling_data: undefined,
        md5: ''
      }
    })
  }, [setContext])

  const setIndicatorData: KChartContext['setIndicatorData'] = useCallback(({ index, indicatorId, data }) => {
    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      const indicators = []

      if (chart.mainIndicators[indicatorId]) {
        indicators.push(chart.mainIndicators[indicatorId])
      }

      indicators.push(...chart.secondaryIndicators.filter(v => v.id === indicatorId))

      if (!indicators.length) return

      indicators.forEach(indicator => {
        indicator.data = data
      })
    })
  }, [setContext])


  const setViewMode: KChartContext['setViewMode'] = ({ viewMode }) => {
    const count = renderUtils.getViewMode(viewMode)

    setContext(d => {
      const chart = d.state[d.activeChartIndex]
      d.viewMode = viewMode
      if (d.state.length > count) {
        d.state = d.state.slice(0, count)
        d.activeChartIndex = d.state.length - 1
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

    if (mark) {
      setContext(d => {
        const chart = d.state[index ?? d.activeChartIndex]
        chart.overlayMark = { mark, title }
      })
      const r = await queryClient.ensureQueryData({
        queryKey: [getStockTabData.cacheKey, { type, mark, symbol: chart.symbol }],
        queryFn: () => getStockTabData({ param: { [type]: [mark] }, ticker: chart.symbol, start: '2010-01-01' }),
        revalidateIfStale: true
      })

      setContext(d => {
        const chart = d.state[index ?? d.activeChartIndex]
        chart.overlayMark = { mark, data: r[type], title }
      })
    } else {
      setContext(d => {
        const chart = d.state[index ?? d.activeChartIndex]
        chart.overlayMark = { mark, title }
      })
    }


  }

  const setYAxis: KChartContext['setYAxis'] = ({ index, yAxis }) => {
    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      chart.yAxis = yAxis
    })
  }

  const setIndicatorVisible: KChartContext['setIndicatorVisible'] = useCallback(({ index, indicatorId, visible, secondaryIndex }) => {
    setContext(d => {
      const chart = d.state[index ?? d.activeChartIndex]
      if (secondaryIndex !== undefined){
        chart.secondaryIndicators[secondaryIndex].visible = visible
      }else{
        chart.mainIndicators[indicatorId].visible = visible
      }
    })
  }, [setContext])



  const chartCount = useMemo(() => renderUtils.getViewMode(context.viewMode), [context.viewMode])

  return (
    <div className="h-full overflow-hidden flex flex-col">
      <KChartContext.Provider value={{
        ...context,
        setState: setContext, setMainIndicators, setMainSystem, toggleMainChartType, setMainCoiling, setTimeIndex, setActiveChart,
        setSecondaryIndicatorsCount, setSecondaryIndicator, setMainData, addOverlayStock, removeOverlayStock, setOverlayMark, setIndicatorVisible,
        setIndicatorData, setViewMode, setYAxis, setSymbol, overMarkList: tabList.data ?? []
      }}>
        <div className="w-full flex-shrink-0">
          <div className="flex border border-solid border-border px-4 items-center">
            <JknIcon name="ic_leftbar" className={cn(
              'rounded-none h-4 w-4 mr-1 flex-shrink-0',
              props.leftSideVisible !== 'hide' ? 'icon-checked' : ''
            )} onClick={props.onChangeLeftSide} />
            <span className="flex-shrink-0 text-primary text-xs mr-2">
              {symbol}
            </span>
            <div className="flex-1">
              <TimeIndexSelect />
            </div>
            <JknIcon name="ic_rightbar" className={cn(
              'rounded-none h-4 w-4 mr-2 flex-shrink-0',
              props.rightSideVisible !== 'hide' ? 'icon-checked' : ''
            )} onClick={props.onChangeRightSize} />
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



