import type { StockRawRecord } from '@/api'
import { useIndicator } from '@/store'
import { chain, isEmpty, isPromise, listify } from 'radash'
import { stockUtils } from '../stock'
import {
  type IndicatorRawData,
  type IndicatorData,
  drawBandTransform,
  drawGradientTransform,
  drawIconTransform,
  drawLineTransform,
  drawNumberTransform,
  drawRectrelTransform,
  drawStickLineTransform,
  drawTextTransform
} from './transform'

export type { IndicatorData } from './transform'

const transformChain = chain(
  drawLineTransform,
  drawTextTransform,
  drawStickLineTransform,
  drawIconTransform,
  drawBandTransform,
  drawNumberTransform,
  drawRectrelTransform,
  drawGradientTransform
)

export class IndicatorUtils {
  static ins: IndicatorUtils
  private policyModule: Nullable<
    Awaited<ReturnType<typeof window.PolicyModule>> | ReturnType<typeof window.PolicyModule>
  >

  private coilingModule: Nullable<
    Awaited<ReturnType<typeof window.CoilingModule>> | ReturnType<typeof window.CoilingModule>
  >

  constructor() {
    this.policyModule = window.PolicyModule()
    this.policyModule.then(module => {
      this.policyModule = module
      console.log(`Policy Version: ${this.policyModule.libversion()}`)
    })

    this.coilingModule = window.CoilingModule()
    this.coilingModule.then(module => {
      this.coilingModule = module
    })
  }

  static init() {
    if (!IndicatorUtils.ins) {
      IndicatorUtils.ins = new IndicatorUtils()
    }
  }

  async getPolicyModule() {
    if (!this.policyModule) {
      throw new Error('PolicyModule is not ready')
    }

    if (isPromise(this.policyModule)) {
      return await this.policyModule
    }

    return this.policyModule
  }

  static async withPolicyModuleReady() {
    if (!IndicatorUtils.ins) {
      throw new Error('IndicatorUtils is not initialized')
    }
    if (isPromise(IndicatorUtils.ins.policyModule)) {
      return await IndicatorUtils.ins.policyModule
    }

    return IndicatorUtils.ins.policyModule
  }

  static async withCoilingModuleReady() {
    if (!IndicatorUtils.ins) {
      throw new Error('IndicatorUtils is not initialized')
    }
    if (isPromise(IndicatorUtils.ins.coilingModule)) {
      return await IndicatorUtils.ins.coilingModule
    }

    return IndicatorUtils.ins.coilingModule
  }

  static async calcIndicator(
    fml: { formula: string; symbal: string; indicatorId: string },
    data: StockRawRecord[],
    interval: number
  ) {
    await IndicatorUtils.withPolicyModuleReady()

    const module = IndicatorUtils.ins.policyModule as Awaited<ReturnType<typeof window.PolicyModule>>

    const rawData = data.map((item: StockRawRecord) => {
      return [Math.floor(stockUtils.parseTime(item[0]) / 1000), ...item.slice(1)] as unknown as StockRawRecord
    }, true)

    const indicator = useIndicator.getState().getIndicatorQueryParams(fml.indicatorId)

    if (!isEmpty(indicator)) {
      fml.formula = listify(indicator, (k, v) => `${k}:=${v};`).join('') + fml.formula
    }

    const result = (await module.policy_execute(fml, rawData, interval)) as {
      data: IndicatorRawData[]
      status: number
    }

    return result.data.map(item => {
      const r: IndicatorData = {
        name: item.name,
        color: item.color,
        width: item.linethick,
        draw: item.draw as any,
        drawData: transformChain(item).draw_data as any,
        lineType: item.style_type || ('solid' as any)
      }
      return r
    })
  }

  static async calcCoiling(data: StockRawRecord[], interval: number) {
    await IndicatorUtils.withCoilingModuleReady()

    const module = IndicatorUtils.ins.coilingModule as Awaited<ReturnType<typeof window.CoilingModule>>

    const _data = data.map((item: StockRawRecord) => {
      return [Math.floor(stockUtils.parseTime(item[0]) / 1000), ...item.slice(1)] as unknown as StockRawRecord
    }, true)

    return module.coiling_calculate(_data, data.length, interval)
  }
}
