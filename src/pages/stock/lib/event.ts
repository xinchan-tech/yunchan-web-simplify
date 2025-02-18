import { StockRawRecord } from '@/api'
import type { EChartsType } from 'echarts/core'
import mitt from 'mitt'
import { type MutableRefObject, type RefObject, useEffect } from 'react'
import { kChartUtils, useKChartStore } from './ctx'
import { renderUtils } from './utils'

type ChartEvent = 'tooltip' | 'indicatorChange' | 'backTestChange'

export const chartEvent = {
  event: mitt<Record<ChartEvent, any>>(),
  create() {
    if (!this.event) {
      this.event = mitt<Record<ChartEvent, any>>()
    }
    return this.event
  }
}

export const useChartEvent = (
  index: number,
  params: {
    dom: RefObject<HTMLDivElement>
    chart: MutableRefObject<EChartsType | undefined>
    renderFn: MutableRefObject<() => void>
  }
) => {
  useEffect(() => {
    const sizeObserver = new ResizeObserver(() => {
      params.chart.current?.resize()
      params.renderFn.current()
    })

    sizeObserver.observe(params.dom.current!)

    const indicatorHandle = (p: { index: number }) => {
      if (p.index === index) {
        params.renderFn.current()
      }
    }

    const backTestHandle = (p: { index: number; data: StockRawRecord[] }) => {
      if (p.index === index) {
        renderUtils.calcIndicatorData(p.data, p.index).then(r => {
          kChartUtils.setMainData({
            index: p.index,
            data: p.data,
            timeIndex: useKChartStore.getState().state[p.index].timeIndex
          })
          kChartUtils.setIndicatorsData({
            index: p.index,
            data: r
          })
        })
      }
    }

    chartEvent.event.on('indicatorChange', indicatorHandle)
    chartEvent.event.on('backTestChange', backTestHandle)

    return () => {
      sizeObserver.disconnect()
      chartEvent.event.off('indicatorChange', indicatorHandle)
      chartEvent.event.off('backTestChange', backTestHandle)
    }
  }, [index])
}
