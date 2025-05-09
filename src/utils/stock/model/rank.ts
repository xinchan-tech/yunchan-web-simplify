import type { SubscribeEvent } from "../subscribe/event"
import { QueueBuffer } from "./buff"
import { type SubscribeRankType, SubscribeTopic } from "./type"
import type { EventEmitter } from "@/utils/event"

const rankActionResultParser = (data: any) => {
  const action = data.ev as string
  const r = data.ls as Record<number, number[]>

  return {
    action,
    topic: action as string,
    data: Object.entries(r).map(([key, value]) => {
      const [symbol, close, percent, volume, turnover, marketValue, prePercent, afterPercent] = value
      return {
        rank: Number.parseInt(key),
        symbol: String(symbol),
        close: close,
        percent,
        volume,
        turnover,
        marketValue,
        prePercent,
        afterPercent
      }
    })
  }
}

export class RankBuffer extends QueueBuffer<SubscribeRankType> {
  private _topic: SubscribeTopic.Rank
  constructor(event: EventEmitter<SubscribeEvent>){
    super(event)
    this._topic = SubscribeTopic.Rank
  }

  public get topic(): SubscribeTopic {
    return this._topic
  }

  parser(data: any): void {
    if(!this.isEqual(data)) return
    const result = rankActionResultParser(data)
    this.addToBuffer(result)
  }
  
  handleData(data: SubscribeRankType): void {
    this.event.emit(this.topic as SubscribeTopic.Rank, data)
  }
}