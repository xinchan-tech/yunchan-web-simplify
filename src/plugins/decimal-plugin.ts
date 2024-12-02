import Decimal from "decimal.js"

Decimal.create = (value?: string | number) => {
  return new Decimal(value ?? '0')
}