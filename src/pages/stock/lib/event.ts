import type { ChartOverlayType } from '@/components'
import type { DrawOverlayParams } from "@/components/jkn/jkn-chart/types"
import type { OverlayEvent } from "@/plugins/jkn-kline-chart"
import mitt from 'mitt'
import type { ChartStore, ChartType, CoilingIndicatorId, Indicator } from './store'

export type ChartEvents = {
  symbolChange: string
  activeChange: ChartStore
  intervalChange: number
  systemChange: string | undefined
  chartTypeChange: ChartType
  coilingChange: {
    type: 'add' | 'remove'
    coiling: CoilingIndicatorId[]
  }
  mainIndicatorChange: {
    type: 'add' | 'remove'
    indicator: Indicator
  }
  subIndicatorChange: {
    type: 'add' | 'remove'
    indicator: Indicator
  }
  stockCompareChange: {
    type: 'add' | 'remove'
    symbol: string
  }
  markOverlayChange: {
    type: 'add' | 'remove'
    params: {
      type: string
      mark: string
      title: string
    }
  }
  showIndicatorSetting: string
  yAxisChange: ChartStore['yAxis']
  drawStart: {
    type: ChartOverlayType,
    id?: string
    params: DrawOverlayParams,
    points?: {
      timestamp: number
      value: number
    }[]
  }
  drawEnd: {
    type: ChartOverlayType
    e: OverlayEvent<DrawOverlayParams>
  }
  drawCancel: string
  drawSelect: {
    type: ChartOverlayType
    e: OverlayEvent<DrawOverlayParams>
  }
  drawDeSelect: {
    type: ChartOverlayType
    e: OverlayEvent<DrawOverlayParams>
  }
  drawChange: {
    id: string
    params: DrawOverlayParams
  }
  drawLock: {
    id?: string
    lock: boolean
  }
  drawDelete: {
    id?: string | string[]
  },
  drawHide: boolean
}

export const chartEvent = {
  event: mitt<ChartEvents>(),
  create() {
    if (!this.event) {
      this.event = mitt<ChartEvents>()
    }
    return this.event
  },
  get() {
    return this.event
  },
  on<T extends keyof ChartEvents>(event: T, handler: (payload: ChartEvents[T]) => void) {
    this.event.on(event, handler)
    return () => this.event.off(event, handler)
  }
}

// export const useChartEvent = (
//   index: number,
//   params: {
//     dom: RefObject<HTMLDivElement>
//     chart: MutableRefObject<EChartsType | undefined>
//     renderFn: MutableRefObject<() => void>
//   }
// ) => {
//   useEffect(() => {
//     const sizeObserver = new ResizeObserver(() => {
//       params.chart.current?.resize()
//       params.renderFn.current()
//     })

//     sizeObserver.observe(params.dom.current!)

//     const indicatorHandle = (p: { index: number }) => {
//       if (p.index === index) {
//         params.renderFn.current()
//       }
//     }

//     const backTestHandle = (p: { index: number; data: StockRawRecord[] }) => {
//       if (p.index === index) {
//         renderUtils.calcIndicatorData(p.data, p.index).then(r => {
//           kChartUtils.setMainData({
//             index: p.index,
//             data: p.data,
//             timeIndex: useKChartStore.getState().state[p.index].timeIndex
//           })
//           kChartUtils.setIndicatorsData({
//             index: p.index,
//             data: r
//           })
//         })
//       }
//     }

//     chartEvent.event.on('indicatorChange', indicatorHandle)
//     chartEvent.event.on('backTestChange', backTestHandle)

//     return () => {
//       sizeObserver.disconnect()
//       chartEvent.event.off('indicatorChange', indicatorHandle)
//       chartEvent.event.off('backTestChange', backTestHandle)
//     }
//   }, [index])
// }
