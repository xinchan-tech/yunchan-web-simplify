
import { LatestValueBuffer } from './buff'
import { type SubscribeQuoteType, SubscribeTopic } from './type'
import type { SubscribeEvent } from '../subscribe/event'
import type { EventEmitter } from "@/utils/event"

const quoteActionResultParser = (data: any): SubscribeQuoteType => {
  const action = data.ev as string
  const [topic, ...raws] = data.q.split(',')
  const record = {
    symbol: topic,
    time: Number.parseInt(raws[0]),
    close: Number.parseFloat(raws[1]),
    preClose: Number.parseFloat(raws[2]),
    changePercent: Number.parseFloat(raws[3]),
    percent: (Number.parseFloat(raws[1]) - Number.parseFloat(raws[2])) / Number.parseFloat(raws[2]),
    volume: Number.parseFloat(raws[4]),
    turnover: Number.parseFloat(raws[5]),
    marketValue: Number.parseFloat(raws[6] ?? 0)
  }

  return {
    action,
    topic: topic as string,
    record,
    extra: data.d as string,
    symbol: topic
  }
}

export class QuoteBuffer extends LatestValueBuffer<SubscribeQuoteType> {
  private _topic: SubscribeTopic.Quote
  constructor(event: EventEmitter<SubscribeEvent>) {
    super(event)
    this._topic = SubscribeTopic.Quote
  }

  public get topic(): SubscribeTopic {
    return this._topic
  }

  parser(data: any): void {
    if (!this.isEqual(data)) return

    const result = quoteActionResultParser(data)

    this.addToBuffer({
      [result.symbol]: result
    })
  }

  handleData(data: Record<string, SubscribeQuoteType>): void {
    Object.entries(data).forEach(([key, value]) => {
      this.event.emit(`${this.topic}:${key}` as SubscribeTopic.QuoteTopic, value)
    })

    this.event.emit(this.topic as SubscribeTopic.Quote, data)
  }
}
