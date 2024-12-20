import Decimal from "decimal.js"

Decimal.create = (value?: string | number) => {
  return new Decimal(value ?? '0')
}

Decimal.prototype.toShortCN = function() {
  return priceToCnUnit(this, this.decimalPlaces())
}

const priceToCnUnit = (price: Decimal, decimal = 3) => {
  const unit = ['', '万', '亿', '万亿']
  const unitSteps = ['1', '10000', '100000000', '1000000000000']

  if(price.isNaN()) return '--'


  for (let i = 0; i < unitSteps.length - 1; i++) {
    const step = new Decimal(unitSteps[i])

    if(price.gte(step) && price.lt(new Decimal(unitSteps[i+1]))){
      return price.div(step).toFixed(decimal) + unit[i]
    }
  }

  return price.div(unitSteps[3]).toFixed(2) + unit[3]
}