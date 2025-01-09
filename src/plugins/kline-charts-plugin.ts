import Decimal from "decimal.js"
import { registerYAxis } from "klinecharts"

const DEFAULT_TICK_COUNT = 8

/**
 * 定义价格Y轴
 */
registerYAxis({
  name: 'customYAxisPrice',
  minSpan: () => 10 ** -2,
  displayValueToText: (v) => {
    return Decimal.create(v).toFixed(3)
  },
  createTicks: (params) => {
    const {form, to} = params.range
    return params.defaultTicks
  }
})