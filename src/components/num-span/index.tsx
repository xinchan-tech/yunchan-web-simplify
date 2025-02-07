import { SubscribeSpan as _SubscribeSpan, NumSpanSubscribe, NumSpan } from './num-span'
import { PercentSubscribeSpan, PriceSubscribeSpan, TurnoverSubscribeSpan, MarketValueSubscribeSpan } from "./stock-span"

const SubscribeSpan = _SubscribeSpan as typeof _SubscribeSpan & {
  Price: typeof PriceSubscribeSpan
  Percent: typeof PercentSubscribeSpan
  Turnover: typeof TurnoverSubscribeSpan
  MarketValue: typeof MarketValueSubscribeSpan
}

SubscribeSpan.Price = PriceSubscribeSpan
SubscribeSpan.Percent = PercentSubscribeSpan
SubscribeSpan.Turnover = TurnoverSubscribeSpan
SubscribeSpan.MarketValue = MarketValueSubscribeSpan

export { SubscribeSpan, NumSpanSubscribe, NumSpan }