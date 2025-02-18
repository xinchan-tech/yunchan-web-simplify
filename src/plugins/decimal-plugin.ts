import Decimal from 'decimal.js'

Decimal.create = (value?: string | number) => {
  return new Decimal(value ?? '0')
}

Decimal.prototype.toShortCN = function (decimal?: number) {
  return priceToCnUnit(this, decimal ?? 2)
}

Decimal.prototype.toShort = function (decimal?: number) {
  return priceToShort(this, decimal ?? 2)
}

const priceToCnUnit = (price: Decimal, decimal = 3) => {
  const unit = ['', '万', '亿', '万亿']
  const unitSteps = ['1', '10000', '100000000', '1000000000000']

  const symbol = price.lessThan(0) ? '-' : ''

  const _price = price.abs()

  if (_price.isNaN()) return '--'

  for (let i = 0; i < unitSteps.length - 1; i++) {
    const step = new Decimal(unitSteps[i])

    if (_price.gte(step) && _price.lt(new Decimal(unitSteps[i + 1]))) {
      return symbol + _price.div(step).toFixed(decimal) + unit[i]
    }
  }

  return symbol + _price.div(unitSteps[3]).toFixed(decimal) + unit[3]
}

const priceToShort = (price: Decimal, decimal = 3) => {
  const unit = ['', 'K', 'M', 'B', 'T']
  const unitSteps = ['1', '1000', '1000000', '1000000000', '1000000000000']

  const symbol = price.lessThan(0) ? '-' : ''
  const _price = price.abs()

  if (_price.isNaN()) return '--'

  for (let i = 0; i < unitSteps.length - 1; i++) {
    const step = new Decimal(unitSteps[i])

    if (_price.gte(step) && _price.lt(new Decimal(unitSteps[i + 1]))) {
      return symbol + _price.div(step).toFixed(decimal) + unit[i]
    }
  }

  return symbol + _price.div(unitSteps[unitSteps.length - 1]).toFixed(decimal) + unit[unit.length - 1]
}

declare module 'decimal.js' {
  interface Decimal {
    toShortCN(decimal?: number): string
    toShort(decimal?: number): string
  }
}
