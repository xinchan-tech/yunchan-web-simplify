import { NumSpan, NumSpanSubscribe, SubscribeSpan as _SubscribeSpan } from './num-span'
import {
  MarketValueSubscribeSpan,
  PercentSubscribeBlock,
  PercentSubscribeSpan,
  PriceSubscribeSpan,
  TurnoverSubscribeSpan,
  withTableCellBlink
} from './stock-span'

const PriceBlink = withTableCellBlink(PriceSubscribeSpan)
const PercentBlink = withTableCellBlink(PercentSubscribeSpan)
const PercentBlockBlink = withTableCellBlink(PercentSubscribeBlock)
const TurnoverBlink = withTableCellBlink(TurnoverSubscribeSpan)
const MarketValueBlink = withTableCellBlink(MarketValueSubscribeSpan)

const SubscribeSpan = _SubscribeSpan as typeof _SubscribeSpan & {
  Price: typeof PriceSubscribeSpan
  Percent: typeof PercentSubscribeSpan
  PercentBlock: typeof PercentSubscribeBlock
  Turnover: typeof TurnoverSubscribeSpan
  MarketValue: typeof MarketValueSubscribeSpan
  PriceBlink: typeof PriceBlink // adding PriceBlink
  PercentBlink: typeof PercentBlink // adding PercentBlink
  PercentBlockBlink: typeof PercentBlockBlink // adding PercentBlockBlink
  TurnoverBlink: typeof TurnoverBlink // adding TurnoverBlink
  MarketValueBlink: typeof MarketValueBlink // adding MarketValueBlink
}

SubscribeSpan.Price = PriceSubscribeSpan
SubscribeSpan.Percent = PercentSubscribeSpan
SubscribeSpan.PercentBlock = PercentSubscribeBlock
SubscribeSpan.Turnover = TurnoverSubscribeSpan
SubscribeSpan.MarketValue = MarketValueSubscribeSpan
SubscribeSpan.PriceBlink = PriceBlink
SubscribeSpan.PercentBlink = PercentBlink
SubscribeSpan.PercentBlockBlink = PercentBlockBlink
SubscribeSpan.TurnoverBlink = TurnoverBlink
SubscribeSpan.MarketValueBlink = MarketValueBlink

export { SubscribeSpan, NumSpanSubscribe, NumSpan }
