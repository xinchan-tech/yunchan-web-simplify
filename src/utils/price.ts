import Decimal from "decimal.js"

/**
 * 1000000 -> 100万
 * 1000000000 -> 10亿
 */
export const priceToCnUnit = (price?: number, decimal = 3) => {
  const unit = ['', '万', '亿', '万亿']
  const unitSteps = ['1', '10000', '100000000', '1000000000000']

  if(!price){
    return undefined
  }

  const num = new Decimal(price)

  if (num.isNaN()) return '--'

  for (let i = 0; i < unitSteps.length - 1; i++) {
    const step = new Decimal(unitSteps[i])

    if(num.gte(step) && num.lt(new Decimal(unitSteps[i+1]))){
      return num.div(step).toFixed(decimal) + unit[i]
    }
  }

  return num.div(new Decimal(unitSteps[3])).toFixed(2) + unit[3]
}

export const numToFixed = (price?: number, fixed = 3) => {
  if(!price){
    return undefined
  }
  return new Decimal(price).toFixed(fixed)
}