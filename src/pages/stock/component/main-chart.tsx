import { StockChartInterval } from '@/api'
import { StockSelect } from '@/components'
import { useStockBarSubscribe } from '@/hooks'
import { useIndicator, useTime } from '@/store'
import { calcIndicator } from '@/utils/coiling'
import echarts from '@/utils/echarts'
import { type StockSubscribeHandler, stockUtils } from '@/utils/stock'
import { cn, colorUtil } from '@/utils/style'
import { useMount, useUnmount, useUpdateEffect } from 'ahooks'
import dayjs from 'dayjs'
import type { EChartsType } from 'echarts/core'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { type Indicator, chartEvent, kChartUtils, useKChartStore } from '../lib'
import {
  initOptions,
  renderChart,
  renderGrid,
  renderMainChart,
  renderMainCoiling,
  renderMainIndicators,
  renderMarkLine,
  renderOverlay,
  renderOverlayMark,
  renderSecondary,
  renderSecondaryLocalIndicators,
  renderWatermark,
  renderZoom
} from '../lib/render'
import { useStockCandlesticks } from '../lib/request'
import { renderUtils } from '../lib/utils'
import { IndicatorTooltip } from './indicator-tooltip'
import { SecondaryIndicator } from './secondary-indicator'
import { TimeIndexMenu } from './time-index'
import { ChartContextMenu } from "./chart-context-menu"

interface MainChartProps {
  index: number
}

