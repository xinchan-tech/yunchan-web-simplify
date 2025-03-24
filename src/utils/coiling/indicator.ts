import type { StockRawRecord } from '@/api'
import { useIndicator } from '@/store'
import { chain, isEmpty, listify } from 'radash'
import { stockUtils } from '../stock'
import {
  type IndicatorData,
  type IndicatorRawData,
  drawBandTransform,
  drawGradientTransform,
  drawIconTransform,
  drawLineTransform,
  drawNumberTransform,
  drawRectrelTransform,
  drawStickLineTransform,
  drawTextTransform
} from './transform'

let policyModule: ReturnType<typeof window.PolicyModule>

const getPolicyModule = async () => {
  if (!policyModule) {
    policyModule = window.PolicyModule()
  }

  return policyModule
}

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

/*
 * 计算指标
 */
export const calcIndicator = async (
  fml: { formula: string; symbal: string; indicatorId: string },
  data: StockRawRecord[],
  interval: number
) => {

  const module = await getPolicyModule()
  console.log(module.libversion())
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

  console.log(JSON.parse(JSON.stringify(result)))

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