export const MainChart = (props: MainChartProps) => {
  // const [size, dom] = useDomSize<HTMLDivElement>()
  const dom = useRef<HTMLDivElement>(null)
  const chart = useRef<EChartsType>()
  const renderFn = useRef<() => void>(() => {})
  const fetchFn = useRef<() => void>()
  useMount(() => {
    chart.current = echarts.init(dom.current, null, { devicePixelRatio: 3 })
    chart.current.meta = {} as any

    chart.current.meta.event = chartEvent.event

    chartEvent.event.on('tooltip', (params: any) => {
      chartEvent.event.emit('data', params)
    })

    chart.current.on('globalout', e => {
      // 检测鼠标是否在图表内
      const toElement = (e.event?.event as any).toElement as HTMLElement

      if (
        !toElement?.className.includes('main-indicator-tooltip') ||
        !toElement?.className.includes('secondary-indicator-tool')
      ) {
        chartEvent.event.emit('data', [])
      }
    })

    chart.current.on('dataZoom', (params: any) => {
      let start = 100
      if (params.batch) {
        start = params.batch[0].start
      } else {
        start = params.start
      }

      if (start < 10) {
        fetchFn.current?.()
      }
    })

    chart.current.setOption(
      {
        ...initOptions()
      },
      { lazyUpdate: true }
    )
  })

  useEffect(() => {
    const sizeObserver = new ResizeObserver(() => {
      chart.current?.resize()
      renderFn.current()
    })

    sizeObserver.observe(dom.current!)

    return () => {
      sizeObserver.disconnect()
    }
  }, [])

  useUnmount(() => {
    chart.current?.meta?.event.all.clear()
    chart.current?.dispose()
  })

  const state = useKChartStore(s => s.state[props.index])

  const stateLen = useKChartStore(s => s.state.length)
  const activeChartIndex = useKChartStore(s => s.activeChartIndex)
  const lastMainHistory = useRef(state.mainData.history)

  useEffect(() => {
    lastMainHistory.current = state.mainData.history
  }, [state.mainData.history])

  const { candlesticks, fetchPrevCandlesticks } = useStockCandlesticks(props.index)

  fetchFn.current = fetchPrevCandlesticks

  const subscribeSymbol = useMemo(() => {
    if (state.timeIndex <= 1) {
      return `${state.symbol}@1m`
    }

    if (state.timeIndex <= StockChartInterval.FORTY_FIVE_MIN) {
      return `${state.symbol}@${state.timeIndex}m`
    }

    if (state.timeIndex === StockChartInterval.DAY) {
      return `${state.symbol}@1d`
    }

    if (state.timeIndex === StockChartInterval.WEEK) {
      return `${state.symbol}@1w`
    }

    if (state.timeIndex === StockChartInterval.MONTH) {
      return `${state.symbol}@1M`
    }

    return `${state.symbol}@${state.timeIndex}`
  }, [state.symbol, state.timeIndex])

  const trading = useTime(s => s.getTrading())

  const subscribeHandler: StockSubscribeHandler<'bar'> = useCallback(
    data => {
      const stock = stockUtils.toStock(data.rawRecord)
      stock.timestamp = dayjs(stock.timestamp).tz('America/New_York').second(0).millisecond(0).valueOf()

      if (!lastMainHistory.current || lastMainHistory.current.length === 0) return

      const lastData = stockUtils.toStock(lastMainHistory.current[lastMainHistory.current.length - 1])
      const s = stockUtils.toShortRawRecord(stock)

      s[0] = stock.timestamp.toString().slice(0, -3)

      if (
        [StockChartInterval.PRE_MARKET, StockChartInterval.INTRA_DAY, StockChartInterval.AFTER_HOURS].includes(
          state.timeIndex
        )
      ) {
        if (trading === 'preMarket' && state.timeIndex !== StockChartInterval.PRE_MARKET) {
          return
        }

        if (trading === 'intraDay' && state.timeIndex !== StockChartInterval.INTRA_DAY) {
          return
        }

        if (trading === 'afterHours' && state.timeIndex !== StockChartInterval.AFTER_HOURS) {
          return
        }

        if (trading === 'close') {
          return
        }
      } else {
        if (trading !== 'intraDay') {
          return
        }
      }

      if (!renderUtils.isSameTimeByInterval(dayjs(lastData.timestamp), dayjs(+s[0] * 1000), state.timeIndex)) {
        kChartUtils.setMainData({
          index: props.index,
          data: [...(lastMainHistory.current as any), s],
          dateConvert: false,
          timeIndex: state.timeIndex
        })
      } else {
        kChartUtils.setMainData({
          index: props.index,
          data: [...(lastMainHistory.current.slice(0, -1) as any), s],
          dateConvert: false,
          timeIndex: state.timeIndex
        })
      }
    },
    [state.timeIndex, props.index, trading]
  )

  useStockBarSubscribe([subscribeSymbol], subscribeHandler)

  const calcIndicatorData = useCallback(async () => {
    const timeIndex = useKChartStore.getState().state[props.index].timeIndex
    const symbol = useKChartStore.getState().state[props.index].symbol
    const indicators = [
      ...useKChartStore.getState().state[props.index].secondaryIndicators,
      ...Object.values(useKChartStore.getState().state[props.index].mainIndicators)
    ]

    const res = await Promise.all(
      indicators.map(item => {
        if (!candlesticks.length) return Promise.resolve({ data: [], indicatorId: item.id })

        if (!item.formula) return Promise.resolve({ data: [], indicatorId: item.id })

        return calcIndicator(
          { formula: item.formula ?? '', symbal: symbol, indicatorId: item.id },
          candlesticks,
          timeIndex
        ).then(r => ({ data: r.data, indicatorId: item.id }))
      })
    )

    return res
  }, [candlesticks, props.index])

  useEffect(() => {
    const timeIndex = useKChartStore.getState().state[props.index].timeIndex

    calcIndicatorData().then(r => {
      kChartUtils.setMainData({
        index: props.index,
        data: candlesticks,
        dateConvert: true,
        timeIndex: timeIndex
      })

      kChartUtils.setIndicatorsData({
        index: props.index,
        data: r
      })
    })
  }, [candlesticks, props.index, calcIndicatorData])

  useEffect(() => {
    const unsubscribe = useIndicator.subscribe(() => {
      calcIndicatorData().then(r => {
        kChartUtils.setIndicatorsData({
          index: props.index,
          data: r
        })

        setTimeout(() => {
          renderFn.current()
        })
      })

     
    })

    return () => unsubscribe()
  }, [calcIndicatorData, props.index])

  const render = () => {
    if (!chart.current) return

    chart.current.meta.yAxis = {
      left: state.yAxis.left,
      right: state.yAxis.right
    }
    chart.current.meta.timeIndex = state.timeIndex

    // 优化卡顿，不要删除
    chart.current.meta.mainData = state.mainData.history

    const _options = renderChart(chart.current)
    renderGrid(_options, state, [chart.current.getWidth(), chart.current.getHeight()], chart.current)

    if (state.mainData.history.length > 0) {
      const scale = renderUtils.getScaledZoom(chart.current, 0)
      const oldMainData = (chart.current.getOption()?.series as any[])?.find(
        (item: any) => item.name === 'kChart'
      )?.data
      const addCount = oldMainData ? state.mainData.history.length - oldMainData.length : state.mainData.history.length
      renderMainChart(_options, state)
      renderMarkLine(_options, state)
      renderZoom(_options, addCount, scale)
      /**
       * 画主图指标
       */
      renderOverlay(_options, state.overlayStock)
      renderMainCoiling(_options, state, chart.current)

      renderMainIndicators(_options, Object.values(state.mainIndicators))
      renderOverlayMark(_options, state)

      renderSecondary(_options, state.secondaryIndicators)
      renderSecondaryLocalIndicators(_options, state.secondaryIndicators, state)
    }
    renderWatermark(_options, state.timeIndex)
    chart.current.setOption(_options, true)
    console.log('render', chart.current.getOption())
  }

  renderFn.current = render

  useUpdateEffect(() => {
    render()
  }, [state.mainData, state.type, state.overlayMark, state.overlayStock, state.yAxis, state.mainCoiling])

  useUpdateEffect(() => {
    render()
  }, [])
  

  const onChangeSecondaryIndicators = useCallback(
    async (params: { value: string; index: number; type: string; name: string; formula?: string }) => {
      const indicator: Indicator = {
        id: params.value,
        type: params.type,
        timeIndex: state.timeIndex,
        symbol: state.symbol,
        key: state.secondaryIndicators[params.index].key,
        name: params.name,
        formula: params.formula
      }
      const candlesticks = lastMainHistory.current

      if (renderUtils.isLocalIndicator(params.value)) {
        kChartUtils.setSecondaryIndicator({
          index: props.index,
          indicatorIndex: params.index,
          indicator: indicator
        })
        setTimeout(() => {
          renderFn.current()
        })
        return
      }

      calcIndicator(
        { formula: params.formula ?? '', symbal: state.symbol, indicatorId: params.value },
        candlesticks,
        state.timeIndex
      ).then(r => {
        indicator.data = r.data
        kChartUtils.setSecondaryIndicator({
          index: props.index,
          indicatorIndex: params.index,
          indicator: indicator
        })
        setTimeout(() => {
          renderFn.current()
        })
      })
    },
    [props.index, state.symbol, state.timeIndex, state.secondaryIndicators]
  )

  const [selectSymbol, setSelectSymbol] = useState<string | undefined>(state.symbol)

  useUpdateEffect(() => {
    setSelectSymbol(state.symbol)
  }, [state.symbol])

  const closeOverlayStock = (symbol: string) => {
    kChartUtils.removeOverlayStock({ index: props.index, symbol: symbol })
  }

  const onChangeSecondaryCount = useCallback(() => {
    renderFn.current()
  }, [])

  return (
    <ChartContextMenu index={props.index} onChangeSecondaryCount={onChangeSecondaryCount}>
      <div
        className={cn(
          'w-full h-full relative border border-transparent border-solid box-border',
          stateLen > 1 && activeChartIndex === props.index ? 'border-primary' : ''
        )}
        onClick={() => kChartUtils.setActiveChart(props.index)}
        onKeyDown={() => {}}
      >
        <div className="w-full h-full" ref={dom} />
        <canvas className="w-full h-full" />
        {state.secondaryIndicators.map((item, index, arr) => {
          const grids = renderUtils.calcGridSize(
            [chart.current?.getWidth() ?? 0, chart.current?.getHeight() ?? 0],
            arr.length,
            !!state.yAxis.left
          )
          return (
            <div
              key={item.key}
              className="absolute rounded-sm left-2 flex items-center secondary-indicator-tool space-x-2"
              style={{
                top: `calc(${grids[index + 1]?.top ?? 0}px + 4px)`,
                left: `calc(${grids[index + 1]?.left ?? 0}px + 4px)`
              }}
            >
              <SecondaryIndicator
                onIndicatorChange={onChangeSecondaryIndicators}
                index={index}
                mainIndex={props.index}
              />
              <IndicatorTooltip
                mainIndex={props.index}
                index={index}
                key={item.key}
                type="secondary"
                indicator={item}
              />
            </div>
          )
        })}
        {stateLen > 1 ? (
          <div className="absolute top-2 left-2 flex items-center bg-muted border border-solid border-dialog-border rounded pr-2 h-6">
            <StockSelect
              className="border-none"
              width={80}
              size="mini"
              onChange={v => {
                kChartUtils.setSymbol({ index: props.index, symbol: v })
              }}
              onInput={v => setSelectSymbol((v.target as any).value)}
              value={selectSymbol}
            />
            <TimeIndexMenu index={props.index} />
          </div>
        ) : null}
        {state.overlayStock.length > 0 ? (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 flex space-x-2">
            {state.overlayStock.map((item, index) => (
              <div
                key={item.symbol}
                className="text-sm flex items-center border border-solid border-transparent hover:border-white hover:cursor-pointer rounded-sm px-2 text-transparent hover:text-white"
                onClick={() => closeOverlayStock(item.symbol)}
                onKeyDown={() => {}}
              >
                <span className="w-3 h-3 inline-block mr-1" style={{ background: colorUtil.colorPalette[index] }} />
                <span className="pointer-events-none text-white">{item.symbol}&nbsp;</span>
                <span className="rotate-45 text-inherit">+</span>
              </div>
            ))}
          </div>
        ) : null}

        {Object.keys(state.mainIndicators).length > 0 ? (
          <div className="absolute top-4 left-2 space-y-2 main-indicator-tooltip">
            {Object.entries(state.mainIndicators).map(([key, item]) => (
              <IndicatorTooltip mainIndex={props.index} key={key} type="main" indicator={item} />
            ))}
          </div>
        ) : null}
      </div>
    </ChartContextMenu>
  )
}
